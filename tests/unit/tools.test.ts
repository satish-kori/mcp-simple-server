import { calculate } from '../../src/tools/calculator.js';
import { getCurrentTime } from '../../src/tools/time.js';

describe('Calculator Tool', () => {
  it('should add numbers correctly', () => {
    const result = calculate({ operation: 'add', a: 5, b: 3 });
    expect(result).toBe('5 add 3 = 8');
  });

  it('should subtract numbers correctly', () => {
    const result = calculate({ operation: 'subtract', a: 10, b: 4 });
    expect(result).toBe('10 subtract 4 = 6');
  });

  it('should multiply numbers correctly', () => {
    const result = calculate({ operation: 'multiply', a: 6, b: 7 });
    expect(result).toBe('6 multiply 7 = 42');
  });

  it('should divide numbers correctly', () => {
    const result = calculate({ operation: 'divide', a: 15, b: 3 });
    expect(result).toBe('15 divide 3 = 5');
  });

  it('should throw error on division by zero', () => {
    expect(() => {
      calculate({ operation: 'divide', a: 10, b: 0 });
    }).toThrow('Cannot divide by zero');
  });
});

describe('Time Tool', () => {
  it('should return current time', () => {
    const result = getCurrentTime({});
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle timezone', () => {
    const result = getCurrentTime({ timezone: 'UTC' });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle invalid timezone gracefully', () => {
    const result = getCurrentTime({ timezone: 'Invalid/Timezone' });
    expect(result).toContain('Invalid timezone');
  });
});
