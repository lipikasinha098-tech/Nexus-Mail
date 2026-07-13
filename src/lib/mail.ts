export const getDomains = async (): Promise<string[]> => {
  const response = await fetch("/api/domains");
  if (!response.ok) throw new Error("Failed to fetch domains");
  const data = await response.json();
  return data.domains.map((d: any) => d.name);
};

export const generateEmail = async (): Promise<string> => {
  const domains = await getDomains();
  if (domains.length === 0) throw new Error("No domains available");
  
  const domain = domains[0];
  const randomString = Math.random().toString(36).substring(2, 10);
  const name = `nexus-${randomString}`;
  
  const response = await fetch("/api/email/new", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, domain })
  });
  
  if (!response.ok) throw new Error("Failed to create account");
  const data = await response.json();
  return data.email;
};

export const loginEmail = async (name: string, domain: string): Promise<string> => {
  const response = await fetch("/api/email/new", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, domain })
  });
  
  if (!response.ok) throw new Error("Failed to login to account");
  const data = await response.json();
  return data.email;
};

export const getInbox = async (email: string) => {
  const response = await fetch(`/api/email/${email}/messages`);
  if (!response.ok) throw new Error("Failed to fetch messages");
  const data = await response.json();
  return data.map((m: any) => ({
    id: m.id,
    from: m.from,
    subject: m.subject,
    date: m.created_at
  }));
};

export const getMessage = async (email: string, id: string) => {
  const response = await fetch(`/api/message/${id}`);
  if (!response.ok) throw new Error("Failed to fetch message");
  const mData = await response.json();
  
  return {
    id: mData.id,
    from: mData.from,
    subject: mData.subject,
    date: mData.created_at,
    attachments: mData.attachments ? mData.attachments.map((a: any) => ({
      filename: a.name,
      contentType: a.mime_type,
      size: a.size
    })) : [],
    body: mData.body_text || mData.body_html || "",
    textBody: mData.body_text || "",
    htmlBody: mData.body_html || (mData.body_text ? `<pre>${mData.body_text}</pre>` : "")
  };
};
