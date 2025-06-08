import { Separator } from "@poketto/ui/separator";
import { useTranslation } from "react-i18next";

import { AccountForm } from "./components/account-form";

export default function Component() {
	const { t } = useTranslation(["settings"]);
	return (
		<div className="space-y-6 w-full">
			<div>
				<h3 className="text-lg font-medium">{t("sections.account.title")}</h3>
				<p className="text-sm text-muted-foreground">
					{t("sections.account.description")}
				</p>
			</div>
			<Separator />
			<AccountForm />
		</div>
	);
}
