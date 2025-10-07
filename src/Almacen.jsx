// src/Almacen.jsx
import React, { useMemo, useState } from "react";
import useAuthFetch from "./hooks/useAuthFetch";
import {
  FiPackage,
  FiList,
  FiAlertTriangle,
  FiDownload,
  FiPlus,
  FiMinus,
  FiSearch,
  FiActivity,
} from "react-icons/fi";

// Mock con productos de ORTOPEDIA
const MOCK = [
  { sku: "P-PLACA-3.5-L", nombre: "Placa bloqueo 3.5 LCP 10 orificios", stock: 12, ubicacion: "O-PL" },
  { sku: "P-CLAVO-TFN-11x380", nombre: "Clavo intramedular fémur TFN 11x380", stock: 4, ubicacion: "O-CL" },
  { sku: "P-TORN-CAN-4.0x40", nombre: "Tornillo canulado 4.0 x 40 mm", stock: 60, ubicacion: "O-TO" },
  { sku: "P-ALOIN-CR-10cc", nombre: "Aloinjerto cortical rallado 10 cc", stock: 8, ubicacion: "O-AL" },
  { sku: "P-CEMENTO-AB-40g", nombre: "Cemento óseo con antibiótico 40 g", stock: 20, ubicacion: "O-CE" },
];

