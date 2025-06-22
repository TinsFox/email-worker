import {
	type LoginCredentials,
	type RegisterCredentials,
	type ResetPasswordCredentials,
	getSession,
	login,
	logout,
	register,
	resetPassword,
} from "~/services/auth";

import {
	queryOptions,
	useMutation,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { queryClient } from "~/lib/query-client";

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
		staleTime: 1000 * 60 * 5,
	});

export const useLogout = () => {
	return useMutation({
		mutationFn: logout,
		onSuccess: () => {
			queryClient.removeQueries({ queryKey: ["user-session"] });
		},
	});
};

export function useSession() {
	return useSuspenseQuery(queryUserSession());
}
