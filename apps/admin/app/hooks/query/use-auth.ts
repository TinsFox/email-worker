import {
	type LoginCredentials,
	type RegisterCredentials,
	type ResetPasswordCredentials,
	getSession,
	login,
	register,
	resetPassword,
} from "~/services/auth";

import {
	queryOptions,
	useMutation,
	useSuspenseQuery,
} from "@tanstack/react-query";

export const useLogin = () => {
	return useMutation({
		mutationFn: (credentials: LoginCredentials) => login(credentials),
	});
};

export const useRegister = () => {
	return useMutation({
		mutationFn: (credentials: RegisterCredentials) => register(credentials),
	});
};

export const useResetPassword = () => {
	return useMutation({
		mutationFn: (credentials: ResetPasswordCredentials) =>
			resetPassword(credentials),
	});
};

export const queryUserSession = () =>
	queryOptions({
		queryKey: ["user-session"],
		queryFn: getSession,
	});

export function useSession() {
	return useSuspenseQuery(queryUserSession());
}
