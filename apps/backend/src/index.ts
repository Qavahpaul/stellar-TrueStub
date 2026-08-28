import "dotenv/config";
import express, { type Express } from "express";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { requestLogger } from "./middleware/requestLogger";
import { corsMiddleware, helmetMiddleware } from "./middleware/security";
import { authRateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health";
import { listingsRouter } from "./routes/listings";
import { webhookRouter } from "./routes/webhooks";
import {
  initSentry,
  sentryRequestHandler,
  sentryErrorHandler,
} from "./config/sentry";

// Initialise Sentry as early as possible so it can capture startup errors.
initSentry();

export function createApp(): Express {
  const app = express();

  // Sentry request handler must be the very first middleware.
  app.use(sentryRequestHandler());

  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(requestLogger);
  app.use(express.json());
  app.use("/api/auth", authRateLimiter);
  app.use("/health", healthRouter);
  app.use("/api/listings", listingsRouter);
  app.use("/webhooks", webhookRouter);

  // Sentry error handler must come after routes but before our custom handler.
  app.use(sentryErrorHandler());

  app.use(errorHandler);
  return app;
}

export const app = createApp();

if (require.main === module) {
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "TrueStub backend listening");
  });
}
