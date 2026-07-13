import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // temp-mail.io API Proxy
  app.get("/api/domains", async (req, res) => {
    try {
      const response = await fetch("https://api.internal.temp-mail.io/api/v3/domains");
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      res.json(data.domains.map((d: any) => d.name));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch domains" });
    }
  });

  app.post("/api/generate", async (req, res) => {
    try {
      const { name, domain } = req.body;
      const response = await fetch("https://api.internal.temp-mail.io/api/v3/email/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domain })
      });
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      res.json([data.email]); // returning array for compatibility
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate mailbox" });
    }
  });

  app.get("/api/inbox", async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Missing email" });
    
    try {
      const response = await fetch(`https://api.internal.temp-mail.io/api/v3/email/${email}/messages`);
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      
      const formatted = data.map((m: any) => ({
        id: m.id,
        from: m.from,
        subject: m.subject,
        date: m.created_at
      }));
      
      res.json(formatted);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch inbox" });
    }
  });

  app.get("/api/message", async (req, res) => {
    const { email, id } = req.query;
    if (!email || !id) return res.status(400).json({ error: "Missing parameters" });
    
    try {
      const response = await fetch(`https://api.internal.temp-mail.io/api/v3/message/${id}`);
      if (!response.ok) throw new Error("API error");
      const mData = await response.json();
      
      const formatted = {
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
      
      res.json(formatted);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch message" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
