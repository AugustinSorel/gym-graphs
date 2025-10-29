import { Hono } from "hono";
import { sql } from "drizzle-orm";
import type { Ctx } from "~/index";

export const healthRouter = new Hono<Ctx>()
  .get("/", (c) => {
    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env["NODE_ENV"],
    });
  })
  .get("/ready", async (c) => {
    // Check if database is accessible
    try {
      await c.var.db.execute(sql`SELECT 1`);
      return c.json({
        status: "ready",
        checks: {
          database: "ok",
        },
      });
    } catch (error) {
      return c.json(
        {
          status: "not ready",
          checks: {
            database: "failed",
          },
        },
        503,
      );
    }
  });
