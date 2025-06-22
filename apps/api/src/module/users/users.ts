import { env } from "cloudflare:workers";
import { createDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { count } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { UpdateUserSchema } from "./schema";

const userRouter = new Hono();

// 基础分页查询 Schema
const basePaginateQuerySchema = z.object({
	page: z.coerce.number().default(0),
	pageSize: z.coerce.number().default(10),
});

// Get users list with pagination
userRouter.get("/", async (c) => {
	const query = await basePaginateQuerySchema.parseAsync(c.req.query());
	const { page, pageSize } = query;
	const db = createDb(env.DATABASE_URL);
	const allUsers = await db
		.select()
		.from(users)
		.orderBy(users.createdAt)
		.offset(page * pageSize)
		.limit(pageSize);

	const totalResult = await db.select({ count: count() }).from(users);
	const total = Number(totalResult[0].count);

	return c.json({
		code: 200,
		msg: "Successfully retrieved users list",
		list: allUsers.map((user) => ({
			...user,
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
		})),
		total,
		page: Number(page),
		pageSize: Number(pageSize),
		totalPages: Math.ceil(total / pageSize),
	});
});

// Get current user info
userRouter.get("/info", async (c) => {
	const payload = c.get("jwtPayload");
	const user = await db.query.users.findFirst({
		where: eq(users.id, payload.sub),
	});

	if (!user) {
		return c.json(
			{
				code: 404,
				msg: "User not found",
			},
			404,
		);
	}

	return c.json({
		code: 200,
		msg: "Successfully retrieved user info",
		data: {
			...user,
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
		},
	});
});

// Get user by ID
userRouter.get("/:id", async (c) => {
	const id = c.req.param("id");
	const user = await db.query.users.findFirst({
		where: eq(users.id, id),
	});

	if (!user) {
		return c.json(
			{
				code: 404,
				msg: "User not found",
			},
			404,
		);
	}

	return c.json({
		code: 200,
		msg: "Successfully retrieved user",
		data: {
			...user,
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
		},
	});
});

// Update user
userRouter.put("/:id", async (c) => {
	const id = c.req.param("id");
	const body = await c.req.json();
	const updateData = await UpdateUserSchema.parseAsync(body);

	const [updated] = await db
		.update(users)
		.set({
			...updateData,
			updatedAt: new Date(),
		})
		.where(eq(users.id, id))
		.returning();

	if (!updated) {
		return c.json(
			{
				code: 404,
				msg: "User not found",
			},
			404,
		);
	}

	return c.json({
		code: 200,
		msg: "User updated successfully",
		data: {
			...updated,
			createdAt: updated.createdAt.toISOString(),
			updatedAt: updated.updatedAt.toISOString(),
		},
	});
});

// Delete user
userRouter.delete("/:id", async (c) => {
	const id = c.req.param("id");
	const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();

	if (!deleted) {
		return c.json(
			{
				code: 404,
				msg: "User not found",
			},
			404,
		);
	}

	return c.json({
		code: 200,
		msg: "User deleted successfully",
	});
});

export { userRouter };
