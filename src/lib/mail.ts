export const getDomains = async (): Promise<string[]> => {
  return ["guerrillamailblock.com", "sharklasers.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org"];
};

export const generateEmail = async (): Promise<string> => {
  const response = await fetch("https://api.guerrillamail.com/ajax.php?f=get_email_address");
  if (!response.ok) throw new Error("Failed to generate email");
  const data = await response.json();
  
  localStorage.setItem(`gm_sid_${data.email_addr}`, data.sid_token);
  return data.email_addr;
};

export const loginEmail = async (name: string, domain: string): Promise<string> => {
  let sid = localStorage.getItem(`gm_sid_${name}@${domain}`);
  
  if (!sid) {
    const res = await fetch("https://api.guerrillamail.com/ajax.php?f=get_email_address");
    const data = await res.json();
    sid = data.sid_token;
  }

  const response = await fetch(`https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=${name}&domain=${domain}&sid_token=${sid}`);
  if (!response.ok) throw new Error("Failed to login");
  const data = await response.json();
  
  localStorage.setItem(`gm_sid_${data.email_addr}`, data.sid_token);
  return data.email_addr;
};

export const getInbox = async (email: string) => {
  const sid = localStorage.getItem(`gm_sid_${email}`);
  if (!sid) throw new Error("Session expired");
  
  const response = await fetch(`https://api.guerrillamail.com/ajax.php?f=check_email&seq=0&sid_token=${sid}`);
  if (!response.ok) throw new Error("Failed to fetch messages");
  const data = await response.json();
  
  return data.list.map((m: any) => ({
    id: m.mail_id,
    from: m.mail_from,
    subject: m.mail_subject,
    date: m.mail_date
  }));
};

export const getMessage = async (email: string, id: string) => {
  const sid = localStorage.getItem(`gm_sid_${email}`);
  if (!sid) throw new Error("Session expired");
  
  const response = await fetch(`https://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=${id}&sid_token=${sid}`);
  if (!response.ok) throw new Error("Failed to fetch message");
  const mData = await response.json();
  
  return {
    id: mData.mail_id,
    from: mData.mail_from,
    subject: mData.mail_subject,
    date: mData.mail_date,
    attachments: [],
    body: mData.mail_body,
    htmlBody: mData.mail_body,
    textBody: mData.mail_body
  };
};
