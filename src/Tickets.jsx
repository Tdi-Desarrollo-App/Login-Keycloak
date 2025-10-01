// src/Tickets.jsx
import React, { useMemo, useState } from "react";

const DATA = [
  { id: 101, asunto: "No imprime", estado: "abierto",  prioridad: "media",  solicitante: "María" },
  { id: 102, asunto: "CPU ruidosa", estado: "proceso", prioridad: "baja",   solicitante: "Luis" },
  { id: 103, asunto: "VPN caída",  estado: "abierto",  prioridad: "alta",   solicitante: "Sara" },
  { id: 104, asunto: "Correo SPAM", estado: "cerrado", prioridad: "media",  solicitante: "Pablo" },
];

export default function Tickets() {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("todos");

  const filtered = useMemo(() => {
    return DATA.filter(t =>
      (estado === "todos" || t.estado === estado) &&
      (q.trim() === "" || t.asunto.toLowerCase().includes(q.toLowerCase()))
    );
  }, [q, estado]);

  return (
    <div>
      <h2>Tickets</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por asunto..." style={input} />
        <select value={estado} onChange={(e) => setEstado(e.target.value)} style={input}>
          <option value="todos">Todos</option>
          <option value="abierto">Abiertos</option>
          <option value="proceso">En proceso</option>
          <option value="cerrado">Cerrados</option>
        </select>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map(t => (
          <div key={t.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>#{t.id} — {t.asunto}</strong>
              <span style={pill(t.estado)}>{t.estado}</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#475569" }}>
              Prioridad: <b>{t.prioridad}</b> &middot; Solicitante: {t.solicitante}
            </div>
            <button style={{ ...btn, marginTop: 10 }}>Ver detalle</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const input = { padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6 };
const card  = { background: "#fff", padding: 14, borderRadius: 8, boxShadow: "0 2px 6px rgba(0,0,0,.08)" };
const btn   = { padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff", cursor: "pointer" };
const pill = (estado) => ({
  textTransform: "capitalize",
  padding: "4px 8px",
  borderRadius: 999,
  background: estado === "cerrado" ? "#dcfce7" : estado === "proceso" ? "#fef9c3" : "#fee2e2",
  border: "1px solid #e5e7eb",
  fontSize: 12
});
