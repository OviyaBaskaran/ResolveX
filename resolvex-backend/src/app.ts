import express from "express";
import cookieParser from "cookie-parser";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import organizationRoutes from "./routes/organization.routes.js";
import teamRoutes from "./routes/team.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import slaRoutes from "./routes/sla.routes.js";
import auditLogRoutes from "./routes/audit-log.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import platformRoutes from "./routes/platform.routes.js";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && env.corsOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/teams", teamRoutes);
app.use("/api/v1/tickets", ticketRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/sla", slaRoutes);
app.use("/api/v1/audit-logs", auditLogRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/platform", platformRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
export default app;
