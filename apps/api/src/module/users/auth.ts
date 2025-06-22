import { env } from "cloudflare:workers";
import { createDb } from "@/db";
import { users } from "@/db/schema";
import { generateToken, verifyToken } from "@/lib/auth";
import { comparePassword, hashPassword } from "@/lib/crypto";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import {
	deleteCookie,
	getCookie,
	getSignedCookie,
	setCookie,
	setSignedCookie,
} from "hono/cookie";
import { z } from "zod";
import {
	LoginSchema,
	RegisterSchema,
	ResetPasswordSchema,
	UserResponseSchema,
} from "./schema";

const authRouter = new Hono();

// Register user
authRouter.post(
	"/register",
	describeRoute({
		tags: ["Auth"],
		summary: "User registration",
		description: "Register a new user",
		responses: {
			201: {
				description: "User registered successfully",
				content: {
					"application/json": {
						schema: resolver(UserResponseSchema),
					},
				},
			},
		},
	}),
	zValidator("json", RegisterSchema),
	async (c) => {
		const data = c.req.valid("json");
		const hashedPassword = await hashPassword(data.password);
		const db = createDb(env.DATABASE_URL);
		const user = await db.query.users.findFirst({
			where: eq(users.email, data.email),
		});
		if (user) {
			return c.json(
				{
					code: 400,
					msg: "User already exists",
				},
				400,
			);
		}

		const [newUser] = await db
			.insert(users)
			.values({
				id: crypto.randomUUID(),
				...data,
				password: hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		return c.json(
			{
				code: 201,
				msg: "User registered successfully",
				data: {
					...newUser,
					password: undefined,
					createdAt: newUser.createdAt.toISOString(),
					updatedAt: newUser.updatedAt.toISOString(),
				},
			},
			201,
		);
	},
);

// Login user
authRouter.post(
	"/login",
	describeRoute({
		tags: ["Auth"],
		summary: "User login",
		description: "Login with email and password",
		responses: {
			200: {
				description: "Login successful",
				content: {
					"application/json": {
						schema: resolver(
							z.object({
								code: z.number(),
								msg: z.string(),
								token: z.string(),
								user: UserResponseSchema.shape.data,
							}),
						),
					},
				},
			},
		},
	}),
	zValidator("json", LoginSchema),
	async (c) => {
		const { email, password } = c.req.valid("json");
		const db = createDb(env.DATABASE_URL);
		const user = await db.query.users.findFirst({
			where: eq(users.email, email),
		});

		if (!user || !(await comparePassword(password, user.password))) {
			return c.json(
				{
					code: 401,
					msg: "Invalid credentials",
				},
				401,
			);
		}

		// 更新最后登录时间
		await db
			.update(users)
			.set({ lastLoginAt: new Date() })
			.where(eq(users.id, user.id));
		const token = await generateToken({
			jwtPayload: {
				userId: user.id,
			},
		});

		setCookie(c, "token", token, {
			path: "/",
			httpOnly: true,
			sameSite: "strict",
			expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
		});
		return c.json({
			code: 200,
			msg: "登录成功",
			data: {
				token,
				user: {
					...user,
					password: undefined,
				},
			},
		});
	},
);

// Reset password
authRouter.post(
	"/reset-password",
	describeRoute({
		tags: ["Auth"],
		summary: "Reset password",
		description: "Reset user password",
		security: [{ Bearer: [] }],
		responses: {
			200: {
				description: "Password reset successful",
			},
		},
	}),
	zValidator("json", ResetPasswordSchema),
	async (c) => {
		const { oldPassword, newPassword } = c.req.valid("json");
		const payload = c.get("jwtPayload");
		const db = createDb(env.DATABASE_URL);
		const user = await db.query.users.findFirst({
			where: eq(users.id, payload.sub),
		});

		if (!user || !(await comparePassword(oldPassword, user.password))) {
			return c.json(
				{
					code: 401,
					msg: "Invalid old password",
				},
				401,
			);
		}

		const hashedPassword = await hashPassword(newPassword);
		await db
			.update(users)
			.set({ password: hashedPassword })
			.where(eq(users.id, user.id));

		return c.json({
			code: 200,
			msg: "Password reset successful",
		});
	},
);

authRouter.get(
	"/get-session",
	describeRoute({
		tags: ["Auth"],
		summary: "Get session",
		description: "Get session",
		responses: {
			200: {
				description: "Session retrieved successfully",
			},
		},
	}),
	async (c) => {
		try {
			const token = getCookie(c, "token");
			if (!token) {
				return c.json(
					{
						code: 401,
						msg: "Unauthorized",
					},
					401,
				);
			}
			const payload = await verifyToken(token);
			const db = createDb(env.DATABASE_URL);
			const user = await db.query.users.findFirst({
				where: eq(users.id, payload.userId as string),
			});
			return c.json({
				data: {
					...user,
					password: undefined,
				},
			});
		} catch (error) {
			console.log("error: ", error);
			return c.json(
				{
					code: 401,
					msg: "Unauthorized",
				},
				401,
			);
		}
	},
);

export { authRouter };
