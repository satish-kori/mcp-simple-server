# PostgreSQL MCP Server

A specialized MCP (Model Context Protocol) server for PostgreSQL database operations, built with TypeScript. This server enables AI assistants to interact with PostgreSQL databases through natural language queries, schema inspection, and safe SQL execution.

## 🚀 Features

### Database Tools
- **`get_database_schema`** - Inspect database schemas, tables, and structure
- **`execute_sql_query`** - Execute SQL queries with multiple output formats (table, JSON, CSV)
- **`execute_ai_generated_sql`** - Execute AI-generated SQL queries with explanations
- **`natural_language_query`** - Convert natural language questions to SQL and execute them

### Key Capabilities
- 🗄️ **Multi-Schema Support** - Works with complex database structures
- 🔒 **Safe Query Execution** - Built-in SQL injection protection
- 📊 **Multiple Output Formats** - Table, JSON, and CSV output options
- 🌐 **Google Cloud SQL Support** - Direct and Cloud SQL Proxy connections
- 🔄 **Connection Pooling** - Efficient database connection management
- 🎯 **Natural Language Processing** - Convert English questions to SQL

## 🏗️ Architecture

This server follows a clean, modular architecture that evolved from a monolithic structure:

```
src/
├── main.ts                 # MCP server entry point
├── config/
│   └── database.ts         # Database configuration management
├── database/
│   ├── manager.ts          # Connection pool and lifecycle management
│   └── query-service.ts    # High-level database operations
├── tools/
│   └── database-tools.ts   # MCP tool implementations
├── types/
│   └── database.ts         # TypeScript type definitions
└── utils/
    └── query-utils.ts      # Query formatting and utilities
```

### Design Principles
- **Single Responsibility** - Each module has a focused purpose
- **Type Safety** - Comprehensive TypeScript coverage
- **Error Handling** - Robust error management throughout
- **Testability** - Modular design enables thorough testing

## 🗄️ Database Configuration

Configure your PostgreSQL connection using environment variables in `.env`:

```bash
# PostgreSQL Connection
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password

# Google Cloud SQL (optional)
INSTANCE_CONNECTION_NAME=your-project:region:instance-name

# SSL Configuration (recommended for production)
DB_SSL=false

# Google Cloud Project (for IAM authentication)
GOOGLE_CLOUD_PROJECT=your-project-id
```

## 💻 Usage Examples
→ Returns all tables and their structures

AI: "Show me the schema for the customers table"
→ Returns detailed schema for specific table
```

#### 2. Execute SQL Queries
```
AI: "Execute SQL: SELECT COUNT(*) FROM customers.customer_t WHERE country_code = 'SE'"
→ Executes the query and returns results in table format

AI: "Run this query in JSON format: SELECT cutomer_id, customer_code FROM customers.customer_t LIMIT 5"
→ Returns results in JSON format
```

#### 3. Natural Language Queries
```
AI: "How many active customers are there for Sweden?"
→ Converts to SQL and executes: finds active customers for SE market

AI: "Show me all customer types in the database"
→ Automatically generates and runs appropriate SQL query
```

#### 4. AI-Generated SQL
```
AI: "Generate SQL to find all customers that expire in the next 7 days"
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

## � Installation & Setup

### Prerequisites
- **Node.js** 18+ 
- **PostgreSQL** database (local or cloud)
- **TypeScript** (installed globally or via npm)

### Quick Start

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd mcp-test
npm install
```

2. **Configure environment:**
```bash
# Create .env file with your database configuration
cp .env.example .env
# Edit .env with your PostgreSQL connection details
```

3. **Build and test:**
```bash
# Build the project
npm run build

# Test database connection
npm run test:db

# Start the server
npm start
```

4. **Development mode:**
```bash
# Watch mode with auto-rebuild
npm run dev
```

### Environment Configuration

Create a `.env` file with your database connection details:

```env
# PostgreSQL Configuration
PGHOST=your-host
PGPORT=5432
PGDATABASE=your-database
PGUSER=your-username
PGPASSWORD=your-password

# Optional: Google Cloud SQL specific
CLOUD_SQL_CONNECTION_NAME=your-project:region:instance
```

## 🧪 Testing

The project includes comprehensive testing scripts:

### Database Tests
```bash
# Test database connection
npm run test:db

# Test database schema discovery
npm run test:schema

# Test MCP client integration
npm run test:client

# Run all tests
npm test
```

### Manual Testing Scripts
```bash
# Direct database connection test
node scripts/test-direct-db.js

# Schema validation
node scripts/test-db-schema.js

