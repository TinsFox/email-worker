import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// 邮件表
export const emails = pgTable("emails", {
	id: text("id").primaryKey(),
	mailbox: text("mailbox").notNull(), // 收件箱标识
	from: text("from").notNull(), // 发件人
	to: text("to").array().notNull(), // 收件人列表
	subject: text("subject").notNull(), // 邮件主题
	text: text("text").notNull(), // 纯文本内容
	html: text("html"), // HTML 内容
	messageId: text("message_id").notNull(), // 邮件唯一标识
	inReplyTo: text("in_reply_to"), // 回复的邮件ID
	references: text("references").array(), // 相关邮件引用
	headers: jsonb("headers").notNull(), // 邮件头部信息
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 附件表
export const attachments = pgTable("attachments", {
	id: text("id").primaryKey(),
	emailId: text("email_id")
		.references(() => emails.id)
		.notNull(),
	filename: text("filename").notNull(),
	mimeType: text("mime_type").notNull(),
	size: text("size").notNull(),
	disposition: text("disposition").notNull(),
	r2Url: text("r2_url").notNull(), // R2存储路径
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 通知配置表
export const notificationTargets = pgTable("notification_targets", {
	id: text("id").primaryKey(),
	type: text("type").notNull(), // telegram, discord, slack
	webhook: text("webhook").notNull(), // webhook URL
	enabled: boolean("enabled").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 类型定义
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
export type NotificationTarget = typeof notificationTargets.$inferSelect;
export type NewNotificationTarget = typeof notificationTargets.$inferInsert;
