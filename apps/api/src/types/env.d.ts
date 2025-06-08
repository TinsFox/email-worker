interface Env {
	DB: D1Database;
	R2_BUCKET: R2Bucket;
	NOTIFICATION_TARGETS: string; // JSON string of NotificationTarget[]
	APP_URL: string;
}

interface EmailMessage {
	raw: ReadableStream;
	from: string;
	to: string;
	headers: Headers;
}
