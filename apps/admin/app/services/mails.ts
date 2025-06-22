import { apiFetch } from "~/lib/api-fetch";

// 定义邮件类型
export interface Mail {
	id: string;
	mailbox: string;
	from: string;
	to: string[];
	subject: string;
	text: string;
	html: string;
	messageId: string;
	inReplyTo: string | null;
	references: string | null;
	headers: Record<string, string>;
	createdAt: string;
}
// 定义分页响应类型
export interface PaginatedResponse<T> {
	list: T[];
	total: number;
	page: number | null;
	pageSize: number;
	totalPages: number;
}

// 获取邮件列表
export async function fetchMails(): Promise<PaginatedResponse<Mail>> {
	return apiFetch("/api/mail", {
		method: "GET",
	});
}
