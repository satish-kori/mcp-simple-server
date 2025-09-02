#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function getSchemaCount() {
  console.log("🔍 Getting schema count from database...\n");

  const transport = new StdioClientTransport({
    command: "node",
    args: ["build/index.js"],
    cwd: process.cwd()
  });

  const client = new Client({
    name: "schema-count-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log("✅ Connected to MCP server");

    // Use natural language query
    console.log("\n🤖 Using natural language query...");
    const naturalResult = await client.callTool({
      name: "natural_language_query",
      arguments: {
        question: "how many schemas are in the database?",
        format: "table"
      }
    });
    
    console.log("AI Analysis and SQL Suggestion:");
    console.log(naturalResult.content[0].text);

    // Execute the suggested SQL directly
    console.log("\n💾 Executing SQL to count schemas...");
    const sqlResult = await client.callTool({
      name: "execute_sql_query",
      arguments: {
        query: "SELECT COUNT(*) as schema_count FROM information_schema.schemata",
        format: "table"
      }
    });
    
    console.log("Schema Count Result:");
    console.log(sqlResult.content[0].text);

    // Also get the list of schemas
    console.log("\n📋 Getting list of all schemas...");
    const listResult = await client.callTool({
      name: "execute_sql_query",
      arguments: {
        query: "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name",
        format: "table"
      }
    });
    
    console.log("All Schemas:");
    console.log(listResult.content[0].text);

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.close();
  }
}

getSchemaCount().catch(console.error);
