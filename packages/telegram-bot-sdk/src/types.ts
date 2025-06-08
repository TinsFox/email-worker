// 基础响应类型
export interface TelegramResponse<T> {
	ok: boolean;
	result?: T;
	description?: string;
	error_code?: number;
}

// 用户类型
export interface User {
	id: number;
	is_bot: boolean;
	first_name: string;
	last_name?: string;
	username?: string;
	language_code?: string;
}

// 消息类型
export interface Message {
	message_id: number;
	from?: User;
	date: number;
	chat: Chat;
	text?: string;
	photo?: PhotoSize[];
	document?: Document;
	video?: Video;
}

// 聊天类型
export interface Chat {
	id: number;
	type: "private" | "group" | "supergroup" | "channel";
	title?: string;
	username?: string;
	first_name?: string;
	last_name?: string;
}

// 图片大小类型
export interface PhotoSize {
	file_id: string;
	file_unique_id: string;
	width: number;
	height: number;
	file_size?: number;
}

// 文档类型
export interface Document {
	file_id: string;
	file_unique_id: string;
	file_name?: string;
	mime_type?: string;
	file_size?: number;
}

// 视频类型
export interface Video {
	file_id: string;
	file_unique_id: string;
	width: number;
	height: number;
	duration: number;
	thumb?: PhotoSize;
	mime_type?: string;
	file_size?: number;
}

// 更新类型
export interface Update {
	update_id: number;
	message?: Message;
	edited_message?: Message;
	channel_post?: Message;
	edited_channel_post?: Message;
}

// 发送消息参数
export interface SendMessageParams {
	chat_id: number | string;
	text: string;
	parse_mode?: "Markdown" | "HTML";
	disable_web_page_preview?: boolean;
	disable_notification?: boolean;
	reply_to_message_id?: number;
}

// 发送照片参数
export interface SendPhotoParams {
	chat_id: number | string;
	photo: string | Buffer;
	caption?: string;
	parse_mode?: "Markdown" | "HTML";
	disable_notification?: boolean;
	reply_to_message_id?: number;
}

// 获取更新参数
export interface GetUpdatesParams {
	offset?: number;
	limit?: number;
	timeout?: number;
	allowed_updates?: string[];
}
