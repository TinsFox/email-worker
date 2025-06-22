import { z } from "zod";

// 定义查询参数 Schema
export const SearchQuerySchema = z.object({
	id: z.string().uuid().optional(),
	email: z.string().optional(),
	username: z.string().optional(),
	status: z.string().optional(),
	role: z.string().optional(),
});

// 定义更新用户 Schema
export const UpdateUserSchema = z.object({
	name: z.string().optional(),
	avatar: z.string().optional(),
	birthdate: z.string().optional(),
	bio: z.string().optional(),
	username: z.string().optional(),
});

// 定义路由参数 Schema
export const ParamsSchema = z.object({
	id: z.string().uuid(),
});

// 注册请求体
export const RegisterSchema = z.object({
	username: z.string().min(3).max(50),
	email: z.string().email(),
	password: z.string().min(6),
	name: z.string().min(2).max(100),
});

// 登录请求体
export const LoginSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});

// 重置密码请求体
export const ResetPasswordSchema = z.object({
	oldPassword: z.string(),
	newPassword: z.string().min(6),
});

// 用户响应数据
export const UserResponseSchema = z.object({
	code: z.number(),
	msg: z.string(),
	data: z.object({
		id: z.string(),
		username: z.string(),
		email: z.string(),
		name: z.string(),
		emailVerified: z.boolean(),
		isActive: z.boolean(),
		lastLoginAt: z.string().nullable(),
		image: z.string().nullable(),
		bio: z.string().nullable(),
		role: z.string(),
		createdAt: z.string(),
		updatedAt: z.string(),
	}),
});
