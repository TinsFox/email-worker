export interface ForwardEmailConfig {
	forwardTo: string[];
	sender: string;
}

export interface ForwardEmailMessage {
	raw: ArrayBuffer;
	from: string;
	to: string;
	headers: Headers;
	forward: (recipient: string) => Promise<void>;
}
