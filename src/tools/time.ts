import { z } from "zod";

export const getCurrentTimeSchema = z.object({
  timezone: z.string().optional().describe("Timezone (optional, defaults to local)")
});

export function getCurrentTime(args: z.infer<typeof getCurrentTimeSchema>): string {
  const { timezone } = args;
  
  const now = new Date();
  
  if (timezone) {
    try {
      return now.toLocaleString("en-US", { timeZone: timezone });
    } catch (error) {
      console.warn(`Invalid timezone provided: ${timezone}`, error);
      return `Invalid timezone: ${timezone}. Current time (local): ${now.toLocaleString()}`;
    }
  }
  
  return now.toLocaleString();
}
