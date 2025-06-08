import { env } from "cloudflare:workers";
import { telegramBot } from "@/lib/telegram-bot";
import type { EmailData } from "../types";

export async function forwardEmailToTelegram(
	email: EmailData,
	mailbox: string,
) {
	const messageText = `
<b>📧 新邮件通知</b>
━━━━━━━━━━
📬 收件箱: <code>${mailbox}</code>
📨 收件人: <code>${email.to.join(", ")}</code>
👤 发件人: <code>${email.from}</code>
📋 主题: <code>${email.subject}</code>
⏰ 时间: <code>${email.date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(/\//g, "-")}</code>

${email.html ? truncateHtml(sanitizeHtml(email.html)) : `<pre>${email.text || "(无内容)"}</pre>`}

${email.attachments.length > 0 ? `📎 附件数量: <code>${email.attachments.length}</code>` : ""}`;

	await telegramBot.sendMessage({
		chat_id: env.TELEGRAM_CHAT_ID,
		text: messageText,
		parse_mode: "HTML",
	});
}

function sanitizeHtml(html: string): string {
	// Telegram 支持的 HTML 标签：<b>, <strong>, <i>, <em>, <u>, <ins>, <s>, <strike>, <del>, <a>, <code>, <pre>
	// 移除所有不支持的标签，但保留内容
	let sanitized = html
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // 移除 script 标签
		.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "") // 移除 style 标签
		.replace(
			/<(?!\/?(b|strong|i|em|u|ins|s|strike|del|a|code|pre)(?=>|\s.*>))\/?(?:.|\n)*?>/gi,
			"",
		) // 只保留支持的标签
		.replace(/\n\s*\n/g, "\n") // 移除多余的空行
		.trim();

	// 确保所有链接都有 href 属性
	sanitized = sanitized.replace(/<a\s+([^>]*)>/gi, (match, attrs) => {
		if (!/href=/i.test(attrs)) {
			return "";
		}
		return match;
	});

	return sanitized;
}

function truncateHtml(html: string, maxLength = 1000): string {
	if (html.length <= maxLength) return html;

	// 尝试在单词边界截断
	let truncated = html.slice(0, maxLength);
	const lastSpace = truncated.lastIndexOf(" ");
	if (lastSpace > maxLength * 0.8) {
		// 如果最后的空格在合理位置
		truncated = truncated.slice(0, lastSpace);
	}

	// 确保所有开启的标签都正确关闭
	const openTags: string[] = [];
	const tagRegex = /<\/?([a-z]+)[^>]*>/gi;
	let match: RegExpExecArray | null;

	match = tagRegex.exec(truncated);
	while (match !== null) {
		if (match[0].startsWith("</")) {
			// 关闭标签
			if (openTags.length > 0 && openTags[openTags.length - 1] === match[1]) {
				openTags.pop();
			}
		} else {
			// 开启标签
			openTags.push(match[1]);
		}
		match = tagRegex.exec(truncated);
	}

	// 添加省略号和关闭所有未关闭的标签
	return `${truncated}...${openTags
		.reverse()
		.map((tag) => `</${tag}>`)
		.join("")}`;
}
