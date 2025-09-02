import { DatabaseManager } from "./manager.js";
import { QueryResult, SchemaInfo } from "../types/database.js";

export class QueryService {
  private readonly dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  public async getSchemas(): Promise<string[]> {
    const result = await this.dbManager.executeQuery(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    return result.rows.map(row => row.schema_name);
  }

  public async getTables(schema: string = 'public'): Promise<string[]> {
    const result = await this.dbManager.executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = $1 AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `, [schema]);
    return result.rows.map(row => row.table_name);
  }

  public async getTableSchema(tableName?: string, schema: string = 'public'): Promise<SchemaInfo[]> {
    let query = `
      SELECT 
        t.table_name,
        t.table_schema,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.ordinal_position
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      WHERE t.table_schema = $1 AND t.table_type = 'BASE TABLE'
    `;
    
    const params: any[] = [schema];
    
    if (tableName) {
      query += ' AND t.table_name = $2';
      params.push(tableName);
    }
    
    query += ' ORDER BY t.table_name, c.ordinal_position';

    const result = await this.dbManager.executeQuery(query, params);
    
    // Group by table
    const tableMap = new Map<string, SchemaInfo>();
    
    for (const row of result.rows) {
      if (!tableMap.has(row.table_name)) {
        tableMap.set(row.table_name, {
          tableName: row.table_name,
          schema: row.table_schema,
          columns: []
        });
      }
      
      const table = tableMap.get(row.table_name)!;
      table.columns.push({
        columnName: row.column_name,
        dataType: row.data_type,
        isNullable: row.is_nullable === 'YES',
        columnDefault: row.column_default,
        characterMaximumLength: row.character_maximum_length,
        numericPrecision: row.numeric_precision,
        numericScale: row.numeric_scale,
      });
    }
    
    return Array.from(tableMap.values());
  }

  public async executeRawQuery(query: string, params: any[] = []): Promise<QueryResult> {
    return this.dbManager.executeQuery(query, params);
  }

  public async getSchemaContext(suggestedTables?: string[]): Promise<string> {
    try {
      let schemaInfo = '';
      
      if (suggestedTables && suggestedTables.length > 0) {
        for (const tableName of suggestedTables) {
          const schemas = await this.getTableSchema(tableName);
          if (schemas.length > 0) {
            const schema = schemas[0];
            schemaInfo += `\nTable: ${schema.tableName}\n`;
            schemaInfo += schema.columns.map(col => {
              const lengthPart = col.characterMaximumLength ? `(${col.characterMaximumLength})` : '';
              const nullPart = col.isNullable ? 'NULL' : 'NOT NULL';
              return `  ${col.columnName} (${col.dataType}${lengthPart}) ${nullPart}`;
            }).join('\n');
            schemaInfo += '\n';
          }
        }
      } else {
        const tables = await this.getTables();
        if (tables.length > 0) {
          schemaInfo = 'Available tables: ' + tables.join(', ');
        }
      }
      
      return schemaInfo || 'No schema information available.';
    } catch (error) {
      return `Error getting schema: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}
