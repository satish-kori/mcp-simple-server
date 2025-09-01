#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

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
Simple Demo MCP Server
=====================

This is a demonstration MCP server that provides:

Tools:
- get_current_time: Get the current date and time
- calculate: Perform basic math operations (add, subtract, multiply, divide)

Resources:
- server_info: This information page

Created as a learning example for MCP development.
Built with the Model Context Protocol SDK.

Server Details:
- Name: simple-demo-server
- Version: 1.0.0
- Language: TypeScript/Node.js
- SDK: @modelcontextprotocol/sdk
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
  await server.close();
  process.exit(0);
});

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
