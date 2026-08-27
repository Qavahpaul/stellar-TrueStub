import "dotenv/config";
import express from "express";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { initSentry, Sentry } from "./lib/sentry";
import { requestLogger } from "./middleware/requestLogger";
import { corsMiddleware, helmetMiddleware } from "./middleware/security";
import { authRateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health";
import { listingsRouter } from "./routes/listings";
import { webhookRouter } from "./routes/webhooks";

// Must run before the app is created so Sentry can instrument Express (#111).
initSentry();

const app = express();

// ── 1. Security headers + CORS (#25) ──────────────────────────────────────
// Must come first so every response — including errors — carries the right
// headers and CORS preflight requests are handled before any route logic.
app.use(helmetMiddleware);
app.use(corsMiddleware);

// ── 2. Structured request logging (#23) ───────────────────────────────────
// After security middleware so that blocked CORS requests are still logged,
// but before body parsing so the request-id is available on `req.log`.
app.use(requestLogger);

// ── 3. Body parsing ────────────────────────────────────────────────────────
app.use(express.json());

// ── 4. Rate limiting on auth routes (#24) ─────────────────────────────────
// Scoped to /api/auth/* — protects password-reset and token-validation
// endpoints from brute-force / enumeration before any route handler runs.
app.use("/api/auth", authRateLimiter);

// ── 5. Routes ──────────────────────────────────────────────────────────────
app.use("/health", healthRouter);
app.use("/api/listings", listingsRouter);
app.use("/webhooks", webhookRouter);

// ── 6. Sentry error capture (#111) ────────────────────────────────────────
// Reports unhandled errors to Sentry before they reach our JSON error
// mapper below. No-ops when SENTRY_DSN isn't set.
Sentry.setupExpressErrorHandler(app);

// ── 7. Centralised error handler (#26) ────────────────────────────────────
// Must be the last middleware registered. Catches errors forwarded via
// next(err) from any route and maps them to consistent JSON responses.
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "TrueStub backend listening");
});

