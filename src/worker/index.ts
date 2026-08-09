import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import { authRoutes } from "./routes/auth";
import { groupRoutes } from "./routes/groups";
import { userRoutes } from "./routes/users";
import { taskRoutes } from "./routes/tasks";
import { claimRoutes } from "./routes/claims";

export type Env = {
  Bindings: {
    DB: D1Database;
  };
};

const app = new Hono<Env>();

app.route("/api/auth", authRoutes);
app.route("/api/groups", groupRoutes);
app.route("/api/users", userRoutes);
app.route("/api/tasks", taskRoutes);
app.route("/api/claims", claimRoutes);

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.get("*", serveStatic({ root: "./" }));
app.get("*", serveStatic({ path: "./index.html" }));

export default app;
