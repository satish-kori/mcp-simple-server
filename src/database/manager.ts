import { Pool, PoolClient } from "pg";
import { Connector } from "@google-cloud/cloud-sql-connector";
import { DatabaseConfig, getDatabaseConfig, validateDatabaseConfig } from "../config/database.js";
import { QueryResult, DatabaseError } from "../types/database.js";

export class DatabaseManager {
  private static instance: DatabaseManager;
  private pool: Pool | null = null;
  private connector: Connector | null = null;
  private readonly config: DatabaseConfig;

  private constructor() {
    this.config = getDatabaseConfig();
    validateDatabaseConfig(this.config);
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.pool) {
      return;
    }

    try {
      if (this.config.instanceConnectionName) {
        await this.initializeCloudSQLConnection();
      } else {
        await this.initializeDirectConnection();
      }

      // Test the connection
      await this.testConnection();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new DatabaseError(`Database initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async initializeCloudSQLConnection(): Promise<void> {
    this.connector = new Connector();
    const clientOpts = await this.connector.getOptions({
      instanceConnectionName: this.config.instanceConnectionName!,
      ipType: 'PRIVATE' as any,
    });

    this.pool = new Pool({
      ...clientOpts,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      max: this.config.maxConnections,
    });
  }

  private async initializeDirectConnection(): Promise<void> {
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      max: this.config.maxConnections,
    });
  }

  private async testConnection(): Promise<void> {
    if (!this.pool) {
      throw new DatabaseError('Database pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      await client.query('SELECT NOW()');
    } finally {
      client.release();
    }
  }

  public async executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
    if (!this.pool) {
      await this.initialize();
    }

    const client = await this.pool!.connect();
    try {
      const result = await client.query(query, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        command: result.command,
        fields: result.fields,
      };
    } catch (error) {
      const dbError = new DatabaseError(`Query execution failed: ${error instanceof Error ? error.message : String(error)}`);
      if (error && typeof error === 'object' && 'code' in error) {
        dbError.code = (error as any).code;
      }
      throw dbError;
    } finally {
      client.release();
    }
  }

  public async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      await this.initialize();
    }
    return this.pool!.connect();
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    if (this.connector) {
      this.connector.close();
      this.connector = null;
    }
  }

  public isConnected(): boolean {
    return this.pool !== null;
  }
}
