// server/index.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// Opcionales recomendados:
import helmet from "helmet";
import compression from "compression";

import photoProxy from "./photo-proxy.js";   // <-- QUITA o remonta a /api/graph si choca con /me/photo
import { keycloakAuth } from "./keycloakAuth.js";
import profile from "./profile.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.SERVER_PORT) || 4001;
const HOST = "0.0.0.0";

// Seguridad / rendimiento (opcionales pero muy útiles)
app.set("trust proxy", 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // para servir foto si aplica
}));
app.use(compression());

// CORS (si realmente lo necesitas; de lo contrario, quítalo)
if (process.env.ALLOWED_ORIGIN) {
  const allowList = process.env.ALLOWED_ORIGIN.split(",").map(s => s.trim());
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowList.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
}

// --------- Rutas de API protegidas ---------
const api = express.Router();

// Aplica auth una sola vez a todo /api
api.use(keycloakAuth);

// Si mantienes photoProxy, móntalo en un prefijo distinto para NO chocar con /me/photo
// api.use("/graph", photoProxy);

// Nuestro router de perfil (trae /me/profile, /me/photo, /me/profile-extended)
api.use(profile);

// Health dentro del API
api.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api", api);

// --------- FRONTEND ESTÁTICO (CRA build) ---------
const STATIC_DIR = path.resolve(__dirname, "../build");
app.use(express.static(STATIC_DIR, {
  etag: true,
  lastModified: true,
  maxAge: "1h",
}));

// Fallback SPA: cualquier ruta NO /api devuelve index.html
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(STATIC_DIR, "index.html"));
});

// --------- Handlers de errores ---------
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "not_found", path: req.path });
  }
  next();
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return;
  res.status(500).json({ error: "internal_error" });
});

// --------- Start ---------
app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
  console.log(`Serving static from: ${STATIC_DIR}`);
});
