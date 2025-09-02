#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testDatabaseSchema() {
  console.log("🗄️ Testing Database Schema Access...\n");

  const transport = new StdioClientTransport({
    command: "node",
    args: ["build/index.js"],
    cwd: process.cwd()
  });

  const client = new Client({
    name: "schema-test-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log("✅ Connected to MCP server");

    // List all available tools
    const tools = await client.listTools();
    console.log("\n📋 Available tools:");
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // Test database schema tool if available
    const schemaTools = tools.tools.filter(t => t.name.includes('schema') || t.name.includes('database'));
    
    if (schemaTools.length > 0) {
      console.log("\n🗂️ Testing database schema tools...");
      
      for (const tool of schemaTools) {
        console.log(`\nTesting tool: ${tool.name}`);
        try {
          const result = await client.callTool({
            name: tool.name,
            arguments: {}
          });
          console.log("Result:", result.content[0].text.substring(0, 200) + "...");
        } catch (error) {
          console.log("Error:", error.message);
        }
      }
    } else {
      console.log("\n❌ No database schema tools found");
    }

    // Test SQL execution tool if available
    const sqlTools = tools.tools.filter(t => t.name.includes('sql') || t.name.includes('execute'));
    
    if (sqlTools.length > 0) {
      console.log("\n💾 Testing SQL execution tools...");
      
      for (const tool of sqlTools) {
        console.log(`\nTesting tool: ${tool.name}`);
        try {
          // Try a simple schema query
          const result = await client.callTool({
            name: tool.name,
            arguments: {
              query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5"
            }
          });
          console.log("Schema query result:", result.content[0].text.substring(0, 300) + "...");
        } catch (error) {
          console.log("Error:", error.message);
        }
      }
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await client.close();
  }
}

testDatabaseSchema().catch(console.error);
