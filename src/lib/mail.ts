export const getDomains = async (): Promise<string[]> => {
  const response = await fetch("/api/domains");
  if (!response.ok) throw new Error("Failed to fetch domains");
  return response.json();
};

export const generateEmail = async (): Promise<string> => {
  const domains = await getDomains();
  if (domains.length === 0) throw new Error("No domains available");
  
  const domain = domains[0];
  const randomString = Math.random().toString(36).substring(2, 10);
  const name = `nexus-${randomString}`;
  
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, domain })
  });
  
  if (!response.ok) {
    throw new Error("Failed to create account");
  }
  
  const data = await response.json();
  return data[0]; // returns [email]
};

export const getInbox = async (email: string) => {
  const response = await fetch(`/api/inbox?email=${email}`);
  if (!response.ok) throw new Error("Failed to fetch messages");
  return response.json();
};

export const getMessage = async (email: string, id: string) => {
  const response = await fetch(`/api/message?email=${email}&id=${id}`);
  if (!response.ok) throw new Error("Failed to fetch message");
  return response.json();
};
