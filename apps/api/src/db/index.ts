import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/neon-http";

import * as authSchema from "../../auth-schema";
import * as schema from "./schema";

console.log("env.DATABASE_URL: ", env.DATABASE_URL);
export const db = drizzle(env.DATABASE_URL, {
	schema: { ...schema, ...authSchema },
});
