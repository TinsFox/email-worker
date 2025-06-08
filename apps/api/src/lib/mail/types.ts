export type Header = Record<string, string>;

export type Address = {
	address: string;
	name: string;
};

export type Attachment = {
	filename: string;
	mimeType: string;
	disposition: "attachment" | "inline";
	related?: boolean;
	contentId?: string;
	content: string | ArrayBuffer;
	size: number;
};

export type Email = {
	headers: Header[];
	from: Address;
	sender?: Address;
	replyTo?: Address[];
	deliveredTo?: string;
	returnPath?: string;
	to: Address[];
	cc?: Address[];
	bcc?: Address[];
	subject?: string;
	messageId: string;
	inReplyTo?: string;
	references?: string;
	date?: string;
	html?: string;
	text?: string;
	attachments: Attachment[];
};

export type DmarcRecordRow = {
	reportMetadataReportId: string;
	reportMetadataOrgName: string;
	reportMetadataDateRangeBegin: number;
	reportMetadataDateRangeEnd: number;
	reportMetadataError: string;

	policyPublishedDomain: string;
	policyPublishedADKIM: AlignmentType;
	policyPublishedASPF: AlignmentType;
	policyPublishedP: DispositionType;
	policyPublishedSP: DispositionType;
	policyPublishedPct: number;

	recordRowSourceIP: string;
	recordRowCount: number;
	recordRowPolicyEvaluatedDKIM: DMARCResultType;
	recordRowPolicyEvaluatedSPF: DMARCResultType;
	recordRowPolicyEvaluatedDisposition: DispositionType;
	recordRowPolicyEvaluatedReasonType: PolicyOverrideType;
	recordIdentifiersEnvelopeTo: string;
	recordIdentifiersHeaderFrom: string;
};

export enum AlignmentType { // eslint-disable-line no-shadow
	r = 0, // eslint-disable-line id-length
	s = 1, // eslint-disable-line id-length
}

export enum DMARCResultType { // eslint-disable-line no-shadow
	fail = 0,
	pass = 1,
}

export enum DispositionType { // eslint-disable-line no-shadow
	none = 0,
	quarantine = 1,
	reject = 2,
}

export enum PolicyOverrideType { // eslint-disable-line no-shadow
	other = 0,
	forwarded = 1,
	sampled_out = 2,
	trusted_forwarder = 3,
	mailing_list = 4,
	local_policy = 5,
}

interface EmailAddress {
	address: string;
	name: string;
}

export interface EmailData {
	from: string;
	to: string[];
	subject: string;
	text: string;
	html?: string;
	date: Date;
	attachments: Array<{
		filename: string;
		mimeType: string;
		content: ArrayBuffer | string;
		size: number;
		disposition: string;
	}>;
	messageId: string;
	inReplyTo?: string;
	replyTo: string[];
	references: string[];
	headers: Record<string, string>;
}

export interface EmailStorage {
	id: string;
	mailbox: string;
	emailData: EmailData;
	attachmentUrls: string[];
	createdAt: Date;
}

export interface NotificationTarget {
	type: string;
	webhook: string;
	enabled: boolean;
}

export interface EmailMessage {
	raw: ArrayBuffer;
	from: string;
	to: string;
	headers: Headers;
	forward: (recipient: string) => Promise<void>;
}
