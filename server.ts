import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import app from './api/app.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

async function startServer() {
  const expressApp = express();
  expressApp.use(express.json());

  // Bridge Express to Hono for all /api routes
  expressApp.all('/api/*', async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      
      // Construct the request for Hono
      const honoRequest = new Request(url.toString(), {
        method: req.method,
        headers: req.headers as any,
        body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
      });

      const response = await app.fetch(honoRequest);

      // Set response status and headers
      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      // Send response body
      const body = await response.text();
      res.send(body);
    } catch (error: any) {
      console.error("Hono Bridge Error:", error);
      res.status(500).json({ message: "Internal server error in API bridge", error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    expressApp.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    expressApp.use(express.static(distPath));
    expressApp.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  expressApp.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
