import "server-only";
import OpenAI from "openai";

/** An error whose message is safe to show the user. */
export class AIError extends Error {}

let client: OpenAI | null = null;
export function openai(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AIError("OpenAI isn't configured (missing OPENAI_API_KEY).");
  client ??= new OpenAI({ apiKey, timeout: 90_000, maxRetries: 1 });
  return client;
}

/** Map an OpenAI SDK error to a user-safe AIError. */
export function toAIError(e: unknown, what: string): AIError {
  if (e instanceof AIError) return e;
  console.error(`${what} failed`, e);
  if (e instanceof OpenAI.APIConnectionTimeoutError) return new AIError(`The ${what} timed out. Try again.`);
  if (e instanceof OpenAI.AuthenticationError) return new AIError("The OpenAI key was rejected. Check OPENAI_API_KEY.");
  if (e instanceof OpenAI.NotFoundError) return new AIError(`The OpenAI model for the ${what} wasn't found.`);
  if (e instanceof OpenAI.RateLimitError) {
    // OpenAI reports an empty balance as a 429 too; say so instead of "try again".
    if (e.code === "insufficient_quota" || e.code === "credit_balance_exhausted" || e.type === "insufficient_quota")
      return new AIError("The OpenAI account has no credits left. Add billing credit, then retry.");
    return new AIError("OpenAI is rate limiting requests. Try again in a moment.");
  }
  return new AIError(`The ${what} failed. Try again.`);
}
