#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Pool, PoolClient } from "pg";
import { Connector } from "@google-cloud/cloud-sql-connector";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Database configuration
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

// Initialize database connection
let dbPool: Pool | null = null;
let connector: Connector | null = null;

// Initialize database connection
async function initializeDatabase(): Promise<Pool> {
  if (dbPool) {
    return dbPool;
  }

  try {
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true'
    };

    // For Cloud SQL with private IP, you might need the connector
    if (process.env.INSTANCE_CONNECTION_NAME) {
      connector = new Connector();
      const clientOpts = await connector.getOptions({
        instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
        ipType: 'PRIVATE' as any, // Type assertion for compatibility
      });
      
      dbPool = new Pool({
        ...clientOpts,
        user: config.user,
        password: config.password,
        database: config.database,
        max: 5,
      });
    } else {
      // Direct connection (for public IP or local development)
      dbPool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        max: 5,
      });
    }

    // Test the connection
    const client = await dbPool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    console.error('Database connected successfully');
    return dbPool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

// Helper function to execute queries safely
async function executeQuery(query: string, params: any[] = []): Promise<any> {
  const pool = await initializeDatabase();
  const client = await pool.connect();
  
  try {
    const result = await client.query(query, params);
    return result;
  } finally {
    client.release();
  }
}

// Helper function to format query results
function formatQueryResult(result: any, format: string = 'table'): string {
  if (!result.rows || result.rows.length === 0) {
    return 'No rows returned.';
  }

  switch (format.toLowerCase()) {
    case 'json': {
      return JSON.stringify(result.rows, null, 2);
    }
    
    case 'csv': {
      const headers = Object.keys(result.rows[0]).join(',');
      const csvRows = result.rows.map((row: any) => 
        Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      ).join('\n');
      return `${headers}\n${csvRows}`;
    }
    
    case 'table':
    default: {
      // Simple table format
      const cols = Object.keys(result.rows[0]);
      const maxWidths = cols.map(col => 
        Math.max(col.length, ...result.rows.map((row: any) => 
          String(row[col] || '').length
        ))
      );
      
      const header = cols.map((col, i) => col.padEnd(maxWidths[i])).join(' | ');
      const separator = maxWidths.map(w => '-'.repeat(w)).join('-|-');
      const tableRows = result.rows.map((row: any) => 
        cols.map((col, i) => String(row[col] || '').padEnd(maxWidths[i])).join(' | ')
      ).join('\n');
      
      return `${header}\n${separator}\n${tableRows}`;
    }
  }
}

