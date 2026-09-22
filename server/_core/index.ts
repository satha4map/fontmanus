import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { bakeFontFeatures, inspectFontAxes, MAX_FONT_BYTES } from "../fontProcessor";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.post("/api/fonts/axes", express.raw({ type: "*/*", limit: `${MAX_FONT_BYTES}b` }), async (req, res) => {
    try {
      const input = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? "");
      res.json({ axes: await inspectFontAxes(input) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذّر قراءة محاور الخط";
      res.status(422).json({ error: message });
    }
  });
  app.post("/api/fonts/bake", express.raw({ type: "*/*", limit: `${MAX_FONT_BYTES}b` }), async (req, res) => {
    try {
      const featuresHeader = req.header("x-opentype-features") ?? "";
      const features = featuresHeader.split(",").map((feature) => feature.trim()).filter(Boolean);
      const axes = JSON.parse(req.header("x-opentype-axes") ?? "{}");
      const input = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? "");
      const result = await bakeFontFeatures(input, features, axes);
      const filename = "font-features-embedded.ttf";
      res.status(200)
        .set({
          "Content-Type": "font/ttf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "X-Embedded-Features": result.features.join(","),
          "Cache-Control": "no-store",
        })
        .send(result.output);
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذّرت معالجة الخط";
      res.status(422).json({ error: message });
    }
  });
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
