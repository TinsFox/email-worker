import FormData from "form-data";
import type {
	GetUpdatesParams,
	Message,
	SendMessageParams,
	SendPhotoParams,
	TelegramResponse,
	Update,
	User,
} from "./types";

export class TelegramBot {
	private token: string;
	private baseURL: string;

	constructor(token: string) {
		this.token = token;
		this.baseURL = `https://api.telegram.org/bot${token}`;
	}

	private async request<T>(
		endpoint: string,
		method: "GET" | "POST" = "GET",
		body?: Record<string, any> | FormData,
	): Promise<T> {
		const url = `${this.baseURL}${endpoint}`;
		const headers: Record<string, string> = {};
		let requestBody: string | FormData | undefined;

		if (body) {
			if (body instanceof FormData) {
				requestBody = body;
			} else {
				headers["Content-Type"] = "application/json";
				requestBody = JSON.stringify(body);
			}
		}

		const response = await fetch(url, {
			method,
			headers,
			body: requestBody,
		});

		const data = (await response.json()) as TelegramResponse<T>;

		if (!data.ok) {
			throw new Error(data.description || "请求失败");
		}

		return data.result as T;
	}

	// 获取机器人信息
	async getMe(): Promise<User> {
		return this.request<User>("/getMe");
	}

	// 发送消息
	async sendMessage(params: SendMessageParams): Promise<Message> {
		return this.request<Message>("/sendMessage", "POST", params);
	}

	// 发送照片
	async sendPhoto(params: SendPhotoParams): Promise<Message> {
		const formData = new FormData();

		// 添加所有参数到 FormData
		Object.entries(params).forEach(([key, value]) => {
			if (key === "photo" && Buffer.isBuffer(value)) {
				formData.append("photo", value, { filename: "photo.jpg" });
			} else {
				formData.append(key, value);
			}
		});

		return this.request<Message>("/sendPhoto", "POST", formData);
	}

	// 获取更新
	async getUpdates(params: GetUpdatesParams = {}): Promise<Update[]> {
		const queryString = new URLSearchParams(
			params as Record<string, string>,
		).toString();
		return this.request<Update[]>(`/getUpdates?${queryString}`);
	}

	// 删除消息
	async deleteMessage(
		chatId: number | string,
		messageId: number,
	): Promise<boolean> {
		return this.request<boolean>("/deleteMessage", "POST", {
			chat_id: chatId,
			message_id: messageId,
		});
	}

	// 编辑消息文本
	async editMessageText(
		chatId: number | string,
		messageId: number,
		text: string,
		parseMode?: "Markdown" | "HTML",
	): Promise<Message | boolean> {
		return this.request<Message | boolean>("/editMessageText", "POST", {
			chat_id: chatId,
			message_id: messageId,
			text,
			parse_mode: parseMode,
		});
	}
}
