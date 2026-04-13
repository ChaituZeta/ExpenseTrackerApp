import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import app from './api/app.ts';

import fs from "fs";

dotenv.config();

// File-based logger for Hostinger debugging
const logFile = path.join(process.cwd(), "startup_debug.txt");
const log = (msg: string) => {
  const entry = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  fs.appendFileSync(logFile, entry);
};

log('--- SERVER.TS STARTING ---');
log(`Node Version: ${process.version}`);
log(`Port: ${process.env.PORT || 3000}`);
log(`Directory: ${process.cwd()}`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const expressApp = express();
    expressApp.use(express.json());
    
    console.log('Registering routes...');

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
    const { createServer: createViteServer } = await import("vite");
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
      log(`SUCCESS: Server is listening on port ${PORT}`);
    });
  } catch (error: any) {
    log(`CRITICAL STARTUP ERROR: ${error.message}`);
    if (error.stack) log(error.stack);
    process.exit(1);
  }
}

startServer();
