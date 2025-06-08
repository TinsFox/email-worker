import { cors } from "hono/cors";
import { csrf } from "hono/csrf";

import { logger } from "hono/logger";
import { requestId } from "hono/request-id";

import { Hono } from "hono";
import { showRoutes } from "hono/dev";
import { auth } from "./lib/auth";
import { formatTable } from "./lib/log";

import { env } from "cloudflare:workers";

import { handleEmail } from "./lib/mail/index.mjs";
import { adminMiddleware } from "./middleware/auth-middleware";

const app = new Hono();

app.use("*", logger());
app.use("*", csrf());
app.use("*", cors());
app.use("*", requestId());
app.use("*", adminMiddleware());

app.get("/better-auth/reference", async (c) => {
	const openAPISchema = await auth.api.generateOpenAPISchema();
	return c.json(openAPISchema);
});

// API routes with /api prefix
const apiApp = new Hono().basePath("/api");

apiApp.on(["POST", "GET"], "/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

// Mount API routes
app.route("/", apiApp);

app.notFound((c) => c.json({ message: "Not Found", ok: false }, 404));
showRoutes(app, {
	colorize: true,
});
const serverInfo = [
	{ Description: "Server", URL: `http://localhost:${env.API_PORT}` },
	{
		Description: "API Endpoint",
		URL: `http://localhost:${env.API_PORT}/api`,
	},
	{
		Description: "OpenAPI",
		URL: `http://localhost:${env.API_PORT}/api/docs/openapi`,
	},
	{
		Description: "Scalar Docs",
		URL: `http://localhost:${env.API_PORT}/api/docs`,
	},
	{
		Description: "Better Auth Reference",
		URL: `http://localhost:${env.API_PORT}/api/auth/reference`,
	},
];

formatTable(serverInfo);

export default {
	fetch: app.fetch,
	email: handleEmail,
};
