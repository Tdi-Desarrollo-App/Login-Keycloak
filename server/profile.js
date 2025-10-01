// server/profile.js
import express from "express";
const router = express.Router();

const { KC_URL, KC_REALM, AZ_ALIAS } = process.env;

async function getAzureUserTokenFromBroker(kcAccessToken) {
  const url = `${KC_URL}/realms/${encodeURIComponent(KC_REALM)}/broker/${encodeURIComponent(AZ_ALIAS)}/token`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${kcAccessToken}` }});
  if (!resp.ok) throw new Error(`Broker token fail: ${resp.status}`);
  return resp.json(); // { access_token, ... }
}

router.get("/me/profile", async (req, res) => {
  try {
    const broker = await getAzureUserTokenFromBroker(req.kcToken);
    const azureAccess = broker.access_token;

    const url = "https://graph.microsoft.com/v1.0/me" +
      "?$select=displayName,jobTitle,department,mail,mobilePhone,officeLocation,userPrincipalName" +
      "&$expand=manager($select=displayName,mail)";

    const g = await fetch(url, { headers: { Authorization: `Bearer ${azureAccess}` } });
    if (!g.ok) return res.status(502).json({ error: "graph_error", status: g.status, body: await g.text() });
    const json = await g.json();
    res.json(json);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "profile_error" });
  }
});

export default router;
