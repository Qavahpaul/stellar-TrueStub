import { z } from "zod";

/**
 * Environment validation schema for TrueStub backend.
 *
 * Defines and validates the environment configuration shape at startup.
 * As real routes land (see README roadmap), their variables are typed here
 * to prevent silent runtime failures and eliminate direct `process.env` access.
 */
export const envSchema = z.object({
  PORT: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 4000))
    .pipe(
      z
        .number()
        .int("PORT must be an integer")
        .min(1, "PORT must be at least 1")
        .max(65535, "PORT must be at most 65535"),
    ),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Roadmap variables for upcoming route migrations (optional until routes land)
  TRUSTLESS_WORK_WEBHOOK_SECRET: z.string().min(1).optional(),
  HASURA_GRAPHQL_ENDPOINT: z.string().url("HASURA_GRAPHQL_ENDPOINT must be a valid URL").optional(),
  HASURA_GRAPHQL_ADMIN_SECRET: z.string().min(1).optional(),

  // Error tracking (#111) — unset in local dev, Sentry stays disabled
  SENTRY_DSN: z.string().url("SENTRY_DSN must be a valid URL").optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates raw environment variables against the schema.
 * Fails fast with a clear, formatted error message if required variables are missing or malformed.
 */
export function validateEnv(rawEnv: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
      .join("\n");

    const fullMessage = `❌ Invalid environment variables:\n${errorMessages}`;
    console.error(fullMessage);
    throw new Error(fullMessage);
  }

  return result.data;
}

/**
 * Validated and typed environment configuration.
 */
export const env: Env = validateEnv(process.env);
