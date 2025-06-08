import { env } from "cloudflare:workers";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as authSchema from "../../auth-schema";
import * as schema from "./schema";

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, {
	schema: { ...schema, ...authSchema },
});
