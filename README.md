# Simple Demo MCP Server

A demonstration MCP (Model Context Protocol) server built with TypeScript that provides basic tools and resources for AI assistants.

## 🚀 Features

### Tools
- **`get_current_time`** - Get the current date and time with optional timezone support
- **`calculate`** - Perform basic mathematical operations (add, subtract, multiply, divide)

### Resources
- **`server_info`** - Information about the MCP server and its capabilities

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

The project includes a test client that verifies all functionality:

```bash
npm test
```

This will:
- Build the server
- Start a test client
- Test all tools and resources
- Display results

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

```
AI: "What time is it?"
→ Server returns current time

AI: "Calculate 15 + 23"  
→ Server returns "15 add 23 = 38"

AI: "What can this server do?"
→ Server provides information from server_info resource
```

## 📁 Project Structure

```
mcp-test/
├── .vscode/           # VS Code configuration
│   ├── mcp.json      # MCP server config
│   ├── tasks.json    # Build tasks
│   └── launch.json   # Debug config
├── src/
│   └── index.ts      # Main server code
├── build/
│   └── index.js      # Compiled output
├── test-client.js    # Test client
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
