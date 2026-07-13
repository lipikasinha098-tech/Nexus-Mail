import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const getPassword = (email: string) => `${email}-NexusSecret!#42`;

const getMailTmToken = async (email: string) => {
  const password = getPassword(email);
  const response = await fetch("https://api.mail.tm/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: email, password })
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 422) {
      // try to create account
      const createRes = await fetch("https://api.mail.tm/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: email, password })
      });
      if (createRes.ok) {
        // try token again
        const retryRes = await fetch("https://api.mail.tm/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: email, password })
        });
        if (retryRes.ok) {
          const data = await retryRes.json();
          return data.token;
        }
      }
    }
    throw new Error("Failed to get token");
  }
  const data = await response.json();
  return data.token;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/domains", async (req, res) => {
    try {
      const response = await fetch("https://api.mail.tm/domains");
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      res.json(data['hydra:member'].map((d: any) => d.domain));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch domains" });
    }
  });

  app.get("/api/generate", async (req, res) => {
    try {
      const dRes = await fetch("https://api.mail.tm/domains");
      if (!dRes.ok) throw new Error("Failed to fetch domains");
      const dData = await dRes.json();
      const domain = dData['hydra:member'][0].domain;
      
      const randomString = Math.random().toString(36).substring(2, 10);
      const email = `nexus-${randomString}@${domain}`;
      
      const password = getPassword(email);
      const createRes = await fetch("https://api.mail.tm/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: email, password })
      });
      
      if (!createRes.ok) throw new Error("Failed to create account");
      
      res.json([email]); // array format to match frontend expectation
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate mailbox" });
    }
  });

  app.get("/api/inbox", async (req, res) => {
    const { login, domain } = req.query;
    if (!login || !domain) {
      return res.status(400).json({ error: "Missing login or domain" });
    }
    const email = `${login}@${domain}`;
    try {
      const token = await getMailTmToken(email);
      const mRes = await fetch("https://api.mail.tm/messages", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!mRes.ok) throw new Error("Failed to fetch messages");
      const mData = await mRes.json();
      
      const formatted = mData['hydra:member'].map((m: any) => ({
        id: m.id,
        from: m.from.address,
        subject: m.subject,
        date: m.createdAt
      }));
      
      res.json(formatted);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch inbox" });
    }
  });

  app.get("/api/message", async (req, res) => {
    const { login, domain, id } = req.query;
    if (!login || !domain || !id) {
      return res.status(400).json({ error: "Missing parameters" });
    }
    const email = `${login}@${domain}`;
    try {
      const token = await getMailTmToken(email);
      const mRes = await fetch(`https://api.mail.tm/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!mRes.ok) throw new Error("Failed to fetch message");
      const mData = await mRes.json();
      
      const formatted = {
        id: mData.id,
        from: mData.from.address,
        subject: mData.subject,
        date: mData.createdAt,
        attachments: mData.hasAttachments ? (mData.attachments || []).map((a: any) => ({
          filename: a.filename,
          contentType: a.contentType,
          size: a.size
        })) : [],
        body: mData.text || "",
        textBody: mData.text || "",
        htmlBody: mData.html || (mData.text ? `<pre>${mData.text}</pre>` : "")
      };
      
      res.json(formatted);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch message" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
