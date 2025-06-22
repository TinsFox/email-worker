import { nanoid } from "nanoid";
import * as PostalMime from "postal-mime";
import type { EmailData } from "./types.js";

export async function parseEmail(message: EmailMessage): Promise<EmailData> {
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
