import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { DatabaseManager } from '../../src/database/manager.js';
import { QueryService } from '../../src/database/query-service.js';

describe('DatabaseManager', () => {
  let dbManager: DatabaseManager;

  beforeAll(async () => {
    dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
  });

  afterAll(async () => {
    await dbManager.close();
  });

  it('should initialize database connection', async () => {
    expect(dbManager.isConnected()).toBe(true);
  });

  it('should execute simple query', async () => {
    const result = await dbManager.executeQuery('SELECT NOW() as current_time');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toHaveProperty('current_time');
  });

  it('should handle parameterized queries', async () => {
    const result = await dbManager.executeQuery(
      'SELECT $1 as value', 
      ['test']
    );
    expect(result.rows[0].value).toBe('test');
  });
});

describe('QueryService', () => {
  let queryService: QueryService;

  beforeAll(() => {
    queryService = new QueryService();
  });

  it('should get schemas', async () => {
    const schemas = await queryService.getSchemas();
    expect(Array.isArray(schemas)).toBe(true);
    expect(schemas.length).toBeGreaterThan(0);
  });

  it('should get tables in public schema', async () => {
    const tables = await queryService.getTables('public');
    expect(Array.isArray(tables)).toBe(true);
  });

  it('should get table schema', async () => {
    const schemas = await queryService.getTableSchema();
    expect(Array.isArray(schemas)).toBe(true);
  });
});
