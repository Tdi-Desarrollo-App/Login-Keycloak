// server/photo-proxy.js
import express from "express";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const { KC_URL, KC_REALM, AZ_ALIAS } = process.env;

// Obtiene el access token de Azure (del usuario) via broker
async function getAzureUserTokenFromBroker(kcAccessToken) {
  const url = `${KC_URL}/realms/${encodeURIComponent(KC_REALM)}/broker/${encodeURIComponent(AZ_ALIAS)}/token`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${kcAccessToken}` } });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Broker token fail: ${resp.status} ${text}`);
  }
  return resp.json(); // { access_token, ... }
}

// GET /api/me/photo  -> imagen
router.get("/me/photo", async (req, res) => {
  try {
    const kcAccess = req.kcToken; // set por keycloakAuth
    const broker = await getAzureUserTokenFromBroker(kcAccess);
    const azureAccess = broker.access_token;

    const g = await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
      headers: { Authorization: `Bearer ${azureAccess}` },
    });

    if (g.status === 404) return res.status(204).end();
    if (!g.ok) {
      const text = await g.text().catch(() => "");
      return res.status(502).json({ error: "graph_error", status: g.status, body: text });
    }

    const contentType = g.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await g.arrayBuffer());
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=300");
    return res.send(buf);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "photo_proxy_error" });
  }
});

// (Opcional) foto por UPN si autorizas ver fotos de otros
router.get("/users/:upn/photo", async (req, res) => {
  try {
    // Autorización adicional por rol si aplica:
    // const roles = req.user?.realm_access?.roles || [];
    // if (!roles.includes("access:rrhh")) return res.status(403).end();

    const kcAccess = req.kcToken;
    const broker = await getAzureUserTokenFromBroker(kcAccess);
    const azureAccess = broker.access_token;

    const upn = req.params.upn;
    const g = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(upn)}/photo/$value`, {
      headers: { Authorization: `Bearer ${azureAccess}` },
    });

    if (g.status === 404) return res.status(204).end();
    if (!g.ok) {
      const text = await g.text().catch(() => "");
      return res.status(502).json({ error: "graph_error", status: g.status, body: text });
    }

    const contentType = g.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await g.arrayBuffer());
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=300");
    return res.send(buf);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "photo_proxy_error" });
  }
});

export default router;
