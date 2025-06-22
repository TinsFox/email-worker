import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { useNavigate } from "react-router";

import { apiFetch } from "@/lib/api-fetch";

import type { IBetterAuthUsers, ILoginForm } from "@/schema/user";

const userKeys = {
	all: ["users"] as const,
	list: () => [...userKeys.all, "list"] as const,
	detail: (id: string) => [...userKeys.all, id] as const,
};

export function useUserLoginMutation() {
	return useMutation({
		mutationFn: async (loginForm: ILoginForm) =>
			await apiFetch("/api/auth/login", {
				method: "POST",
				body: loginForm,
			}),
		mutationKey: ["user-login"],
	});
}

export function useUserLogoutMutation() {
	const navigate = useNavigate();
	return useMutation({
		mutationFn: async () => await apiFetch("/api/logout"),
		mutationKey: ["user-logout"],
		onSuccess: () => {
			localStorage.clear();
			navigate("/login");
		},
	});
}

export function useUsers(
	pagination?: PaginationState,
	searchParams?: Partial<IBetterAuthUsers>,
) {
	const { pageIndex = 1, pageSize = 10 } = pagination || {};
	const { data, isPending, isFetching, refetch } = useQuery({
		queryKey: [
			"users",
			pageIndex,
			pageSize,
			...Object.entries(searchParams || {}),
		],
		queryFn: async () => {
			const users = await apiFetch("/api/users", {
				method: "GET",
				query: {
					page: pageIndex,
					pageSize: pageSize,
					...searchParams,
				},
			});
			return users.data;
		},
		placeholderData: keepPreviousData,
	});

	return {
		isPending,
		isLoading: isFetching,
		refetch,
		data: {
			list: data?.data?.users || [],
			total: data?.data?.total || 0,
		},
	};
}

export function useUpdateUser() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (user: IBetterAuthUsers) =>
			await apiFetch(`/api/${user.id}`, {
				method: "PUT",
				body: user,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
	});
}
