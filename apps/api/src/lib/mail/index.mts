import { nanoid } from "nanoid";

import { forwardEmailToTelegram } from "./forward/telegram.js";

import { handleAttachments } from "./handleAttachments.mjs";
import { parseEmail } from "./parse-email.mjs";
import { saveToDatabase } from "./saveToDatabase.js";
import type { EmailStorage } from "./types.js";

export async function handleEmail(
	message: EmailMessage,
	env: Env,
	_ctx: ExecutionContext,
): Promise<void> {
	try {
		console.log("message: ", JSON.stringify(message, null, 2));
		console.log(`received email from ${message.from}`);
		console.log(`received email to ${message.to}`);
		// 1. 解析邮件
		const emailData = await parseEmail(message);
		console.log("Email parsed successfully");

		// 2. 获取收件箱信息
		const mailbox = message.to.split("@")[0];

		// 3. 处理附件
		const attachmentUrls = await handleAttachments(
			env,
			mailbox,
			emailData.attachments,
		);
		console.log("Attachments handled successfully");

		// 4. 创建存储对象
		const emailStorage: EmailStorage = {
			id: nanoid(),
			mailbox,
			emailData,
			attachmentUrls,
			createdAt: new Date(),
		};
		try {
			// 5. 存储到数据库
			await saveToDatabase(emailStorage);
			console.log("Email saved to database successfully");
		} catch (error) {
			console.error("Error saving email to database:", {
				error,
				errorMessage: error instanceof Error ? error.message : String(error),
				emailId: emailStorage.id,
				mailbox: emailStorage.mailbox,
			});
		}

		// 6. 处理转发
		// await handleForwarding(message, env);
		// console.log("Email forwarding handled successfully");

		// 7. 发送 Telegram 通知
		if (env.TELEGRAM_CHAT_ID) {
			try {
				await forwardEmailToTelegram(
					emailStorage.emailData,
					env.TELEGRAM_CHAT_ID,
				);
				console.log("Telegram notification sent successfully");
			} catch (error) {
				console.error("Error sending Telegram notification:", {
					error,
					errorMessage: error instanceof Error ? error.message : String(error),
					chatId: env.TELEGRAM_CHAT_ID,
				});
				// 不抛出错误，因为这是非关键功能
			}
		}
	} catch (error) {
		console.error("Error processing email:", {
			error,
			errorMessage: error instanceof Error ? error.message : String(error),
			errorStack: error instanceof Error ? error.stack : undefined,
			mailbox: message.to.split("@")[0],
			from: message.from,
			to: message.to,
		});
		throw error;
	}
}
