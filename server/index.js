// server/index.js
import express from "express";
import dotenv from "dotenv";
import photoProxy from "./photo-proxy.js";
import { keycloakAuth } from "./keycloakAuth.js";
import profile from "./profile.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.SERVER_PORT) || 4001;

// CORS simple en dev (si front corre en otro puerto)
if (process.env.ALLOWED_ORIGIN) {
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
}

// Protege todo lo que cuelga de /api con JWT de Keycloak
app.use("/api", keycloakAuth);


app.use("/api", keycloakAuth, profile);


// Rutas
app.use("/api", photoProxy);

// Healthcheck
app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
