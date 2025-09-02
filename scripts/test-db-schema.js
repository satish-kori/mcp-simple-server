#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function getPostgreSQLSchemas() {
  console.log("🗄️ Getting PostgreSQL Database Schemas...\n");

  const transport = new StdioClientTransport({
    command: "node",
    args: ["build/main.js"],
    cwd: process.cwd()
  });

  const client = new Client({
    name: "schema-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log("✅ Connected to MCP server");

    // First, let's list all available tools
    const tools = await client.listTools();
    console.log("\n📋 Available MCP tools:");
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // Test 1: Get list of all schemas in the database
    console.log("\n🏗️ Getting all database schemas...");
    try {
      const schemasResult = await client.callTool({
        name: "execute_sql_query",
        arguments: {
          query: "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name",
          format: "table"
        }
      });
      console.log("Database Schemas:");
      console.log(schemasResult.content[0].text);
    } catch (error) {
      console.log("❌ Error getting schemas:", error.message);
      console.log("Full error:", error);
    }

    // Test 2: Get all tables using the dedicated schema tool
    console.log("\n📊 Getting all tables using get_database_schema tool...");
    try {
      const tablesResult = await client.callTool({
        name: "get_database_schema",
        arguments: {}
      });
      console.log("Database Tables:");
      console.log(tablesResult.content[0].text);
    } catch (error) {
      console.log("❌ Error getting tables:", error.message);
    }

    // Test 3: Get tables in the public schema specifically
    console.log("\n🏛️ Getting tables in public schema...");
    try {
      const publicTablesResult = await client.callTool({
        name: "execute_sql_query",
        arguments: {
          query: "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
          format: "table"
        }
      });
      console.log("Public Schema Tables:");
      console.log(publicTablesResult.content[0].text);
    } catch (error) {
      console.log("❌ Error getting public tables:", error.message);
    }

    // Test 4: Get detailed schema info for all tables
    console.log("\n🔍 Getting detailed schema information...");
    try {
      const detailedSchemaResult = await client.callTool({
        name: "execute_sql_query",
        arguments: {
          query: `
            SELECT 
              schemaname as schema,
              tablename as table_name,
              tableowner as owner
            FROM pg_tables 
            WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
            ORDER BY schemaname, tablename
          `,
          format: "table"
        }
      });
      console.log("Detailed Schema Information:");
      console.log(detailedSchemaResult.content[0].text);
    } catch (error) {
      console.log("❌ Error getting detailed schema:", error.message);
    }

    console.log("\n🎉 Schema query completed!");

  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  } finally {
    await client.close();
  }
}

getPostgreSQLSchemas().catch(console.error);
