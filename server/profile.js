// server/profile.js
import express from "express";
import qs from "querystring";
import https from "https";

const router = express.Router();

const {
  AZ_TENANT_ID,
  AZ_CLIENT_ID,
  AZ_CLIENT_SECRET,
  KC_URL,
  KC_REALM,
  AZ_ALIAS = "azure",
} = process.env;

/* ---------- Keep-Alive ---------- */
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  timeout: 0,
});

/* ---------- Cache token de app ---------- */
let appTokenCache = { access_token: null, expires_at: 0 };

function log(...args) {
  console.log("[profile]", ...args);
}

/* ---------- Fetch con timeout + agent ---------- */
async function doFetch(url, opts = {}, timeoutMs = 10_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { agent: httpsAgent, signal: ctrl.signal, ...opts });
    return resp;
  } finally {
    clearTimeout(t);
  }
}

/* ---------- Reintentos simples ---------- */
async function withRetries(fn, attempts = 3, baseDelayMs = 300) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

/* ---------- TOKEN APP (client_credentials) ---------- */
async function getAppGraphToken() {
  const now = Date.now();
  if (appTokenCache.access_token && appTokenCache.expires_at - now > 60_000) {
    return { access_token: appTokenCache.access_token };
  }
  const url = `https://login.microsoftonline.com/${AZ_TENANT_ID}/oauth2/v2.0/token`;
  const body = qs.stringify({
    client_id: AZ_CLIENT_ID,
    client_secret: AZ_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  log("token: requesting app token to Azure AD");
  const resp = await withRetries(
    () => doFetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }, 8_000),
    3, 300
  );
  if (!resp.ok) throw new Error(`Graph app token fail: ${resp.status} ${await resp.text().catch(() => "")}`);

  const json = await resp.json(); // { access_token, expires_in }
  appTokenCache.access_token = json.access_token;
  appTokenCache.expires_at = now + (json.expires_in ?? 3600) * 1000;
  log("token: obtained OK, expires_in", json.expires_in);
  return json;
}

/* ---------- TOKEN DELEGADO (Keycloak broker → Azure) ---------- */
async function getDelegatedGraphTokenFromKeycloak(kcAccessToken) {
  // Requiere: Identity Provider Azure con "Store Tokens" ON
  // Endpoint: /realms/{realm}/broker/{alias}/token
  const url = `${KC_URL.replace(/\/+$/, "")}/realms/${encodeURIComponent(KC_REALM)}/broker/${encodeURIComponent(AZ_ALIAS)}/token`;
  const r = await doFetch(url, {
    headers: { Authorization: `Bearer ${kcAccessToken}` },
  }, 10_000);

  if (r.status === 404) {
    // Broker token endpoint no habilitado o alias incorrecto
    throw new Error("broker_token_endpoint_not_found");
  }
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`broker_token_error ${r.status} ${txt}`);
  }
  const json = await r.json().catch(() => null);
  // Keycloak retorna {access_token, expires_in, ...}
  if (!json?.access_token) {
    throw new Error("broker_token_missing_access_token");
  }
  return { access_token: json.access_token };
}

/* ---------- Helper Graph ---------- */
async function fetchGraph(url, access_token, timeoutMs = 10_000) {
  log("graph GET:", url);
  return doFetch(url, { headers: { Authorization: `Bearer ${access_token}`, Accept: "application/json" } }, timeoutMs);
}

/* ---------- Resolver identidad desde req.user ---------- */
function getLookupFromUser(req) {
  const u = req.user || {};
  const azureOid = u.azure_oid || u.azureObjectId || u.azure_id || u.oid;
  const upn = u.preferred_username || u.email;
  return { azureOid, upn };
}

/* ===================== RUTAS ===================== */

/** Diagnóstico de token */
router.get("/me/whoami", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "unauthorized" });
  res.json({
    sub: req.user.sub,
    preferred_username: req.user.preferred_username,
    email: req.user.email,
    azure_oid: req.user.azure_oid || req.user.azureObjectId || req.user.azure_id || req.user.oid || null,
    realm_roles: req.user.realm_access?.roles || [],
    iss: req.user.iss,
    aud: req.user.aud,
  });
});

