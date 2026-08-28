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

export function createApp(): Express {
  const app = express();
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(requestLogger);
  app.use(express.json());
  app.use("/api/auth", authRateLimiter);
  app.use("/health", healthRouter);
  app.use("/api/listings", listingsRouter);
  app.use("/webhooks", webhookRouter);
  app.use(errorHandler);
  return app;
}

export const app = createApp();

if (require.main === module) {
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "TrueStub backend listening");
  });
}
