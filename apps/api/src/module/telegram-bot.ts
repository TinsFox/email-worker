import { env } from "cloudflare:workers";
import { TelegramBot } from "@email-worker/telegram-bot-sdk";
import { Hono } from "hono";

const app = new Hono();
app.get("/", (c) => {
	return c.json({
		message: "Telegram Bot API",
		endpoints: {
			webhook: "/api/telegram/webhook",
			setWebhook: "/api/telegram/set-webhook",
			deleteWebhook: "/api/telegram/delete-webhook",
			webhookInfo: "/api/telegram/webhook-info",
			health: "/api/telegram/health",
		},
	});
});

const createBot = (token: string) => new TelegramBot({ token });

const handleUpdate = async (bot: TelegramBot, update: any) => {
	console.log("handleUpdate", update);
	try {
		// 处理消息
		if (update.message) {
			const { chat, text, from } = update.message;

			console.log(
				`收到来自 ${from?.username || from?.first_name} 的消息: ${text}`,
			);

			// 处理命令
			if (text === "/start") {
				await bot.sendMessage({
					chat_id: chat.id,
					text: "👋 你好！我是运行在 Cloudflare Worker 上的 Hono 机器人！\n\n可用命令：\n/help - 显示帮助\n/status - 检查状态",
				});
			} else if (text === "/help") {
				await bot.sendMessage({
					chat_id: chat.id,
					text: "📚 帮助信息：\n\n• /start - 开始使用机器人\n• /help - 显示此帮助信息\n• /status - 检查机器人状态\n• /echo <文本> - 回显消息",
				});
			} else if (text === "/status") {
				const me = await bot.getMe();
				await bot.sendMessage({
					chat_id: chat.id,
					text: `🤖 机器人状态：\n\n• 名称：${me.first_name}\n• 用户名：@${me.username}\n• 状态：在线 ✅\n• 平台：Cloudflare Worker + Hono`,
				});
			} else if (text?.startsWith("/echo ")) {
				const echoText = text.substring(6);
				await bot.sendMessage({
					chat_id: chat.id,
					text: `📢 回显：${echoText}`,
				});
			} else if (text) {
				// 默认回复
				await bot.sendMessage({
					chat_id: chat.id,
					text: `收到你的消息：${text}\n\n使用 /help 查看可用命令。`,
				});
			}
		}

		// 处理回调查询
		if (update.callback_query) {
			const { id, data, message } = update.callback_query;

			await bot.sendMessage({
				chat_id: message.chat.id,
				text: `你点击了按钮：${data}`,
			});
		}
	} catch (error) {
		console.error("处理更新时出错:", error);
	}
};

app.post("/webhook", async (c) => {
	try {
		const body = await c.req.text();

		const update = JSON.parse(body);

		// 验证 Webhook 签名（如果设置了密钥）
		// if (env.WEBHOOK_SECRET) {
		// 	const signature = c.req.header("X-Telegram-Bot-Api-Secret-Token");
		// 	if (signature !== c.env.WEBHOOK_SECRET) {
		// 		return c.json({ error: "Unauthorized" }, 401);
		// 	}
		// }

		// 创建机器人实例并处理更新

		const bot = createBot(env.TELEGRAM_TOKEN);
		await handleUpdate(bot, update);

		return c.json({ ok: true });
	} catch (error) {
		console.error("Webhook 处理错误:", error);
		return c.json({ error: "Internal Server Error" }, 500);
	}
});

app.post("/set-webhook", async (c) => {
	try {
		const { url } = await c.req.json();
		const bot = createBot(env.TELEGRAM_TOKEN);

		const result = await bot.setWebhook(url);

		return c.json({ success: result });
	} catch (error) {
		console.error("设置 Webhook 错误:", error);
		return c.json({ error: "Failed to set webhook" }, 500);
	}
});

app.post("/delete-webhook", async (c) => {
	try {
		const bot = createBot(env.TELEGRAM_TOKEN);
		const result = await bot.deleteWebhook();

		return c.json({ success: result });
	} catch (error) {
		console.error("删除 Webhook 错误:", error);
		return c.json({ error: "Failed to delete webhook" }, 500);
	}
});

app.get("/webhook-info", async (c) => {
	try {
		const bot = createBot(env.TELEGRAM_TOKEN);
		const info = await bot.getWebhookInfo();

		return c.json(info);
	} catch (error) {
		console.error("获取 Webhook 信息错误:", error);
		return c.json({ error: "Failed to get webhook info" }, 500);
	}
});

app.get("/health", (c) => {
	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		platform: "Cloudflare Worker + Hono",
	});
});

export default app;
