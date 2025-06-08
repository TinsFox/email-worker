import { db } from "@/db/index.js";
import { emails } from "@/db/schema/mail.schema.js";

import { nanoid } from "nanoid";
import * as PostalMime from "postal-mime";

import { forwardEmailToTelegram } from "./forward/telegram.js";

import type { EmailData, EmailStorage } from "./types.js";

export async function handleEmail(
	message: EmailMessage,
	env: Env,
	ctx: ExecutionContext,
): Promise<void> {
	try {
		const parser = new PostalMime.default();
		const rawEmail = new Response(message.raw);
		const email = await parser.parse(await rawEmail.arrayBuffer());

		const emailData: EmailData = {
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
			replyTo: (email.replyTo || [])
				.map((r) => r.address || "")
				.filter(Boolean),
			references: Array.isArray(email.references) ? email.references : [],
			headers: Object.fromEntries(
				(email.headers || []).map((h) => [h.key, h.value]),
			),
		};

		// 获取收件箱信息（从收件人地址中提取）
		const mailbox = message.to.split("@")[0];

		// 处理附件并上传到R2
		const attachmentUrls: string[] = [];
		if (env.R2_BUCKET && emailData.attachments.length > 0) {
			for (const attachment of emailData.attachments) {
				const date = new Date();
				const key = `${mailbox}/${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${nanoid()}-${attachment.filename}`;
				await env.R2_BUCKET.put(key, attachment.content, {
					httpMetadata: {
						contentType: attachment.mimeType,
					},
				});
				attachmentUrls.push(key);
			}
		}

		// 创建存储对象
		const emailStorage: EmailStorage = {
			id: nanoid(),
			mailbox,
			emailData,
			attachmentUrls,
			createdAt: new Date(),
		};

		// 存储到数据库
		await db.insert(emails).values({
			id: emailStorage.id,
			mailbox: emailStorage.mailbox,
			from: emailStorage.emailData.from,
			to: emailStorage.emailData.to,
			text: emailStorage.emailData.text,
			html: emailStorage.emailData.html || null,
			messageId: emailStorage.emailData.messageId,
			inReplyTo: emailStorage.emailData.inReplyTo || null,
			references: emailStorage.emailData.references,
			headers: emailStorage.emailData.headers,
			subject: emailStorage.emailData.subject,
			createdAt: emailStorage.createdAt,
		});

		// 转发邮件（如果配置了转发地址）
		if (env.FORWARD_TO_ADDRESSES) {
			const forwardAddresses = env.FORWARD_TO_ADDRESSES.split(",").map(
				(addr: string) => addr.trim(),
			);
			if (forwardAddresses.length > 0) {
				for (const forwardAddress of forwardAddresses) {
					// @ts-expect-error
					await message.forward(forwardAddress);
				}
			}
		}

		// 发送通知
		// await sendNotifications(emailStorage, env);

		if (env.TELEGRAM_CHAT_ID) {
			await forwardEmailToTelegram(
				emailStorage.emailData,
				env.TELEGRAM_CHAT_ID,
			);
		}
	} catch (error) {
		console.error("Error processing email:", error);
		throw error;
	}
}
