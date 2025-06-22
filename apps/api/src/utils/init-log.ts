import { env } from "cloudflare:workers";
import { formatTable } from "@/lib/log";
import type { Hono } from "hono";
import { showRoutes } from "hono/dev";

export const initLog = (app: Hono) => {
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
	];

	formatTable(serverInfo);
};
