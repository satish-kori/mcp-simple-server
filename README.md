# Simple Demo MCP Server

A demonstration MCP (Model Context Protocol) server built with TypeScript that provides basic tools and resources for AI assistants.

## 🚀 Features

### Tools
- **`get_current_time`** - Get the current date and time with optional timezone support
- **`calculate`** - Perform basic mathematical operations (add, subtract, multiply, divide)

#### Database Tools
- **`get_database_schema`** - Get database schema information for all tables or a specific table
- **`execute_sql_query`** - Execute SQL queries directly against the database with multiple output formats
- **`execute_ai_generated_sql`** - Execute AI-generated SQL queries with explanations
- **`natural_language_query`** - Convert natural language questions to SQL queries and execute them

### Resources
- **`server_info`** - Information about the MCP server and its capabilities

## 🗄️ Database Integration

This MCP server includes powerful database integration capabilities with PostgreSQL/Google Cloud SQL support.

### Database Configuration

Configure your database connection using environment variables in `.env`:

```bash
# Google Cloud SQL Configuration
DB_HOST=127.0.0.1
DB_PORT=5445
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password

# For Cloud SQL Private IP (optional)
INSTANCE_CONNECTION_NAME=your-project:region:instance-name

# For SSL connection (recommended for production)
DB_SSL=false

# Google Cloud Project (if using IAM authentication)
GOOGLE_CLOUD_PROJECT=your-project-id
```

### Database Tools Usage Examples

#### 1. Get Database Schema
```
AI: "Get the database schema"
→ Returns all tables and their structures

AI: "Show me the schema for the promotions table"
→ Returns detailed schema for specific table
```

#### 2. Execute SQL Queries
```
AI: "Execute SQL: SELECT COUNT(*) FROM promotions.promotion_t WHERE country_code = 'SE'"
→ Executes the query and returns results in table format

AI: "Run this query in JSON format: SELECT promo_id, promo_code FROM promotions.promotion_t LIMIT 5"
→ Returns results in JSON format
```

#### 3. Natural Language Queries
```
AI: "How many active promotions are there for Sweden?"
→ Converts to SQL and executes: finds active promotions for SE market

AI: "Show me all promotion types in the database"
→ Automatically generates and runs appropriate SQL query
```

#### 4. AI-Generated SQL
```
AI: "Generate SQL to find all promotions that expire in the next 7 days"
→ Creates appropriate SQL query with explanation and executes it
```

### Supported Output Formats
- **table** (default) - Formatted table output
- **json** - JSON array format
- **csv** - Comma-separated values

### Database Features
- **Schema Discovery** - Automatically discover all schemas, tables, and columns
- **Multiple Output Formats** - Table, JSON, or CSV output
- **Natural Language Processing** - Convert questions to SQL queries
- **Google Cloud SQL Support** - Native support for Cloud SQL with private IP
- **Connection Pooling** - Efficient database connection management
- **Error Handling** - Comprehensive error handling and reporting

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## 🛠️ Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

## 🔨 Build & Run

```bash
# Build the TypeScript code
npm run build

# Start the MCP server
npm run start

# Build and run in one step (development)
npm run dev

# Run tests
npm test
```

## 🧪 Testing

The project includes multiple test clients for different functionality:

### Basic Functionality Test
```bash
npm test
```
This runs the basic MCP server functionality tests.

### Database Connection Test
```bash
node test-direct-db.js
```
This will:
- Test direct database connection
- Display database configuration
- List all schemas in the database
- Show tables in the public schema

### Database Schema Test
```bash
node test-db-schema.js
```
Tests the MCP server's database schema tools.

### Schema Count Utility
```bash
node get-schema-count.js
```
Quickly get the count of schemas in your database.

## 🔧 VS Code Integration

This project is configured for VS Code with:

- **MCP Configuration** (`.vscode/mcp.json`) - For VS Code MCP integration
- **Tasks** - Build and run tasks accessible via `Ctrl+Shift+P` → "Tasks: Run Task"
- **Debug Configuration** - Press `F5` to debug

### Available Tasks:
- `Build MCP Server` - Compile TypeScript
- `Start MCP Server` - Build and run
- `Watch and Build` - Development mode

## 📡 Using with MCP Clients

### Configuration for Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "simple-demo-server": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-test/build/index.js"]
    }
  }
}
```

### Using with VS Code MCP Extension

The `.vscode/mcp.json` file configures the server for VS Code MCP support.

## 🔍 Example Usage

Once connected to an MCP client, you can:

### Basic Tools
```
AI: "What time is it?"
→ Server returns current time

AI: "Calculate 15 + 23"  
→ Server returns "15 add 23 = 38"

AI: "What can this server do?"
→ Server provides information from server_info resource
```

### Database Queries
```
AI: "Get the database schema"
→ Returns all database schemas and tables

AI: "How many schemas are in the database?"
→ Executes: SELECT schema_name FROM information_schema.schemata

AI: "Find all active promotions for Sweden"
→ Generates and executes SQL to find SE market promotions

AI: "Show me the structure of the promotions table"
→ Returns detailed column information for promotions.promotion_t

AI: "Execute SQL: SELECT COUNT(*) FROM promotions.promotion_t"
→ Directly executes the SQL query and returns results
```

## 📁 Project Structure

```
mcp-test/
├── .vscode/              # VS Code configuration
│   ├── mcp.json         # MCP server config
│   ├── tasks.json       # Build tasks
│   └── launch.json      # Debug config
├── src/
│   └── index.ts         # Main server code with database integration
├── build/
│   └── index.js         # Compiled output
├── test-client.js       # Test client for basic tools
├── test-direct-db.js    # Direct database connection test
├── test-db-schema.js    # Database schema testing
├── test-schema.js       # Schema validation tests
├── get-schema-count.js  # Schema counting utility
├── .env                 # Database configuration (create from .env.example)
├── package.json
├── tsconfig.json
└── README.md
```

## 🧑‍💻 Development

### Adding New Tools

```typescript
server.tool(
  "your_tool_name",
  {
    // Zod schema for parameters
    param1: z.string().describe("Description"),
    param2: z.number().optional()
  },
  {
    title: "Your Tool Title",
    description: "What your tool does"
  },
  async (args) => {
    // Your tool logic here
    return {
      content: [{
        type: "text",
        text: "Your response"
      }]
    };
  }
);
```

### Adding New Resources

```typescript
server.resource(
  "resource_name",
  "resource://uri",
  {
    name: "Resource Name", 
    description: "Resource description",
    mimeType: "text/plain"
  },
  async () => {
    return {
      contents: [{
        text: "Your resource content",
        uri: "resource://uri",
        mimeType: "text/plain"
      }]
    };
  }
);
```

## 📚 Learn More

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Server Examples](https://github.com/modelcontextprotocol/servers)

## 📄 License

MIT License - feel free to use and modify!