/**
 * PERFIL: intenta primero con token DELEGADO (/me),
 * si falla, usa token de APP (requiere admin consent) con /users/{upn|oid}
 */
router.get("/me/profile", async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "unauthorized", message: "Missing user context" });

    // 1) Delegado (no requiere admin si user consent está permitido)
    try {
      const delegated = await getDelegatedGraphTokenFromKeycloak(req.kcToken || (req.headers.authorization||"").replace(/^Bearer\s+/i,""));
      const meR = await fetchGraph("https://graph.microsoft.com/v1.0/me?$select=displayName,jobTitle,department,mail,mobilePhone,businessPhones,officeLocation,userPrincipalName", delegated.access_token, 10_000);
      const meTxt = await meR.text().catch(() => "");
      log("graph /me status:", meR.status);
      if (meR.ok) {
        // Manager como paso opcional (si falla no rompe)
        let manager = null;
        try {
          const mgrR = await fetchGraph("https://graph.microsoft.com/v1.0/me/manager?$select=displayName,mail,userPrincipalName", delegated.access_token, 8_000);
          if (mgrR.ok) manager = await mgrR.json();
        } catch {}
        const me = meTxt ? JSON.parse(meTxt) : {};
        return res.json({ ...me, manager });
      } else {
        log("graph /me body:", meTxt);
        // Si 401/403, seguimos al plan B (app token)
      }
    } catch (e) {
      log("delegated token error:", e.message);
      // seguimos al plan B
    }

    // 2) APP (requiere admin consent a User.Read.All / Directory.Read.All)
    const { access_token } = await getAppGraphToken();
    const { azureOid, upn } = getLookupFromUser(req);
    if (!azureOid && !upn) {
      return res.status(400).json({ error: "no_upn", message: "No preferred_username/email/azureOid in token" });
    }
    const base = azureOid
      ? `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(azureOid)}`
      : `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(upn)}`;

    const meUrl = `${base}?$select=displayName,jobTitle,department,mail,mobilePhone,businessPhones,officeLocation,userPrincipalName`;
    const meResp = await fetchGraph(meUrl, access_token, 10_000);
    const meText = await meResp.text().catch(() => "");
    log("graph profile status:", meResp.status);
    if (!meResp.ok) {
      log("graph profile body:", meText);
      if (meResp.status === 404) {
        return res.status(404).json({ error: "user_not_found", lookup: azureOid || upn, body: meText });
      }
      if (meResp.status === 403) {
        return res.status(502).json({
          error: "graph_forbidden",
          hint: "Falta admin consent a Application permissions (User.Read.All / Directory.Read.All)",
          body: meText,
        });
      }
      if (meResp.status === 0) return res.status(504).json({ error: "graph_timeout" });
      return res.status(502).json({ error: "graph_error", status: meResp.status, body: meText });
    }
    const me = meText ? JSON.parse(meText) : {};

    // Manager opcional
    let manager = null;
    try {
      const mgrUrl = `${base}/manager?$select=displayName,mail,userPrincipalName`;
      const mgrResp = await fetchGraph(mgrUrl, access_token, 8_000);
      if (mgrResp.ok) manager = await mgrResp.json();
    } catch {}

    res.json({ ...me, manager });
  } catch (e) {
    if (e.name === "AbortError") return res.status(504).json({ error: "timeout" });
    log("profile error:", e.message);
    res.status(500).json({ error: "profile_error", message: e.message });
  }
});

/**
 * FOTO: intenta primero /me/photo con token delegado;
 * si falla, cae a app token; en 401/403/404 devuelve placeholder.
 */
