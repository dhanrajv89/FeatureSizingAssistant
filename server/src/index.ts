import "dotenv/config";

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import passport from "@/auth/passport";
import { env } from "@/env";
import { logger } from "@/logger";
import { authRouter } from "@/routes/auth";
import { apiEstimatesRouter } from "@/routes/estimates";

const app = express();

app.use(helmet());
app.use(
  morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(passport.initialize());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/api/estimates", apiEstimatesRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error("Unhandled application error", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(env.PORT, () => {
  logger.info(`Server listening on port ${env.PORT}`);
});
