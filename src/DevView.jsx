// src/DevView.jsx
import React from "react";

const COLS = {
  backlog:  [{ id: 1, title: "Migrar a Vite" }, { id: 2, title: "Refactor auth" }],
  doing:    [{ id: 3, title: "UI Almacén" }],
  review:   [{ id: 4, title: "Hook useAuthFetch" }],
  done:     [{ id: 5, title: "Config Keycloak" }],
};

export default function DevView() {
  return (
    <div>
      <h2>Desarrollo</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(220px, 1fr))", gap: 12 }}>
        {Object.entries(COLS).map(([col, cards]) => (
          <div key={col} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, textTransform: "capitalize" }}>{col}</div>
            <div style={{ display: "grid", gap: 8 }}>
              {cards.map(c => (
                <div key={c.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
                  {c.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
