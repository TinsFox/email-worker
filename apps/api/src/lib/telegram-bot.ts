import { env } from "cloudflare:workers";
import { TelegramBot } from "@email-worker/telegram-bot-sdk";

export const telegramBot = new TelegramBot(env.TELEGRAM_TOKEN);
