export interface QueryResult {
  rows: any[];
  rowCount: number;
  command: string;
  fields: any[];
}

export interface SchemaInfo {
  tableName: string;
  columns: ColumnInfo[];
  schema: string;
}

export interface ColumnInfo {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  columnDefault: string | null;
  characterMaximumLength: number | null;
  numericPrecision: number | null;
  numericScale: number | null;
}

export type OutputFormat = 'table' | 'json' | 'csv';

export class DatabaseError extends Error {
  public code?: string;
  public detail?: string;
  public hint?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
  }
}

export interface NaturalLanguageQueryResult {
  generatedSQL: string;
  explanation: string;
  result: QueryResult;
  suggestions?: string[];
}