// Helper function to get database schema context for LLM prompts
async function getDatabaseSchemaContext(suggestedTables?: string[]): Promise<string> {
  try {
    let schemaInfo = '';
    
    if (suggestedTables && suggestedTables.length > 0) {
      // Get detailed schema for specific tables
      for (const tableName of suggestedTables) {
        const tableSchema = await executeQuery(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [tableName]);
        
        if (tableSchema.rows.length > 0) {
          schemaInfo += `\nTable: ${tableName}\n`;
          schemaInfo += tableSchema.rows.map((row: any) => {
            const lengthPart = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
            const nullPart = row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL';
            return `  ${row.column_name} (${row.data_type}${lengthPart}) ${nullPart}`;
          }).join('\n');
          schemaInfo += '\n';
        }
      }
    } else {
      // Get list of all tables
      const tables = await executeQuery(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      if (tables.rows.length > 0) {
        schemaInfo = 'Available tables: ' + tables.rows.map((row: any) => row.table_name).join(', ');
      }
    }
    
    return schemaInfo || 'No schema information available.';
  } catch (error) {
    return `Error getting schema: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Helper function to analyze natural language query and provide SQL suggestions
function getQueryTypeSuggestions(questionLower: string): string[] {
  const suggestions: string[] = [];
  
  if (questionLower.includes('count') || questionLower.includes('how many')) {
    suggestions.push('💡 This looks like a COUNT query. Consider using: SELECT COUNT(*) FROM table_name WHERE condition');
  }
  
  if (questionLower.includes('average') || questionLower.includes('avg')) {
    suggestions.push('💡 This looks like an AVERAGE query. Consider using: SELECT AVG(column_name) FROM table_name WHERE condition');
  }
  
  if (questionLower.includes('maximum') || questionLower.includes('max') || questionLower.includes('highest')) {
    suggestions.push('💡 This looks like a MAX query. Consider using: SELECT MAX(column_name) FROM table_name WHERE condition');
  }
  
  if (questionLower.includes('minimum') || questionLower.includes('min') || questionLower.includes('lowest')) {
    suggestions.push('💡 This looks like a MIN query. Consider using: SELECT MIN(column_name) FROM table_name WHERE condition');
  }
  
  if (questionLower.includes('group') || questionLower.includes('by category') || questionLower.includes('each')) {
    suggestions.push('💡 This might need GROUP BY. Consider using: SELECT column, COUNT(*) FROM table_name GROUP BY column');
  }
  
  if (questionLower.includes('join') || questionLower.includes('related') || questionLower.includes('together')) {
    suggestions.push('💡 This might need a JOIN. Consider using: SELECT * FROM table1 JOIN table2 ON table1.id = table2.foreign_id');
  }
  
  if (questionLower.includes('recent') || questionLower.includes('latest') || questionLower.includes('last')) {
    suggestions.push('💡 This might need ORDER BY with date/time. Consider using: SELECT * FROM table_name ORDER BY date_column DESC LIMIT 10');
  }
  
  if (questionLower.includes('between') || questionLower.includes('range')) {
    suggestions.push('💡 This might need a BETWEEN clause. Consider using: SELECT * FROM table_name WHERE column BETWEEN value1 AND value2');
  }
  
  return suggestions;
}

function generateSqlTemplate(questionLower: string): string {
  if (questionLower.includes('count') || questionLower.includes('how many')) {
    return 'SELECT COUNT(*) FROM your_table_name WHERE your_condition;';
  } else if (questionLower.includes('all') || questionLower.includes('list')) {
    return 'SELECT * FROM your_table_name WHERE your_condition ORDER BY your_column;';
  } else {
    return 'SELECT your_columns FROM your_table_name WHERE your_condition;';
  }
}

async function analyzeQuestionAndProvideSuggestions(question: string, suggestedTables?: string[]): Promise<string> {
  try {
    const schemaContext = await getDatabaseSchemaContext(suggestedTables);
    const questionLower = question.toLowerCase();
    const suggestions = getQueryTypeSuggestions(questionLower);
    
    // Extract potential column names (simple heuristic)
    const words = question.split(/\s+/);
    const potentialColumns = words.filter(word => 
      word.length > 2 && 
      !['the', 'and', 'for', 'are', 'all', 'any', 'can', 'how', 'what', 'where', 'when', 'why'].includes(word.toLowerCase())
    );
    
    let response = `Database Schema:\n${schemaContext}\n\n`;
    response += `Analysis of your question: "${question}"\n\n`;
    
    if (suggestions.length > 0) {
      response += `SQL Pattern Suggestions:\n${suggestions.join('\n')}\n\n`;
    }
    
    if (potentialColumns.length > 0) {
      response += `Potential columns/values mentioned: ${potentialColumns.join(', ')}\n\n`;
    }
    
    response += `Next Steps:\n`;
    response += `1. Review the database schema above\n`;
    response += `2. Identify the relevant tables and columns\n`;
    response += `3. Use the execute_sql_query tool with your SQL\n\n`;
    response += `Example SQL template based on your question:\n`;
    response += generateSqlTemplate(questionLower);
    
    return response;
  } catch (error) {
    return `Error analyzing question: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Create our MCP server instance
const server = new McpServer({
  name: "simple-demo-server",
  version: "1.0.0",
  capabilities: {
    tools: {},
    resources: {},
  },
});

// Tool 1: Get current time
server.tool(
  "get_current_time",
  {
    timezone: z.string().optional().describe("Timezone (optional, defaults to local)")
  },
  {
    title: "Get Current Time",
    description: "Get the current date and time"
  },
  async (args) => {
    const timezone = args.timezone || "local";
    const now = new Date();
    
    let timeString;
    if (timezone === "local") {
      timeString = now.toLocaleString();
    } else {
      try {
        timeString = now.toLocaleString("en-US", { timeZone: timezone });
      } catch (timezoneError) {
        // Handle timezone error gracefully
        console.error("Timezone error:", timezoneError);
        timeString = `Error: Invalid timezone "${timezone}". Using local time: ${now.toLocaleString()}`;
      }
    }
    
    return {
      content: [
        {
          type: "text",
          text: `Current time: ${timeString}`
        }
      ]
    };
  }
);

// Tool 2: Simple calculator
server.tool(
  "calculate",
  {
    operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("The mathematical operation to perform"),
    a: z.number().describe("First number"),
    b: z.number().describe("Second number")
  },
  {
    title: "Calculator",
    description: "Perform basic mathematical calculations"
  },
  async (args) => {
    const { operation, a, b } = args;
    let result: number;
    
    switch (operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        if (b === 0) {
          return {
            content: [{
              type: "text",
              text: "Error: Cannot divide by zero"
            }]
          };
        }
        result = a / b;
        break;
      default:
        return {
          content: [{
            type: "text", 
            text: `Error: Unknown operation "${operation}"`
          }]
        };
    }
    
    return {
      content: [
        {
          type: "text",
          text: `${a} ${operation} ${b} = ${result}`
        }
      ]
    };
  }
);

// Tool 3: Execute SQL Query
server.tool(
  "execute_sql_query",
  {
    query: z.string().describe("The SQL query to execute"),
    format: z.enum(["table", "json", "csv"]).optional().default("table").describe("Output format for results"),
    params: z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().describe("Query parameters for prepared statements")
  },
  {
    title: "Execute SQL Query",
    description: "Execute a SQL query against the PostgreSQL database"
  },
  async (args) => {
    try {
      const { query, format = "table", params = [] } = args;
      
      // Basic security check - prevent multiple statements
      if (query.includes(';') && query.trim().split(';').filter(s => s.trim()).length > 1) {
        return {
          content: [{
            type: "text",
            text: "Error: Multiple statements not allowed for security reasons"
          }]
        };
      }
      
      const result = await executeQuery(query, params);
      const formattedResult = formatQueryResult(result, format);
      
      return {
        content: [
          {
            type: "text",
            text: `Query executed successfully!\n\nRows affected: ${result.rowCount || 0}\n\nResults:\n${formattedResult}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Database error: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// Tool 4: Get Database Schema
server.tool(
  "get_database_schema",
  {
    table_name: z.string().optional().describe("Specific table name to get schema for (optional)")
  },
  {
    title: "Get Database Schema",
    description: "Get the schema information for database tables"
  },
  async (args) => {
    try {
      const { table_name } = args;
      
      let query: string;
      let params: any[] = [];
      
      if (table_name) {
        query = `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
        `;
        params = [table_name];
      } else {
        query = `
          SELECT 
            table_name,
            table_type,
            table_schema
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name
        `;
      }
      
      const result = await executeQuery(query, params);
      const formattedResult = formatQueryResult(result, 'table');
      
      return {
        content: [
          {
            type: "text",
            text: table_name 
              ? `Schema for table '${table_name}':\n\n${formattedResult}`
              : `Database tables:\n\n${formattedResult}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Database error: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// Tool 5: Natural Language Query
server.tool(
  "natural_language_query",
  {
    question: z.string().describe("Natural language question about the data"),
    format: z.enum(["table", "json", "csv"]).optional().default("table").describe("Output format for results"),
    suggested_tables: z.array(z.string()).optional().describe("Tables that might be relevant to the query")
  },
  {
    title: "Natural Language Database Query",
    description: "Ask questions about your data in natural language and get AI-generated SQL"
  },
  async (args) => {
    try {
      const { question, format = "table", suggested_tables } = args;
      
      // Get database schema context for the AI assistant
      const schemaContext = await getDatabaseSchemaContext(suggested_tables);
      
      // Prepare a comprehensive prompt for the AI assistant (Claude/current LLM)
      const prompt = `You are a SQL expert. Based on the following database schema and natural language question, please generate the appropriate PostgreSQL query.

DATABASE SCHEMA:
${schemaContext}

NATURAL LANGUAGE QUESTION: "${question}"

${suggested_tables ? `SUGGESTED TABLES: ${suggested_tables.join(', ')}` : ''}

Please provide:
1. The SQL query that answers the question
2. A brief explanation of what the query does
3. Any assumptions you made

Format your response as:
SQL:
[Your SQL query here]

EXPLANATION:
[Brief explanation]

ASSUMPTIONS:
[Any assumptions made]

Important notes:
- Use PostgreSQL syntax
- Include appropriate WHERE clauses if filtering is needed
- Use proper JOINs if multiple tables are involved
- Consider using LIMIT if the result set might be large
- Ensure the query is safe (no SQL injection risks)`;

      return {
        content: [
          {
            type: "text",
            text: prompt
          }
        ]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// Tool 6: AI-Generated SQL Execution
server.tool(
  "execute_ai_generated_sql",
  {
    sql_query: z.string().describe("The SQL query generated by AI to execute"),
    format: z.enum(["table", "json", "csv"]).optional().default("table").describe("Output format for results"),
    explanation: z.string().optional().describe("Brief explanation of what the query does")
  },
  {
    title: "Execute AI-Generated SQL",
    description: "Execute SQL query that was generated by AI for natural language questions"
  },
  async (args) => {
    try {
      const { sql_query, format = "table", explanation } = args;
      
      // Basic security validation
      const queryLower = sql_query.toLowerCase().trim();
      
      // Allow only SELECT statements for safety
      if (!queryLower.startsWith('select')) {
        return {
          content: [{
            type: "text",
            text: "Error: Only SELECT statements are allowed for security reasons. No INSERT, UPDATE, DELETE, or DDL operations permitted."
          }]
        };
      }
      
      // Prevent multiple statements
      if (sql_query.includes(';') && sql_query.trim().split(';').filter(s => s.trim()).length > 1) {
        return {
          content: [{
            type: "text",
            text: "Error: Multiple statements not allowed for security reasons"
          }]
        };
      }
      
      const result = await executeQuery(sql_query);
      const formattedResult = formatQueryResult(result, format);
      
      let response = '';
      if (explanation) {
        response += `Query Explanation: ${explanation}\n\n`;
      }
      response += `SQL Query: ${sql_query}\n\n`;
      response += `Results (${result.rowCount || 0} rows):\n${formattedResult}`;
      
      return {
        content: [
          {
            type: "text",
            text: response
          }
        ]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Database error: ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
);

// Resource: Server information
server.resource(
  "server_info",
  "server://info",
  {
    name: "Server Information",
    description: "Information about this MCP server",
    mimeType: "text/plain"
  },
  async () => {
    const info = `
PostgreSQL MCP Server with AI Integration
========================================

This MCP server provides database connectivity and AI-powered natural language query capabilities for PostgreSQL databases, including Google Cloud SQL.

Tools:
- get_current_time: Get the current date and time
- calculate: Perform basic math operations (add, subtract, multiply, divide)
- execute_sql_query: Execute SQL queries against the PostgreSQL database
- get_database_schema: Get schema information for database tables
- natural_language_query: Convert natural language questions to SQL using AI
- execute_ai_generated_sql: Execute SQL queries generated by AI (SELECT only)

AI-Powered Features:
- Natural language to SQL conversion using the current LLM context
- Automatic schema analysis and context provision
- Intelligent SQL generation with explanations
- Safe execution with security restrictions (SELECT-only)

Database Features:
- PostgreSQL connection with connection pooling
- Google Cloud SQL support with Cloud SQL Connector
- Multiple output formats (table, JSON, CSV)
- Prepared statement support for security
- Schema introspection capabilities

Resources:
- server_info: This information page

Workflow for Natural Language Queries:
1. Use natural_language_query tool with your question
2. AI analyzes schema and generates SQL with explanation
3. Use execute_ai_generated_sql tool to run the generated SQL
4. Get formatted results in your preferred format

Configuration:
Configure database connection using environment variables:
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- For Cloud SQL: INSTANCE_CONNECTION_NAME
- Optional: DB_SSL, GOOGLE_CLOUD_PROJECT

Server Details:
- Name: simple-demo-server
- Version: 1.0.0
- Language: TypeScript/Node.js
- SDK: @modelcontextprotocol/sdk
- Database: PostgreSQL with pg driver
- AI: Integrated with current LLM context
`;

    return {
      contents: [
        {
          text: info.trim(),
          uri: "server://info",
          mimeType: "text/plain"
        }
      ]
    };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Simple Demo MCP Server running on stdio");
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.error("Shutting down server...");
  
  // Close database connections
  if (dbPool) {
    await dbPool.end();
    console.error("Database pool closed");
  }
  
  if (connector) {
    connector.close();
    console.error("Cloud SQL connector closed");
  }
  
  await server.close();
  process.exit(0);
});

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
