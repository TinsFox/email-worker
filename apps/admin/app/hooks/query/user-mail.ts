import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { fetchMails } from "~/services/mails";

// 查询配置
export const mailsQueryOptions = () =>
	queryOptions({
		queryKey: ["user-mails"],
		queryFn: fetchMails,
		staleTime: 1000 * 60, // 1分钟后过期
	});

// 使用hook
export function useMails() {
	return useSuspenseQuery(mailsQueryOptions());
}
