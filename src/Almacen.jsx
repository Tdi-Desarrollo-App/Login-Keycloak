// src/Almacen.jsx
import React, { useMemo, useState } from "react";
import useAuthFetch from "./hooks/useAuthFetch";

const MOCK = [
  { sku: "A-100", nombre: "Teclado Mecánico", stock: 42, ubicacion: "B1" },
  { sku: "A-200", nombre: "Mouse Óptico", stock: 120, ubicacion: "A3" },
  { sku: "A-300", nombre: "Monitor 27\"", stock: 8, ubicacion: "C2" },
];

export default function Almacen({ keycloak, hasRole }) {
  const authFetch = useAuthFetch(keycloak);
  const [items, setItems] = useState(MOCK);
  const totalSKUs = items.length;
  const totalPiezas = useMemo(() => items.reduce((acc, i) => acc + i.stock, 0), [items]);

  const crearMovimiento = async (tipo = "entrada") => {
    // EJEMPLO: llamada a tu API (comentado para no fallar si no existe)
    // await authFetch("https://almacen.api.dev/movimientos", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ tipo, referencia: "UI-demo", items: [{ sku: "A-100", qty: 1 }] })
    // });
    alert(`Movimiento de ${tipo} simulado (ver API cuando esté lista).`);
  };

  return (
    <div>
      <h2>Almacén</h2>

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 6px rgba(0,0,0,.08)" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Total SKUs</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{totalSKUs}</div>
        </div>
        <div style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 6px rgba(0,0,0,.08)" }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>Total piezas</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{totalPiezas}</div>
        </div>
      </div>

      {/* Acciones (aquí podrías exigir más roles si quisieras) */}
      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button onClick={() => crearMovimiento("entrada")} style={btn}>
          Crear entrada
        </button>
        <button onClick={() => crearMovimiento("salida")} style={btn}>
          Crear salida
        </button>
      </div>

      {/* Tabla */}
      <div style={{ marginTop: 20, background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8fafc" }}>
            <tr>
              <th style={th}>SKU</th>
              <th style={th}>Nombre</th>
              <th style={th}>Stock</th>
              <th style={th}>Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.sku}>
                <td style={td}>{it.sku}</td>
                <td style={td}>{it.nombre}</td>
                <td style={td}>{it.stock}</td>
                <td style={td}>{it.ubicacion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const btn = { padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff", cursor: "pointer" };
const th = { textAlign: "left", padding: 12, fontSize: 12, color: "#475569", borderBottom: "1px solid #e2e8f0" };
const td = { padding: 12, fontSize: 14, color: "#0f172a", borderBottom: "1px solid #e2e8f0" };
