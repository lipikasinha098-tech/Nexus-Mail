import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.all("/api/*", async (req, res) => {
    try {
      const targetUrl = `https://api.internal.temp-mail.io/api/v3${req.originalUrl.substring(4)}`;
      
      const options: RequestInit = {
        method: req.method,
        headers: {
          "Content-Type": req.headers["content-type"] || "application/json",
          "Accept": "application/json"
        },
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
        options.body = JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, options);
      const data = await response.text();
      try {
        const jsonData = JSON.parse(data);
        res.status(response.status).json(jsonData);
      } catch (e) {
        res.status(response.status).send(data);
      }
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ error: "Proxy error" });
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