export default function Almacen({ keycloak, hasRole = () => true }) {
  const authFetch = useAuthFetch(keycloak);

  // Estado base
  const [items, setItems] = useState(MOCK);
  const [query, setQuery] = useState("");
  const [ubicacion, setUbicacion] = useState("todas");
  const [sortKey, setSortKey] = useState("sku");
  const [sortDir, setSortDir] = useState("asc");
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [selected, setSelected] = useState(null);

  // KPIs
  const totalSKUs = items.length;
  const totalPiezas = useMemo(
    () => items.reduce((acc, i) => acc + Number(i.stock || 0), 0),
    [items]
  );
  const ubicacionesUnicas = useMemo(
    () => Array.from(new Set(items.map((i) => i.ubicacion))).sort(),
    [items]
  );
  const bajoStock = useMemo(
    () => items.filter((i) => Number(i.stock) <= Number(lowStockThreshold)).length,
    [items, lowStockThreshold]
  );

  // Filtro + búsqueda + orden
  const visibleItems = useMemo(() => {
    let list = [...items];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) =>
          i.sku.toLowerCase().includes(q) ||
          i.nombre.toLowerCase().includes(q) ||
          String(i.ubicacion).toLowerCase().includes(q)
      );
    }

    if (ubicacion !== "todas") {
      list = list.filter((i) => String(i.ubicacion) === String(ubicacion));
    }

    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });

    return list;
  }, [items, query, ubicacion, sortKey, sortDir]);

  // Acciones (mock)
  const crearMovimiento = async (tipo = "entrada") => {
    try {
      // Ejemplo de integración real:
      // await authFetch("https://almacen.api.dev/movimientos", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ tipo, referencia: "UI-demo", items: [{ sku: "P-PLACA-3.5-L", qty: 1 }] }),
      // });
      alert(`Movimiento de ${tipo} simulado (ver API cuando esté lista).`);
    } catch (e) {
      alert("Ocurrió un error al crear el movimiento.");
    }
  };

  const agregarItem = () => {
    const sku = prompt("SKU nuevo:");
    if (!sku) return;
    const nombre = prompt("Descripción del implante/material:") || "Producto ortopédico";
    const stock = Number(prompt("Stock inicial:") || "0");
    const ubicacion = prompt("Ubicación (p.ej. O-PL):") || "O-PL";
    setItems((prev) => {
      if (prev.some((i) => i.sku === sku)) {
        alert("Ese SKU ya existe.");
        return prev;
      }
      return [...prev, { sku, nombre, stock, ubicacion }];
    });
  };

  const exportarCSV = () => {
    const headers = ["sku", "nombre", "stock", "ubicacion"];
    const rows = visibleItems.map((i) =>
      [i.sku, i.nombre, i.stock, i.ubicacion]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ortopedia_inventario.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Wrapper de ícono (toma color de var(--primary) para claro/oscuro)
  const IconWrap = ({ children, label }) => (
    <div
      role="img"
      aria-label={label}
      style={{
        width: 84,
        height: 84,
        margin: "2px auto 6px",
        borderRadius: 20,
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ color: "var(--primary)", width: 36, height: 36 }}>{children}</div>
    </div>
  );

  return (
    <div className="content">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
        <div>
          <h1 className="title">Ortopedia</h1>
          <p className="subtitle">Placas, clavos, tornillos canulados, aloinjertos, cemento óseo y más.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="cards">
        <div className="card" role="region" aria-label="Total SKUs">
          <IconWrap label="Total SKUs"><FiPackage size={36} /></IconWrap>
          <div className="card-title">Total SKUs</div>
          <div className="card-desc" style={{ fontSize: 22, fontWeight: 800 }}>{totalSKUs}</div>
        </div>

        <div className="card" role="region" aria-label="Total piezas">
          <IconWrap label="Total piezas"><FiList size={36} /></IconWrap>
          <div className="card-title">Total piezas</div>
          <div className="card-desc" style={{ fontSize: 22, fontWeight: 800 }}>{totalPiezas}</div>
        </div>

        <div className="card" role="region" aria-label="Bajo stock">
          <IconWrap label="Bajo stock"><FiAlertTriangle size={36} /></IconWrap>
          <div className="card-title">Bajo stock (≤ {lowStockThreshold})</div>
          <div className="card-desc" style={{ fontSize: 22, fontWeight: 800 }}>{bajoStock}</div>
        </div>

        <div className="card" role="region" aria-label="Categoría Ortopedia">
          <IconWrap label="Categoría"><FiActivity size={36} /></IconWrap>
          <div className="card-title">Categoría</div>
          <div className="card-desc" style={{ fontSize: 16, fontWeight: 700 }}>
            Implantes y material ortopédico
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="cards" style={{ marginTop: 22 }}>
        <div className="card" style={{ textAlign: "left" }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 180px 180px 150px" }}>
            <div>
              <label style={labelStyle}>Buscar</label>
              <div style={{ position: "relative" }}>
                <FiSearch style={{ position: "absolute", left: 12, top: 10, width: 20, height: 20, color: "var(--muted)" }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SKU, descripción o ubicación"
                  style={{ ...inputStyle, paddingLeft: 38 }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Ubicación</label>
              <select value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} style={inputStyle}>
                <option value="todas">Todas</option>
                {ubicacionesUnicas.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Ordenar por</label>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} style={inputStyle}>
                <option value="sku">SKU</option>
                <option value="nombre">Nombre</option>
                <option value="stock">Stock</option>
                <option value="ubicacion">Ubicación</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Dirección</label>
              <select value={sortDir} onChange={(e) => setSortDir(e.target.value)} style={inputStyle}>
                <option value="asc">Ascendente</option>
                <option value="desc">Descendente</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 14 }}>
            <label style={labelStyle}>Umbral bajo stock</label>
            <input
              type="number"
              min={0}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value))}
              style={{ ...inputStyle, width: 120 }}
            />
            <div style={{ flex: 1 }} />
            <button
              onClick={exportarCSV}
              className="btn-primary"
              style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
            >
              <FiDownload /> Exportar CSV
            </button>
          </div>
        </div>

        <div className="card" style={{ textAlign: "left" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {hasRole("almacen:write") && (
              <>
                <button onClick={() => crearMovimiento("entrada")} className="btn-primary">Crear entrada</button>
                <button onClick={() => crearMovimiento("salida")} className="btn-primary">Crear salida</button>
                <button onClick={agregarItem} className="btn-primary">Agregar SKU</button>
              </>
            )}
            {!hasRole("almacen:write") && (
              <span style={{ color: "var(--muted)" }}>
                No tienes permisos de escritura (almacen:write).
              </span>
            )}
          </div>
          <p className="subtitle" style={{ marginTop: 10 }}>
            Las acciones simulan el flujo y se conectan fácil a tu API (<code>useAuthFetch</code>).
          </p>
        </div>
      </div>

      {/* Tabla de inventario */}
      <div className="card" style={{ marginTop: 22, textAlign: "left", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--primary-10)" }}>
            <tr>
              <th style={th}>SKU</th>
              <th style={th}>Descripción</th>
              <th style={th}>Stock</th>
              <th style={th}>Ubicación</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((it) => {
              const isLow = Number(it.stock) <= Number(lowStockThreshold);
              return (
                <tr
                  key={it.sku}
                  onClick={() => setSelected(it)}
                  style={{
                    cursor: "pointer",
                    background: selected?.sku === it.sku ? "var(--primary-20)" : "transparent",
                  }}
                >
                  <td style={td}>{it.sku}</td>
                  <td style={td}>{it.nombre}</td>
                  <td style={{ ...td, fontWeight: isLow ? 700 : 500, color: isLow ? "#b45309" : "var(--text)" }}>
                    {it.stock}{isLow ? " ⚠️" : ""}
                  </td>
                  <td style={td}>{it.ubicacion}</td>
                  <td style={td}>
                    {hasRole("almacen:write") ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className="btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItems((prev) =>
                              prev.map((x) => (x.sku === it.sku ? { ...x, stock: Number(x.stock) + 1 } : x))
                            );
                          }}
                          title="Agregar 1"
                          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                        >
                          <FiPlus />
                          +1
                        </button>
                        <button
                          className="btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItems((prev) =>
                              prev.map((x) =>
                                x.sku === it.sku ? { ...x, stock: Math.max(0, Number(x.stock) - 1) } : x
                              )
                            );
                          }}
                          title="Restar 1"
                          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                        >
                          <FiMinus />
                          -1
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>Solo lectura</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detalle JSON */}
      {selected && (
        <div className="card" style={{ marginTop: 22, textAlign: "left" }}>
          <div className="card-title">Detalle del ítem seleccionado</div>
          <pre>{JSON.stringify(selected, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

/* --- estilos inline mínimos para inputs/tabla (respetando tu CSS) --- */
const labelStyle = { display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 };
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--panel)",
  color: "var(--text)",
  outline: "none",
};
const th = {
  textAlign: "left",
  padding: 12,
  fontSize: 12,
  color: "var(--muted)",
  borderBottom: "1px solid var(--border)",
};
const td = {
  padding: 12,
  fontSize: 14,
  color: "var(--text)",
  borderBottom: "1px solid var(--border)",
};
