import { z } from "zod";

export const calculateSchema = z.object({
  operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("The mathematical operation to perform"),
  a: z.number().describe("First number"),
  b: z.number().describe("Second number")
});

export function calculate(args: z.infer<typeof calculateSchema>): string {
  const { operation, a, b } = args;
  
  switch (operation) {
    case "add":
      return `${a} add ${b} = ${a + b}`;
    case "subtract":
      return `${a} subtract ${b} = ${a - b}`;
    case "multiply":
      return `${a} multiply ${b} = ${a * b}`;
    case "divide":
      if (b === 0) {
        throw new Error("Cannot divide by zero");
      }
      return `${a} divide ${b} = ${a / b}`;
    default:
      throw new Error("Unknown operation");
  }
}
