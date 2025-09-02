#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testMCPServer() {
  console.log("🧪 Testing MCP Server...\n");

  // Create MCP client with stdio transport
  const transport = new StdioClientTransport({
    command: "node",
    args: ["build/main.js"],
    cwd: process.cwd()
  });

  const client = new Client({
    name: "test-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  try {
    // Connect to server
    await client.connect(transport);
    console.log("✅ Connected to MCP server");

    // Test 1: List available tools
    console.log("\n📋 Testing tools list...");
    const tools = await client.listTools();
    console.log("Available tools:", tools.tools.map(t => t.name));

    // Test 2: Test database schema tool
    console.log("\n🗄️ Testing database schema tool...");
    const schemaResult = await client.callTool({
      name: "get_database_schema",
      arguments: {}
    });
    console.log("Database schema preview:", schemaResult.content[0].text.substring(0, 200) + "...");

    // Test 3: Test SQL query execution
    console.log("\n🔍 Testing SQL query execution...");
    const queryResult = await client.callTool({
      name: "execute_sql_query",
      arguments: {
        query: "SELECT COUNT(*) as total_schemas FROM information_schema.schemata",
        format: "table"
      }
    });
    console.log("Query result:", queryResult.content[0].text);

    console.log("\n🎉 All database tests passed! Your PostgreSQL MCP server is working correctly!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    // Clean up
    await client.close();
    console.log("\n🧹 Test completed");
  }
}

// Run the test
testMCPServer().catch(console.error);
