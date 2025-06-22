import { z } from "@hono/zod-openapi";

export const SearchQuerySchema = z.object({
	page: z.number().default(1),
	limit: z.number().default(10),
	search: z.string().optional(),
	status: z.enum(["pending", "sent", "failed"]).optional(),
	from: z.string().email().optional(),
	to: z.string().email().optional(),
});

export const ParamsSchema = z.object({
	id: z.string().uuid(),
});

export const UpdateMailSchema = z.object({
	from: z.string().email(),
	to: z.array(z.string().email()),
	subject: z.string().min(1),
	text: z.string().min(1),
	html: z.string().optional(),
	mailbox: z.string().optional(),
	messageId: z.string().optional(),
	inReplyTo: z.string().optional(),
	references: z.array(z.string()).optional(),
	headers: z.record(z.any()).optional(),
	status: z.enum(["pending", "sent", "failed"]).optional(),
	priority: z.enum(["low", "normal", "high"]).optional(),
	scheduledAt: z.string().datetime().optional(),
	sentAt: z.string().datetime().optional(),
	errorMessage: z.string().optional(),
	attachments: z.array(z.string()).optional(),
	metadata: z.record(z.any()).optional(),
});

export const MailResponseSchema = z.object({
	code: z.number(),
	msg: z.string(),
	data: z.object({
		id: z.string().uuid(),
		from: z.string().email(),
		to: z.array(z.string().email()),
		subject: z.string(),
		text: z.string(),
		html: z.string().nullable(),
		mailbox: z.string(),
		messageId: z.string(),
		inReplyTo: z.string().nullable(),
		references: z.array(z.string()).nullable(),
		headers: z.any(),
		createdAt: z.string(),
	}),
});
