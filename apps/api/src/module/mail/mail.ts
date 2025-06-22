import { mails } from "@/db/schema/mail.schema";
import { BasePaginateQuerySchema, BasePaginationSchema } from "@/schema/base";
import { desc, eq } from "drizzle-orm";
import { count } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { nanoid } from "nanoid";
import { z } from "zod";

import { env } from "cloudflare:workers";
import { createDb } from "@/db";
import {
	MailResponseSchema,
	ParamsSchema,
	SearchQuerySchema,
	UpdateMailSchema,
} from "./schema";

const mailRouter = new Hono();

// Get mails list with pagination
mailRouter.get(
	"/",
	describeRoute({
		tags: ["Mails"],
		summary: "Get mails list",
		description:
			"Retrieve a paginated list of mails with optional search query",
		responses: {
			200: {
				description: "Successfully retrieved mails list",
				content: {
					"application/json": {
						schema: resolver(BasePaginationSchema(MailResponseSchema)),
					},
				},
			},
		},
	}),
	zValidator(
		"query",
		BasePaginateQuerySchema.merge(SearchQuerySchema.partial()),
	),
	async (c) => {
		const { page, pageSize } = c.req.valid("query");
		const db = createDb(env.DATABASE_URL);
		const allMails = await db
			.select()
			.from(mails)
			.orderBy(desc(mails.createdAt))
			.offset((page ?? 1) * (pageSize ?? 10))
			.limit(pageSize);

		const totalResult = await db.select({ count: count() }).from(mails);
		const total = Number(totalResult[0].count);

		return c.json({
			code: 200,
			msg: "Successfully retrieved mails list",
			list: allMails.map((mail) => ({
				...mail,
				createdAt: mail.createdAt.toISOString(),
			})),
			total,
			page: Number(page),
			pageSize: Number(pageSize),
			totalPages: Math.ceil(total / pageSize),
		});
	},
);

// Get mail by ID
mailRouter.get(
	"/:id",
	describeRoute({
		tags: ["Mails"],
		summary: "Get mail by id",
		description: "Retrieve a mail by its ID",
		responses: {
			200: {
				content: {
					"application/json": {
						schema: resolver(MailResponseSchema),
					},
				},
				description: "Successfully retrieved mail",
			},
			404: {
				content: {
					"application/json": {
						schema: resolver(
							z.object({
								code: z.number(),
								msg: z.string(),
							}),
						),
					},
				},
				description: "Mail not found",
			},
		},
	}),
	zValidator("param", ParamsSchema),
	async (c) => {
		const { id } = c.req.valid("param");
		const db = createDb(env.DATABASE_URL);
		const mail = await db.query.mails.findFirst({
			where: eq(mails.id, id),
		});

		if (!mail) {
			return c.json(
				{
					code: 404,
					msg: "Mail not found",
				},
				404,
			);
		}

		return c.json({
			code: 200,
			msg: "Successfully retrieved mail",
			data: {
				...mail,
				createdAt: mail.createdAt.toISOString(),
			},
		});
	},
);

// Update mail
mailRouter.put(
	"/:id",
	describeRoute({
		tags: ["Mails"],
		summary: "Update mail",
		description: "Update a mail's information",
		responses: {
			200: {
				content: {
					"application/json": {
						schema: resolver(MailResponseSchema),
					},
				},
				description: "Mail updated successfully",
			},
			404: {
				content: {
					"application/json": {
						schema: resolver(
							z.object({
								code: z.number(),
								msg: z.string(),
							}),
						),
					},
				},
				description: "Mail not found",
			},
		},
	}),
	zValidator("param", ParamsSchema),
	zValidator("json", UpdateMailSchema),
	async (c) => {
		const { id } = c.req.valid("param");
		const updateData = c.req.valid("json");
		const db = createDb(env.DATABASE_URL);
		const [updated] = await db
			.update(mails)
			.set(updateData)
			.where(eq(mails.id, id))
			.returning();

		if (!updated) {
			return c.json(
				{
					code: 404,
					msg: "Mail not found",
				},
				404,
			);
		}

		return c.json({
			code: 200,
			msg: "Mail updated successfully",
			data: {
				...updated,
				createdAt: updated.createdAt.toISOString(),
			},
		});
	},
);

// Delete mail
mailRouter.delete(
	"/:id",
	describeRoute({
		tags: ["Mails"],
		summary: "Delete mail",
		description: "Delete a mail by its ID",
		responses: {
			200: {
				content: {
					"application/json": {
						schema: resolver(
							z.object({
								code: z.number(),
								msg: z.string(),
							}),
						),
					},
				},
				description: "Mail deleted successfully",
			},
			404: {
				content: {
					"application/json": {
						schema: resolver(
							z.object({
								code: z.number(),
								msg: z.string(),
							}),
						),
					},
				},
				description: "Mail not found",
			},
		},
	}),
	zValidator("param", ParamsSchema),
	async (c) => {
		const { id } = c.req.valid("param");
		const db = createDb(env.DATABASE_URL);
		const [deleted] = await db
			.delete(mails)
			.where(eq(mails.id, id))
			.returning();

		if (!deleted) {
			return c.json(
				{
					code: 404,
					msg: "Mail not found",
				},
				404,
			);
		}

		return c.json({
			code: 200,
			msg: "Mail deleted successfully",
		});
	},
);

// Create new mail
mailRouter.post(
	"/",
	describeRoute({
		tags: ["Mails"],
		summary: "Create mail",
		description: "Create a new mail",
		responses: {
			201: {
				content: {
					"application/json": {
						schema: resolver(MailResponseSchema),
					},
				},
				description: "Mail created successfully",
			},
		},
	}),
	zValidator("json", UpdateMailSchema),
	async (c) => {
		const mailData = c.req.valid("json");
		const db = createDb(env.DATABASE_URL);
		const [created] = await db
			.insert(mails)
			.values({
				id: nanoid(),
				mailbox: "inbox",
				...mailData,
			})
			.returning();

		return c.json(
			{
				code: 201,
				msg: "Mail created successfully",
				data: {
					...created,
					createdAt: created.createdAt.toISOString(),
				},
			},
			201,
		);
	},
);

export { mailRouter };
