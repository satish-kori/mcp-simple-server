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

    // Test 2: Test get_current_time tool
    console.log("\n⏰ Testing get_current_time tool...");
    const timeResult = await client.callTool({
      name: "get_current_time",
      arguments: {}
    });
    console.log("Time result:", timeResult.content[0].text);

    // Test 3: Test calculator tool
    console.log("\n🧮 Testing calculator tool...");
    const calcResult = await client.callTool({
      name: "calculate",
      arguments: {
        operation: "add",
        a: 15,
        b: 23
      }
    });
    console.log("Calculation result:", calcResult.content[0].text);

    // Test 4: List resources
    console.log("\n📚 Testing resources list...");
    const resources = await client.listResources();
    console.log("Available resources:", resources.resources.map(r => r.name));

    // Test 5: Read server info resource
    console.log("\n📖 Testing server info resource...");
    const resourceResult = await client.readResource({
      uri: "server://info"
    });
    console.log("Server info preview:", resourceResult.contents[0].text.substring(0, 100) + "...");

    console.log("\n🎉 All tests passed! Your MCP server is working correctly!");

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
