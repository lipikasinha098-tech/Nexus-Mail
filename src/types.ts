export interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
}

export interface DetailedMessage extends EmailMessage {
  attachments: { filename: string; contentType: string; size: number }[];
  body: string;
  textBody: string;
  htmlBody: string;
}
