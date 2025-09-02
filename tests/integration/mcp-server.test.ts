/**
 * Integration test for MCP Server
 * This test verifies the end-to-end functionality of the MCP server
 */

import { DatabaseManager } from '../../src/database/manager.js';
import { 
  getDatabaseSchema,
  executeSqlQuery,
  naturalLanguageQuery
} from '../../src/tools/database-tools.js';

describe('MCP Server Integration Tests', () => {
  let dbManager: DatabaseManager;

  beforeAll(async () => {
    dbManager = DatabaseManager.getInstance();
    // Wait a bit for database to initialize
    // Poll for database readiness instead of using a fixed delay
    let ready = false;
    const maxAttempts = 10;
    let attempts = 0;
    while (!ready && attempts < maxAttempts) {
      try {
        await dbManager.executeQuery('SELECT 1');
        ready = true;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
    }
    if (!ready) {
      throw new Error('Database did not become ready in time');
    }
  });

  afterAll(async () => {
    await dbManager.close();
  });

  describe('Database Tools Integration', () => {
    it('should get database schema without errors', async () => {
      const result = await getDatabaseSchema({});
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toContain('Error');
    });

    it('should execute a simple SQL query', async () => {
      const result = await executeSqlQuery({
        query: 'SELECT 1 as test_value',
        format: 'table'
      });
      expect(result).toContain('Query executed successfully');
      expect(result).toContain('test_value');
    });

    it('should handle natural language queries', async () => {
      const result = await naturalLanguageQuery({
        question: 'How many tables are in the database?',
        format: 'table'
      });
      expect(typeof result).toBe('string');
      expect(result).toContain('Natural Language Query Analysis');
    });

    it('should reject unsafe SQL queries', async () => {
      const result = await executeSqlQuery({
        query: 'DROP TABLE users',
        format: 'table'
      });
      expect(result).toContain('Only SELECT queries are allowed');
    });
  });
});

// Simple test helper for manual testing
export async function runQuickHealthCheck(): Promise<boolean> {
  try {
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    
    // Test basic connectivity
    const result = await dbManager.executeQuery('SELECT NOW() as health_check');
    console.log('Health check passed:', result.rows[0]);
    
    await dbManager.close();
    return true;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