router.get("/me/photo", async (req, res) => {
  try {
    if (!req.user) return res.status(401).send("unauthorized");

    // 1) Delegado
    try {
      const delegated = await getDelegatedGraphTokenFromKeycloak(req.kcToken || (req.headers.authorization||"").replace(/^Bearer\s+/i,""));
      const pr = await fetchGraph("https://graph.microsoft.com/v1.0/me/photo/$value", delegated.access_token, 10_000);
      log("graph /me/photo status:", pr.status);
      if (pr.ok) {
        res.setHeader("Content-Type", pr.headers.get("content-type") || "image/jpeg");
        res.setHeader("Cache-Control", "private, max-age=300");
        const buf = Buffer.from(await pr.arrayBuffer());
        return res.send(buf);
      }
      if (pr.status === 404 || pr.status === 401 || pr.status === 403) {
        res.setHeader("Cache-Control", "no-store");
        return res.redirect("/avatar-placeholder.png");
      }
    } catch (e) {
      log("delegated photo error:", e.message);
      // seguimos al plan B
    }

    // 2) APP (requiere admin consent)
    const { access_token } = await getAppGraphToken();
    const { azureOid, upn } = getLookupFromUser(req);
    if (!azureOid && !upn) return res.status(400).send("no_upn");
    const base = azureOid
      ? `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(azureOid)}`
      : `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(upn)}`;
    const url = `${base}/photo/$value`;

    const photo = await fetchGraph(url, access_token, 10_000);
    log("graph photo status:", photo.status);

    if (photo.status === 404 || photo.status === 401 || photo.status === 403) {
      res.setHeader("Cache-Control", "no-store");
      return res.redirect("/avatar-placeholder.png");
    }
    if (!photo.ok) {
      if (photo.status === 0) return res.status(504).send("graph_timeout");
      return res.status(502).send(`graph_photo_error ${photo.status}`);
    }

    res.setHeader("Content-Type", photo.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "private, max-age=300");
    const buf = Buffer.from(await photo.arrayBuffer());
    res.send(buf);
  } catch (e) {
    if (e.name === "AbortError") return res.status(504).send("timeout");
    log("photo error:", e.message);
    res.status(500).send("photo_error");
  }
});

/** Perfil extendido (mismo patrón) */
router.get("/me/profile-extended", async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "unauthorized" });

    // Primero delegado
    try {
      const delegated = await getDelegatedGraphTokenFromKeycloak(req.kcToken || (req.headers.authorization||"").replace(/^Bearer\s+/i,""));
      const url = "https://graph.microsoft.com/v1.0/me?$select=displayName,jobTitle,department,mail,mobilePhone,businessPhones,officeLocation,userPrincipalName,companyName,city,country";
      const r = await fetchGraph(url, delegated.access_token, 10_000);
      const txt = await r.text().catch(() => "");
      log("graph /me (extended) status:", r.status);
      if (r.ok) {
        const me = txt ? JSON.parse(txt) : {};
        // manager opcional
        let manager = null;
        try {
          const rm = await fetchGraph("https://graph.microsoft.com/v1.0/me/manager?$select=displayName,mail,userPrincipalName", delegated.access_token, 8_000);
          if (rm.ok) manager = await rm.json();
        } catch {}
        return res.json({ ...me, manager });
      }
    } catch (e) {
      log("delegated extended error:", e.message);
    }

    // Luego app
    const { access_token } = await getAppGraphToken();
    const { azureOid, upn } = getLookupFromUser(req);
    if (!azureOid && !upn) return res.status(400).json({ error: "no_upn" });
    const base = azureOid
      ? `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(azureOid)}`
      : `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(upn)}`;
    const select = "$select=displayName,jobTitle,department,mail,mobilePhone,businessPhones,officeLocation,userPrincipalName,companyName,city,country";
    const expand = "$expand=manager($select=displayName,mail,userPrincipalName)";
    const url = `${base}?${select}&${expand}`;

    const r = await fetchGraph(url, access_token, 10_000);
    const txt = await r.text().catch(() => "");
    log("graph profile-extended status:", r.status);
    if (!r.ok) {
      log("graph profile-extended body:", txt);
      if (r.status === 404) return res.status(404).json({ error: "user_not_found", lookup: azureOid || upn, body: txt });
      if (r.status === 403) return res.status(502).json({ error: "graph_forbidden", hint: "Admin consent requerido (Application permissions)", body: txt });
      if (r.status === 0) return res.status(504).json({ error: "graph_timeout" });
      return res.status(502).json({ error: "graph_error", status: r.status, body: txt });
    }
    const me = txt ? JSON.parse(txt) : {};
    res.json(me);
  } catch (e) {
    if (e.name === "AbortError") return res.status(504).json({ error: "timeout" });
    log("profile-extended error:", e.message);
    res.status(500).json({ error: "profile_error", message: e.message });
  }
});

export default router;
