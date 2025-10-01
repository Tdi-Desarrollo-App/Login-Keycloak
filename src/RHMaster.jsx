// src/RHMaster.jsx
import React, { useMemo, useState } from "react";

const EMP = [
  { id: 1, nombre: "Ana", depto: "Ventas",   puesto: "Ejecutiva", estado: "Activa" },
  { id: 2, nombre: "Luis", depto: "Dev",      puesto: "Backend",  estado: "Activa" },
  { id: 3, nombre: "Pablo", depto: "Dev",      puesto: "QA",       estado: "Baja"  },
  { id: 4, nombre: "Sara", depto: "Soporte",  puesto: "Helpdesk", estado: "Activa" },
];

export default function RHMaster() {
  const total = EMP.length;
  const activas = EMP.filter(e => e.estado === "Activa").length;

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return EMP;
    return EMP.filter(e =>
      e.nombre.toLowerCase().includes(q.toLowerCase()) ||
      e.depto.toLowerCase().includes(q.toLowerCase())
    );
  }, [q]);

  return (
    <div>
      <h2>RRHH</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div style={card}><div style={muted}>Total empleados</div><div style={kpi}>{total}</div></div>
        <div style={card}><div style={muted}>Activos</div><div style={kpi}>{activas}</div></div>
      </div>

      <div style={{ marginTop: 12 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nombre o depto..." style={input} />
      </div>

      <div style={{ marginTop: 12, background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8fafc" }}>
            <tr>
              <th style={th}>Nombre</th>
              <th style={th}>Depto</th>
              <th style={th}>Puesto</th>
              <th style={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id}>
                <td style={td}>{e.nombre}</td>
                <td style={td}>{e.depto}</td>
                <td style={td}>{e.puesto}</td>
                <td style={td}>{e.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const card = { background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 6px rgba(0,0,0,.08)" };
const muted = { fontSize: 12, color: "#64748b" };
const kpi   = { fontSize: 24, fontWeight: 700 };
const input = { padding: "8px 10px", border: "1px solid #cbd5e1", borderRadius: 6, width: "100%", maxWidth: 360 };
const th = { textAlign: "left", padding: 12, fontSize: 12, color: "#475569", borderBottom: "1px solid #e2e8f0" };
const td = { padding: 12, fontSize: 14, color: "#0f172a", borderBottom: "1px solid #e2e8f0" };
