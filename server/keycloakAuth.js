// server/keycloakAuth.js
import jwksClient from "jwks-rsa";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const {
  KC_URL,         // ej: https://sso.tu-dom.com  (o https://sso.tu-dom.com/auth para instalaciones legacy)
  KC_REALM,       // ej: imt
  KC_ISSUER,      // opcional: si lo defines, se usa tal cual (debe coincidir EXACTO con 'iss' del token)
  KC_AUDIENCE,    // opcional: si lo defines, validamos que 'aud' lo contenga
} = process.env;

// Construye el issuer esperado si no te lo pasan explícito
// Soportamos ambas variantes (con y sin '/auth')
function buildIssuerCandidates() {
  if (KC_ISSUER) return [KC_ISSUER];

  const base = (KC_URL || "").replace(/\/+$/, ""); // sin trailing slash
  const realm = encodeURIComponent(KC_REALM || "");
  const candidates = [
    `${base}/realms/${realm}`,        // Keycloak moderno (Quarkus dist)
    `${base}/auth/realms/${realm}`,   // Keycloak legacy (WildFly/dist. antiguas)
  ];
  return candidates;
}

const ISSUER_CANDIDATES = buildIssuerCandidates();

// JWKS client: usamos el endpoint moderno por defecto; si tu instancia es legacy, el URL sigue resolviendo
const jwksUri = `${(KC_URL || "").replace(/\/+$/, "")}/realms/${encodeURIComponent(KC_REALM || "")}/protocol/openid-connect/certs`;

const client = jwksClient({
  jwksUri,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000, // 10m
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err, null);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export function keycloakAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const m = /^Bearer (.+)$/i.exec(auth);
  if (!m) return res.status(401).json({ error: "missing_bearer" });

  const token = m[1];

  // Verificación inicial (sin issuer) para leer 'iss' y dar mejores errores
  let decodedUnverified;
  try {
    decodedUnverified = jwt.decode(token, { complete: true }) || {};
  } catch (e) {
    return res.status(401).json({ error: "invalid_jwt_format" });
  }

  const iss = decodedUnverified?.payload?.iss;
  const aud = decodedUnverified?.payload?.aud;

  // Validación “friendly” de issuer: aceptamos cualquiera de los candidatos
  const issuerOk = ISSUER_CANDIDATES.includes(iss);
  if (!issuerOk) {
    return res.status(401).json({
      error: "issuer_mismatch",
      expected: ISSUER_CANDIDATES,
      got: iss,
      hint: "Ajusta KC_URL/KC_REALM o define KC_ISSUER para que coincida exactamente con 'iss' del token.",
    });
  }

  jwt.verify(
    token,
    getKey,
    {
      algorithms: ["RS256"],
      issuer: iss,            // ahora que ya confirmamos el que viene en el token
      clockTolerance: 60,     // tolerancia de 60s por si hay skew de reloj
      ignoreExpiration: false,
    },
    (err, decoded) => {
      if (err) {
        return res.status(401).json({
          error: "invalid_token",
          message: err.message,
        });
      }

      // Validación opcional de audiencia, si defines KC_AUDIENCE
      if (KC_AUDIENCE) {
        const expected = KC_AUDIENCE;
        const ok = Array.isArray(decoded.aud)
          ? decoded.aud.includes(expected)
          : decoded.aud === expected || (typeof decoded.aud === "string" && decoded.aud?.split?.(" ").includes(expected));
        if (!ok) {
          return res.status(401).json({
            error: "audience_mismatch",
            expected,
            got: decoded.aud,
            hint: "Ajusta KC_AUDIENCE o revisa el 'aud' del access token de Keycloak.",
          });
        }
      }

      // Guardamos info útil para downstream
      req.kcToken = token;
      req.user = decoded;
      next();
    }
  );
}
