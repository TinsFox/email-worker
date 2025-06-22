import { nanoid } from "nanoid";
import type { EmailData } from "./types.js";

export async function handleAttachments(
	env: Env,
	mailbox: string,
	attachments: EmailData["attachments"],
): Promise<string[]> {
	const attachmentUrls: string[] = [];
	if (env.R2_BUCKET && attachments.length > 0) {
		try {
			for (const attachment of attachments) {
				const date = new Date();
				const key = `${mailbox}/${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${nanoid()}-${attachment.filename}`;
				await env.R2_BUCKET.put(key, attachment.content, {
					httpMetadata: {
						contentType: attachment.mimeType,
					},
				});
				attachmentUrls.push(key);
			}
		} catch (error) {
			console.error("Error handling attachments:", {
				error,
				errorMessage: error instanceof Error ? error.message : String(error),
				mailbox,
			});
			throw error;
		}
	}
	return attachmentUrls;
}
