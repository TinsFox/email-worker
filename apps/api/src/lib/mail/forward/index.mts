import { createMimeMessage } from "mimetext";
import * as PostalMime from "postal-mime";
import type { ForwardEmailConfig } from "./types.mts";

export async function forwardEmail(
	message: EmailMessage,
	config: ForwardEmailConfig,
): Promise<void> {
	try {
		const parser = new PostalMime.default();
		const rawEmail = new Response(message.raw);
		const email = await parser.parse(await rawEmail.arrayBuffer());

		// 创建转发邮件
		const msg = createMimeMessage();
		msg.setSender({ addr: config.sender });

		// 设置收件人
		for (const recipient of config.forwardTo) {
			msg.setRecipient(recipient);
		}

		// 设置主题 - 添加 "Fwd: " 前缀（如果原主题没有）
		const subject = email.subject || "(No Subject)";
		const fwdSubject = subject.startsWith("Fwd:") ? subject : `Fwd: ${subject}`;
		msg.setSubject(fwdSubject);

		// 设置原始邮件相关的头部信息
		msg.setHeader("X-Forwarded-For", message.from);
		msg.setHeader(
			"X-Original-Date",
			email.date?.toString() || new Date().toString(),
		);
		if (email.messageId) {
			msg.setHeader("X-Original-Message-ID", email.messageId);
		}

		// 构建转发邮件内容
		const forwardHeader = `
----- 转发的邮件 -----
发件人: ${message.from}
日期: ${email.date ? new Date(email.date).toLocaleString() : new Date().toLocaleString()}
主题: ${email.subject}
收件人: ${message.to}
`;

		// 添加纯文本内容
		if (email.text) {
			msg.addMessage({
				contentType: "text/plain",
				data: `${forwardHeader}\n\n${email.text}`,
			});
		}

		// 添加HTML内容（如果存在）
		if (email.html) {
			msg.addMessage({
				contentType: "text/html",
				data: `<div style="border-left: 2px solid #ccc; padding-left: 10px; margin: 10px 0;">
          <pre style="font-family: monospace;">${forwardHeader}</pre>
          <div>${email.html}</div>
        </div>`,
			});
		}

		// 处理附件
		if (email.attachments && email.attachments.length > 0) {
			for (const attachment of email.attachments) {
				if (attachment.content instanceof ArrayBuffer) {
					msg.addAttachment({
						filename: attachment.filename || "unnamed",
						contentType: attachment.mimeType || "application/octet-stream",
						data: Buffer.from(attachment.content).toString("base64"),
					});
				}
			}
		}

		// 发送转发邮件
		for (const recipient of config.forwardTo) {
			await message.forward(recipient);
		}
	} catch (error) {
		console.error("Error forwarding email:", error);
		throw error;
	}
}
