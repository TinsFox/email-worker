import { env } from "cloudflare:workers";
import * as schema from "@/db/schema";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";

export const initDbMiddleware = createMiddleware(
	async (c: Context, next: Next) => {
		const pool = new Pool({
			connectionString: env.DATABASE_URL,
		});
		c.set(
			"db",
			drizzle(pool, {
				schema: { ...schema },
			}),
		);
		await next();
	},
);
