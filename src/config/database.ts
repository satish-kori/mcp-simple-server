import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  instanceConnectionName?: string;
  googleCloudProject?: string;
  maxConnections: number;
}

export function getDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
    googleCloudProject: process.env.GOOGLE_CLOUD_PROJECT,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '5'),
  };
}

export function validateDatabaseConfig(config: DatabaseConfig): void {
  if (!config.host) {
    throw new Error('Database host is required');
  }
  if (!config.database) {
    throw new Error('Database name is required');
  }
  if (!config.user) {
    throw new Error('Database user is required');
  }
  if (!config.password) {
    throw new Error('Database password is required');
  }
}
