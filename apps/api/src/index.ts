import { cors } from "hono/cors";
import { csrf } from "hono/csrf";

import { logger } from "hono/logger";
import { requestId } from "hono/request-id";

import { Hono } from "hono";

import { handleEmail } from "./lib/mail/index.mjs";

import { initDbMiddleware } from "./middleware/init-db";
import { mailRouter } from "./module/mail/mail";
import { openAPIMiddleware, scalarDocsMiddleware } from "./module/openapi";
import telegramBot from "./module/telegram-bot";
import { authRouter } from "./module/users/auth";
import { userRouter } from "./module/users/users";
import { initLog } from "./utils/init-log";

const app = new Hono();

app.use("*", logger());
app.use("*", csrf());
app.use("*", cors());
app.use("*", requestId());
app.use("*", initDbMiddleware);
app.get("/", (c) => {
	return c.json({ message: "Hello World" });
});

const apiApp = new Hono().basePath("/api");
apiApp.get("/docs/openapi", openAPIMiddleware(app));
apiApp.get("/docs", scalarDocsMiddleware());

apiApp.route("/auth", authRouter);
apiApp.route("/users", userRouter);
apiApp.route("/telegram", telegramBot);
apiApp.route("/mail", mailRouter);

app.route("/", apiApp);

app.notFound((c) => c.json({ message: "Not Found", ok: false }, 404));
initLog(app);

export default {
	fetch: app.fetch,
	email: handleEmail,
};