# Get schema statistics
node scripts/get-schema-count.js
```

## 🔧 Key Benefits & Features

### **Architecture Excellence**
- 🏗️ **Modular Design**: Clean separation of concerns with dedicated modules for database, tools, and utilities
- 🔍 **Single Responsibility**: Each component has a clear, focused purpose
- 🔒 **Type Safety**: 100% TypeScript coverage prevents runtime errors
- 🛡️ **Error Handling**: Comprehensive error management throughout the stack

### **Database Capabilities**
- 🗃️ **PostgreSQL Specialized**: Optimized for PostgreSQL databases with advanced features
- 🔄 **Connection Pooling**: Efficient database connection management
- 🌐 **Google Cloud SQL**: Native support for Cloud SQL with private IP connections
- 🔍 **Schema Discovery**: Automatic discovery of all schemas, tables, and columns
- 🛡️ **SQL Security**: Protection against SQL injection with query validation

### **Developer Experience**
- 🎯 **Clear Structure**: Easy to understand and navigate codebase
- 🔄 **Hot Reload**: Development mode with automatic rebuilding
- 🐛 **Better Debugging**: Source maps and proper error stack traces
- 📋 **Linting**: Consistent code style and best practices
- 🧪 **Comprehensive Testing**: Unit and integration tests ensure stability

### **Production Ready**
- ⚡ **Performance**: Optimized queries and connection management
- 📊 **Multiple Formats**: Support for table, JSON, and CSV output
- 🔧 **Configuration Management**: Environment-specific settings centralized
- 📝 **Documentation**: Clear interfaces and comprehensive guides

## 📡 Using with MCP Clients

### Configuration for Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "sql-assistant-server": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-test/build/main.js"]
    }
  }
}
```

### VS Code Integration

This project is configured for VS Code with:

- **MCP Configuration** (`.vscode/mcp.json`) - For VS Code MCP integration  
- **Tasks** - Build and run tasks accessible via `Ctrl+Shift+P` → "Tasks: Run Task"
- **Debug Configuration** - Press `F5` to debug

### Available Tasks:
- `Build MCP Server` - Compile TypeScript
- `Start MCP Server` - Build and run  
- `Watch and Build` - Development mode

##  Project Structure

```
mcp-test/
├── .vscode/              # VS Code configuration
│   ├── mcp.json         # MCP server config
│   ├── tasks.json       # Build tasks
│   └── launch.json      # Debug config
├── src/                 # Source code (TypeScript)
│   ├── main.ts          # Main server entry point
│   ├── config/          # Configuration management
│   │   └── database.ts  # Database configuration
│   ├── database/        # Database layer
│   │   ├── manager.ts   # Connection management
│   │   └── query-service.ts # Query operations
│   ├── tools/           # MCP tools implementation
│   │   └── database-tools.ts # Database tools
│   ├── types/           # TypeScript type definitions
│   │   └── database.ts  # Database-related types
│   └── utils/           # Utility functions
│       └── query-utils.ts # Query formatting and analysis
├── build/               # Compiled JavaScript output
├── scripts/             # Utility scripts
│   ├── setup-dev.sh    # Development setup
│   ├── test-direct-db.js    # Database connection test
│   ├── test-db-schema.js    # Database schema testing
│   └── test-client.js   # MCP client testing
├── .env                 # Environment variables (create from .env.example)
├── Dockerfile          # Docker configuration
├── package.json
├── tsconfig.json
└── README.md
```

## 🧑‍💻 Development

### Testing

The project includes comprehensive testing scripts:

```bash
# Test database connection
npm run test:db

# Test database schema
npm run test:schema

# Test MCP client integration
npm run test:client

# Run all tests
npm test
```

### Adding New Database Tools

```typescript
// In src/tools/database-tools.ts
server.tool(
  "your_database_tool",
  {
    query: z.string().describe("SQL query or natural language request"),
    format: z.enum(["table", "json", "csv"]).default("table")
  },
  {
    title: "Your Database Tool",
    description: "Custom database operation"
  },
  async (args) => {
    const queryService = DatabaseManager.getInstance().getQueryService();
    const results = await queryService.executeQuery(args.query);
    
    return {
      content: [{
        type: "text", 
        text: formatResults(results, args.format)
      }]
    };
  }
);
```

### Environment Configuration

Create a `.env` file with your database connection details:

```env
# PostgreSQL Configuration
PGHOST=your-host
PGPORT=5432
PGDATABASE=your-database
PGUSER=your-username
PGPASSWORD=your-password

# Optional: Google Cloud SQL specific
CLOUD_SQL_CONNECTION_NAME=your-project:region:instance
```

### Docker Support

Build and run the server in Docker:

```bash
# Build image
docker build -t mcp-postgres-server .

# Run container
docker run -p 3000:3000 --env-file .env mcp-postgres-server
```

## 📚 Learn More

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Server Examples](https://github.com/modelcontextprotocol/servers)

## 📄 License

MIT License - feel free to use and modify!
