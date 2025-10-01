// server/keycloakAuth.js
import jwksClient from "jwks-rsa";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const { KC_URL, KC_REALM } = process.env;

// JWKS client para obtener la public key del realm
const client = jwksClient({
  jwksUri: `${KC_URL}/realms/${encodeURIComponent(KC_REALM)}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000, // 10m
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
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return res.status(401).json({ error: "missing_bearer" });

  const issuer = `${KC_URL}/realms/${KC_REALM}`;

  jwt.verify(
    token,
    getKey,
    {
      algorithms: ["RS256"],
      issuer,             // asegura issuer correcto
      ignoreExpiration: false,
    },
    (err, decoded) => {
      if (err) return res.status(401).json({ error: "invalid_token" });
      // Guarda datos útiles para downstream
      req.kcToken = token;
      req.user = decoded;
      next();
    }
  );
}
