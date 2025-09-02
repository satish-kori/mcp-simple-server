#!/usr/bin/env node

// Simple database connection test
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

async function testDatabaseConnection() {
  console.log("🔌 Testing database connection...");
  
  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };

  console.log("Database config (without password):", {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    ssl: config.ssl
  });

  const pool = new Pool(config);

  try {
    console.log("Attempting to connect...");
    const client = await pool.connect();
    console.log("✅ Connected successfully!");

    // Test query - get schemas
    console.log("\n📋 Getting database schemas...");
    const schemasResult = await client.query("SELECT schema_name FROM information_schema.schemata ORDER BY schema_name");
    console.log("Schemas found:", schemasResult.rows.length);
    schemasResult.rows.forEach(row => {
      console.log(`  - ${row.schema_name}`);
    });

    // Test query - get tables in public schema
    console.log("\n📊 Getting tables in public schema...");
    const tablesResult = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log("Tables found:", tablesResult.rows.length);
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    client.release();
    await pool.end();
    
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("Full error:", error);
  }
}

testDatabaseConnection();
