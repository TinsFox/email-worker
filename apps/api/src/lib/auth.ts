import { env } from "cloudflare:workers";
import { sign, verify } from "hono/jwt";
import type { JwtVariables } from "hono/jwt";
import type { JWTPayload } from "hono/utils/jwt/types";

const JWT_SECRET = env.JWT_SECRET;
export interface JwtPayload {
	userId: string;
	exp?: number;
}
/**
 * 生成JWT token
 * @param payload - 包含用户信息的payload
 * @returns JWT token字符串
 */
export const generateToken = (
	payload: JwtVariables<JwtPayload>,
): Promise<string> => {
	return sign(
		{
			userId: payload.jwtPayload.userId,
			exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
		},
		JWT_SECRET,
	);
};

/**
 * 验证JWT token
 * @param token - JWT token字符串
 * @returns 解码后的payload
 */
export const verifyToken = async (token: string): Promise<JWTPayload> => {
	try {
		return await verify(token, JWT_SECRET);
	} catch (error) {
		throw new Error("Invalid token");
	}
};

/**
 * 从Authorization header中提取token
 * @param authorization - Authorization header值
 * @returns token字符串
 */
export const extractToken = (authorization?: string): string => {
	if (!authorization) {
		throw new Error("No authorization header");
	}

	if (!authorization.startsWith("Bearer ")) {
		throw new Error("Invalid authorization format");
	}

	return authorization.slice(7); // 移除 "Bearer " 前缀
};

/**
 * 创建用于Hono的JWT中间件
 */
export const jwtMiddleware = async (c: any, next: any) => {
	try {
		const token = extractToken(c.req.header("Authorization"));
		const payload = await verifyToken(token);
		c.set("jwtPayload", payload);
		await next();
	} catch (error) {
		return c.json(
			{
				code: 401,
				msg: "Unauthorized",
			},
			401,
		);
	}
};
