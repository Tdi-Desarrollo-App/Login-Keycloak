// server/photo-proxy.js
import express from "express";
import qs from "querystring";

const router = express.Router();
const { AZ_TENANT_ID, AZ_CLIENT_ID, AZ_CLIENT_SECRET } = process.env;

async function getAppGraphToken() {
  const url = `https://login.microsoftonline.com/${AZ_TENANT_ID}/oauth2/v2.0/token`;
  const body = qs.stringify({
    client_id: AZ_CLIENT_ID,
    client_secret: AZ_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!resp.ok) throw new Error(`Graph app token fail: ${resp.status} ${await resp.text()}`);
  return resp.json();
}

router.get("/me/photo", async (req, res) => {
  try {
    const upn = req.user?.preferred_username;
    if (!upn) return res.status(400).json({ error: "missing_upn_from_keycloak" });

    const { access_token } = await getAppGraphToken();

    const g = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(upn)}/photo/$value`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (g.status === 404) return res.status(204).end();
    if (!g.ok) {
      const body = await g.text();
      return res.status(502).json({ error: "graph_error", status: g.status, body });
    }

    const contentType = g.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.send(Buffer.from(await g.arrayBuffer()));
  } catch (e) {
    console.error("[/me/photo] error:", e);
    res.status(500).json({ error: "photo_error", message: e.message });
  }
});

export default router;
