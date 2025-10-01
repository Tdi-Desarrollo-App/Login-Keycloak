// server/index.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import photoProxy from "./photo-proxy.js";
import { keycloakAuth } from "./keycloakAuth.js";
import profile from "./profile.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.SERVER_PORT) || 4001;
const HOST = "0.0.0.0";

// CORS solo si realmente lo necesitas (dominios distintos front/api)
if (process.env.ALLOWED_ORIGIN) {
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
}

// ---------- Rutas de API (protegidas) ----------
app.use("/api", keycloakAuth, photoProxy);
app.use("/api", keycloakAuth, profile);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// ---------- FRONTEND ESTÁTICO (CRA build) ----------
const STATIC_DIR = path.resolve(__dirname, "../build");
app.use(express.static(STATIC_DIR));

// Fallback SPA: cualquier ruta NO /api devuelve index.html
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(STATIC_DIR, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
  console.log(`Serving static from: ${STATIC_DIR}`);
});
