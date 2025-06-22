import { apiFetch } from "~/lib/api-fetch";

export interface LoginCredentials {
	email: string;
	password: string;
}

export const login = async (credentials: LoginCredentials) => {
	return await apiFetch<UserSession>("/api/auth/login", {
		method: "POST",
		body: credentials,
	});
};

export interface RegisterCredentials {
	username: string;
	email: string;
	password: string;
	name: string;
}

export const register = async (credentials: RegisterCredentials) => {
	return await apiFetch<UserSession>("/api/auth/register", {
		method: "POST",
		body: credentials,
	});
};

export interface UserSession {
	bio: string;
	createdAt: string;
	email: string;
	emailVerified: boolean;
	id: string;
	image: string;
	isActive: boolean;
	lastLoginAt: string;
	name: string;
	role: string;
	updatedAt: string;
	username: string;
}
export const getSession = async () => {
	return await apiFetch<UserSession>("/api/auth/get-session", {
		method: "GET",
	});
};

export const logout = async () => {
	return await apiFetch("/api/auth/logout", {
		method: "POST",
	});
};

export interface ResetPasswordCredentials {
	oldPassword: string;
	newPassword: string;
}

export const resetPassword = async (credentials: ResetPasswordCredentials) => {
	return await apiFetch<UserSession>("/api/auth/reset-password", {
		method: "POST",
		body: credentials,
	});
};
