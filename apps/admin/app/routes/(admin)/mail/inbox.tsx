import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useMails } from "~/hooks/query/user-mail";
import { cn } from "~/lib/utils";

export default function MailInbox() {
	const { data } = useMails();
	const mails = data?.list || [];

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b px-6 py-4">
				<h1 className="text-xl font-semibold">收件箱</h1>
				<div className="flex items-center space-x-2">
					<button
						type="button"
						className="rounded-md bg-primary px-4 py-2 text-white"
					>
						刷新
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-auto">
				{mails.map((mail) => (
					<div
						key={mail.id}
						className={cn(
							"flex cursor-pointer items-center gap-4 border-b px-6 py-4 hover:bg-muted/50",
						)}
					>
						<div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
							{mail.from.charAt(0).toUpperCase()}
						</div>

						<div className="min-w-0 flex-1">
							<div className="flex items-center justify-between">
								<div className="truncate text-sm font-medium">{mail.from}</div>
								<div className="text-xs text-muted-foreground">
									{formatDistanceToNow(new Date(mail.createdAt), {
										addSuffix: true,
										locale: zhCN,
									})}
								</div>
							</div>

							<div className="mt-1 text-sm font-medium text-foreground/90 line-clamp-1">
								{mail.subject}
							</div>

							<div className="mt-1 text-sm text-muted-foreground line-clamp-1">
								{mail.text}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
