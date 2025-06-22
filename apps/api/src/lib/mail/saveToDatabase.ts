import { env } from "cloudflare:workers";
import { createDb } from "@/db";
import { mails } from "@/db/schema";
import type { EmailStorage } from "./types";

export async function saveToDatabase(emailStorage: EmailStorage) {
	try {
		// 确保 to 和 references 是数组
		const toArray = Array.isArray(emailStorage.emailData.to)
			? emailStorage.emailData.to
			: [emailStorage.emailData.to];

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

		const insertValues = {
			id: emailStorage.id,
			mailbox: emailStorage.mailbox,
			from: emailStorage.emailData.from,
			to: toArray,
			text,
			html,
			subject: emailStorage.emailData.subject,
			messageId: emailStorage.emailData.messageId,
			headers,
			createdAt,
		};
		const db = createDb(env.DATABASE_URL);
		await db.insert(mails).values(insertValues);
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
