import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { env } from "./config/env.js";
import { requestIdMiddleware } from "./middlewares/request-id.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import helmet from "helmet";
import { apiRateLimiter } from "./middlewares/rate-limit.middleware.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());

app.use(requestIdMiddleware);
app.use(apiRateLimiter);

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "ResolveX API is running",
  });
});


app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;