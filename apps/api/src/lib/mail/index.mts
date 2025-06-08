import { db } from "@/db/index.js";
import { emails } from "@/db/schema/mail.schema.js";

import { nanoid } from "nanoid";
import * as PostalMime from "postal-mime";

import { forwardEmailToTelegram } from "./forward/telegram.js";

import type { EmailData, EmailStorage } from "./types.js";

async function parseEmail(message: EmailMessage): Promise<EmailData> {
	const parser = new PostalMime.default();
	const rawEmail = new Response(message.raw);
	const email = await parser.parse(await rawEmail.arrayBuffer());

	return {
		from: email.from?.address || message.from,
		to: (email.to || []).map((t) => t?.address || "").filter(Boolean),
		subject: email.subject || "(No Subject)",
		text: email.text || "",
		html: email.html,
		date: new Date(email.date || Date.now()),
		attachments: (email.attachments || []).map((att) => ({
			filename: att.filename || "unnamed",
			mimeType: att.mimeType || "application/octet-stream",
			content: att.content instanceof ArrayBuffer ? att.content : "",
			size: att.content instanceof ArrayBuffer ? att.content.byteLength : 0,
			disposition: att.disposition || "attachment",
		})),
		messageId: email.messageId || nanoid(),
		inReplyTo: email.inReplyTo,
		replyTo: (email.replyTo || []).map((r) => r.address || "").filter(Boolean),
		references: Array.isArray(email.references) ? email.references : [],
		headers: Object.fromEntries(
			(email.headers || []).map((h) => [h.key, h.value]),
		),
	};
}

async function handleAttachments(
	env: Env,
	mailbox: string,
	attachments: EmailData["attachments"],
): Promise<string[]> {
	const attachmentUrls: string[] = [];
	if (env.R2_BUCKET && attachments.length > 0) {
		try {
			for (const attachment of attachments) {
				const date = new Date();
				const key = `${mailbox}/${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${nanoid()}-${attachment.filename}`;
				await env.R2_BUCKET.put(key, attachment.content, {
					httpMetadata: {
						contentType: attachment.mimeType,
					},
				});
				attachmentUrls.push(key);
			}
		} catch (error) {
			console.error("Error handling attachments:", {
				error,
				errorMessage: error instanceof Error ? error.message : String(error),
				mailbox,
			});
			throw error;
		}
	}
	return attachmentUrls;
}

async function saveToDatabase(emailStorage: EmailStorage) {
	try {
		// 确保 to 和 references 是数组
		const toArray = Array.isArray(emailStorage.emailData.to)
			? emailStorage.emailData.to
			: [emailStorage.emailData.to];

		const referencesArray = Array.isArray(emailStorage.emailData.references)
			? emailStorage.emailData.references
			: emailStorage.emailData.references
				? [emailStorage.emailData.references]
				: [];

		// 确保 headers 是一个有效的对象
		const headers =
			typeof emailStorage.emailData.headers === "string"
				? JSON.parse(emailStorage.emailData.headers)
				: emailStorage.emailData.headers;

		// 确保 html 是字符串或 null
		const html = emailStorage.emailData.html || null;

		// 确保文本内容不为 undefined
		const text = emailStorage.emailData.text || "";

		// 确保日期是有效的
		const createdAt = new Date(emailStorage.createdAt);

		await db.insert(emails).values({
			id: emailStorage.id,
			mailbox: emailStorage.mailbox,
			from: emailStorage.emailData.from,
			to: toArray,
			text,
			html,
			messageId: emailStorage.emailData.messageId,
			inReplyTo: emailStorage.emailData.inReplyTo || null,
			references: referencesArray,
			headers,
			subject: emailStorage.emailData.subject,
			createdAt,
		});
	} catch (error) {
		console.error("Error saving to database:", {
			error,
			errorMessage: error instanceof Error ? error.message : String(error),
			emailId: emailStorage.id,
			mailbox: emailStorage.mailbox,
			data: {
				to: emailStorage.emailData.to,
				references: emailStorage.emailData.references,
				headers: emailStorage.emailData.headers,
			},
		});
		throw error;
	}
}

async function handleForwarding(message: EmailMessage, env: Env) {
	if (env.FORWARD_TO_ADDRESSES) {
		try {
			const forwardAddresses = env.FORWARD_TO_ADDRESSES.split(",").map(
				(addr: string) => addr.trim(),
			);
			if (forwardAddresses.length > 0) {
				for (const forwardAddress of forwardAddresses) {
					// @ts-expect-error
					await message.forward(forwardAddress);
				}
			}
		} catch (error) {
			console.error("Error forwarding email:", {
				error,
				errorMessage: error instanceof Error ? error.message : String(error),
				from: message.from,
				to: message.to,
			});
			throw error;
		}
	}
}

export async function handleEmail(
	message: EmailMessage,
	env: Env,
	ctx: ExecutionContext,
): Promise<void> {
	try {
		console.log("message: ", message);
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

		// 5. 存储到数据库
		console.log("emailStorage: ", emailStorage);
		await saveToDatabase(emailStorage);
		console.log("Email saved to database successfully");

		// 6. 处理转发
		await handleForwarding(message, env);
		console.log("Email forwarding handled successfully");

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
