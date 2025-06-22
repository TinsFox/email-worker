import type {
	GetUpdatesParams,
	Message,
	SendMessageParams,
	SendPhotoParams,
	TelegramResponse,
	Update,
	User,
} from "./types";

interface TelegramBotOptions {
	token: string;
	baseURL?: string;
}

export class TelegramBot {
	private baseURL: string;

	constructor({
		token,
		baseURL = "https://api.telegram.org/bot",
	}: TelegramBotOptions) {
		this.baseURL = `${baseURL}${token}`;
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

	// 发送照片 - 适配 Hono/Worker 环境
	async sendPhoto(params: SendPhotoParams): Promise<Message> {
		const formData = new FormData();

		Object.entries(params).forEach(([key, value]) => {
			if (key === "photo") {
				// 在 Hono/Worker 环境中，直接使用 File 或 Blob
				if (value instanceof File || value instanceof Blob) {
					formData.append("photo", value, "photo.jpg");
				} else if (typeof value === "string") {
					// 如果是 URL，直接传递
					formData.append("photo", value);
				}
			} else {
				formData.append(key, String(value));
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

	// 添加 Webhook 相关方法
	async setWebhook(url: string, secretToken?: string): Promise<boolean> {
		const params: Record<string, any> = { url };
		if (secretToken) {
			params.secret_token = secretToken;
		}
		return this.request<boolean>("/setWebhook", "POST", params);
	}

	async deleteWebhook(): Promise<boolean> {
		return this.request<boolean>("/deleteWebhook", "POST");
	}

	async getWebhookInfo(): Promise<any> {
		return this.request<any>("/getWebhookInfo");
	}
}
