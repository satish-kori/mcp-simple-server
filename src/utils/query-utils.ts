import { QueryResult, OutputFormat } from "../types/database.js";

export class ResultFormatter {
  public static format(result: QueryResult, format: OutputFormat = 'table'): string {
    if (!result.rows || result.rows.length === 0) {
      return 'No rows returned.';
    }

    switch (format.toLowerCase() as OutputFormat) {
      case 'json':
        return JSON.stringify(result.rows, null, 2);
      
      case 'csv':
        return this.formatAsCsv(result);
      
      case 'table':
      default:
        return this.formatAsTable(result);
    }
  }

  private static formatAsCsv(result: QueryResult): string {
    const headers = Object.keys(result.rows[0]).join(',');
    const csvRows = result.rows.map((row: any) => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    ).join('\n');
    return `${headers}\n${csvRows}`;
  }

  private static formatAsTable(result: QueryResult): string {
    const cols = Object.keys(result.rows[0]);
    const maxWidths = cols.map(col => 
      Math.max(col.length, ...result.rows.map((row: any) => 
        String(row[col] || '').length
      ))
    );
    
    const header = cols.map((col, i) => col.padEnd(maxWidths[i])).join(' | ');
    const separator = maxWidths.map(w => '-'.repeat(w)).join('-|-');
    const tableRows = result.rows.map((row: any) => 
      cols.map((col, i) => String(row[col] || '').padEnd(maxWidths[i])).join(' | ')
    ).join('\n');
    
    return `${header}\n${separator}\n${tableRows}`;
  }
}

export class QueryAnalyzer {
  public static getQuerySuggestions(questionLower: string): string[] {
    const suggestions: string[] = [];
    
    if (questionLower.includes('count') || questionLower.includes('how many')) {
      suggestions.push('💡 This looks like a COUNT query. Consider using: SELECT COUNT(*) FROM table_name WHERE condition');
    }
    
    if (questionLower.includes('average') || questionLower.includes('avg')) {
      suggestions.push('💡 This looks like an AVERAGE query. Consider using: SELECT AVG(column_name) FROM table_name WHERE condition');
    }
    
    if (questionLower.includes('sum') || questionLower.includes('total')) {
      suggestions.push('💡 This looks like a SUM query. Consider using: SELECT SUM(column_name) FROM table_name WHERE condition');
    }
    
    if (questionLower.includes('group') || questionLower.includes('by')) {
      suggestions.push('💡 Consider using GROUP BY for aggregated results: SELECT column, COUNT(*) FROM table_name GROUP BY column');
    }
    
    if (questionLower.includes('join') || questionLower.includes('related')) {
      suggestions.push('💡 For joining tables: SELECT * FROM table1 t1 JOIN table2 t2 ON t1.id = t2.foreign_id');
    }
    
    return suggestions;
  }

  public static isSelectQuery(sql: string): boolean {
    const trimmed = sql.trim().toLowerCase();
    return trimmed.startsWith('select') || trimmed.startsWith('with');
  }

  public static isSafeQuery(sql: string): boolean {
    const dangerous = ['drop', 'delete', 'update', 'insert', 'alter', 'create', 'truncate'];
    const normalized = sql.toLowerCase().replace(/\s+/g, ' ');
    
    return !dangerous.some(keyword => 
      normalized.includes(` ${keyword} `) || 
      normalized.startsWith(`${keyword} `)
    );
  }
}
