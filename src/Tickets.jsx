// src/Tickets.jsx
import React, { useMemo, useState } from "react";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlusCircle,
  FiAlertTriangle,
  FiClock,
  FiCheckCircle,
  FiUser,
} from "react-icons/fi";

// Dataset ampliado (mock; cambia por tu API si quieres)
const DATA = [
  { id: 101, asunto: "No imprime", estado: "abierto",  prioridad: "media", solicitante: "María", asignadoA: "Carlos", creado: "2025-10-01T09:10:00Z", slaHoras: 48 },
  { id: 102, asunto: "CPU ruidosa", estado: "proceso", prioridad: "baja",  solicitante: "Luis",  asignadoA: "Ana",    creado: "2025-10-03T14:30:00Z", slaHoras: 72 },
  { id: 103, asunto: "VPN caída",  estado: "abierto",  prioridad: "alta",  solicitante: "Sara",  asignadoA: "Jorge",  creado: "2025-10-06T07:55:00Z", slaHoras: 8  },
  { id: 104, asunto: "Correo SPAM",estado: "cerrado",  prioridad: "media", solicitante: "Pablo", asignadoA: "Carlos", creado: "2025-09-28T11:05:00Z", slaHoras: 120 },
  { id: 105, asunto: "Actualización de antivirus", estado: "proceso", prioridad: "media", solicitante: "Julia", asignadoA: "Ana", creado: "2025-10-04T10:00:00Z", slaHoras: 48 },
  { id: 106, asunto: "Lentitud en ERP", estado: "abierto", prioridad: "alta", solicitante: "Rogelio", asignadoA: "Jorge", creado: "2025-10-06T16:45:00Z", slaHoras: 24 },
];

const estados = ["todos", "abierto", "proceso", "cerrado"];
const prioridades = ["todas", "alta", "media", "baja"];
const sorters = [
  { key: "creado_desc", label: "Más recientes" },
  { key: "creado_asc", label: "Más antiguos" },
  { key: "prioridad_desc", label: "Prioridad (alta→baja)" },
  { key: "prioridad_asc", label: "Prioridad (baja→alta)" },
];
const prioridadRank = { alta: 3, media: 2, baja: 1 };

export default function Tickets() {
  // filtros/orden/paginación
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("todos");
  const [prioridad, setPrioridad] = useState("todas");
  const [solicitante, setSolicitante] = useState("todas");
  const [sortBy, setSortBy] = useState("creado_desc");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const solicitantesUnicos = useMemo(
    () => ["todas", ...Array.from(new Set(DATA.map((t) => t.solicitante))).sort()],
    []
  );

  // métricas
  const total = DATA.length;
  const abiertos = DATA.filter((t) => t.estado === "abierto").length;
  const proceso = DATA.filter((t) => t.estado === "proceso").length;
  const cerrados = DATA.filter((t) => t.estado === "cerrado").length;

  // filtro + búsqueda + ordenamiento
  const filtrados = useMemo(() => {
    let list = DATA.filter((t) => {
      const matchEstado = estado === "todos" || t.estado === estado;
      const matchPrioridad = prioridad === "todas" || t.prioridad === prioridad;
      const matchSolicitante = solicitante === "todas" || t.solicitante === solicitante;
      const matchQ =
        q.trim() === "" ||
        t.asunto.toLowerCase().includes(q.toLowerCase()) ||
        String(t.id).includes(q) ||
        t.solicitante.toLowerCase().includes(q.toLowerCase()) ||
        (t.asignadoA || "").toLowerCase().includes(q.toLowerCase());
      return matchEstado && matchPrioridad && matchSolicitante && matchQ;
    });

    // ordenar
    list.sort((a, b) => {
      if (sortBy === "creado_desc") return new Date(b.creado) - new Date(a.creado);
      if (sortBy === "creado_asc") return new Date(a.creado) - new Date(b.creado);
      if (sortBy === "prioridad_desc") return prioridadRank[b.prioridad] - prioridadRank[a.prioridad];
      if (sortBy === "prioridad_asc") return prioridadRank[a.prioridad] - prioridadRank[b.prioridad];
      return 0;
    });
    return list;
  }, [q, estado, prioridad, solicitante, sortBy]);

  // paginación
  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtrados.slice(start, start + pageSize);
  }, [filtrados, page]);

  const [selected, setSelected] = useState(null);

  // utils SLA
  const minsRestantesSLA = (t) => {
    const inicio = new Date(t.creado).getTime();
    const deadline = inicio + t.slaHoras * 60 * 60 * 1000;
    const diffMs = deadline - Date.now();
    return Math.round(diffMs / (60 * 1000)); // min
  };

  const exportarCSV = () => {
    const headers = ["id", "asunto", "estado", "prioridad", "solicitante", "asignadoA", "creado", "slaHoras"];
    const rows = filtrados.map((t) =>
      headers.map((h) => `"${String(t[h] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tickets.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const crearTicket = () => {
    const asunto = prompt("Asunto del ticket:");
    if (!asunto) return;
    const prioridad = (prompt("Prioridad (alta/media/baja):") || "media").toLowerCase();
    const solicitante = prompt("Solicitante:") || "Sin nombre";
    const nuevo = {
      id: Math.max(...DATA.map((d) => d.id)) + 1,
      asunto,
      estado: "abierto",
      prioridad: ["alta", "media", "baja"].includes(prioridad) ? prioridad : "media",
      solicitante,
      asignadoA: "",
      creado: new Date().toISOString(),
      slaHoras: 48,
    };
    DATA.unshift(nuevo); // mock
    // refrescar
    setQ((q) => q);
  };

  return (
    <div className="content">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
        <div>
          <h1 className="title">Tickets</h1>
          <p className="subtitle">Vista tabular con filtros, KPIs y SLA.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={crearTicket} className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <FiPlusCircle /> Nuevo ticket
          </button>
          <button onClick={exportarCSV} className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <FiDownload /> Exportar CSV
          </button>
        </div>
      </div>

      {/* KPIs (puedes quitarlos si no los necesitas) */}
      <div className="cards">
        <div className="card" style={{ textAlign: "center" }}>
          <div className="card-icon"><FiUser className="icon-lg" /></div>
          <div className="card-title">Total</div>
          <div className="card-desc" style={{ fontSize: 22, fontWeight: 800 }}>{total}</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div className="card-icon"><FiAlertTriangle className="icon-lg" /></div>
          <div className="card-title">Abiertos</div>
          <div className="card-desc" style={{ fontSize: 22, fontWeight: 800 }}>{abiertos}</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div className="card-icon"><FiClock className="icon-lg" /></div>
          <div className="card-title">En proceso</div>
          <div className="card-desc" style={{ fontSize: 22, fontWeight: 800 }}>{proceso}</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div className="card-icon"><FiCheckCircle className="icon-lg" /></div>
          <div className="card-title">Cerrados</div>
          <div className="card-desc" style={{ fontSize: 22, fontWeight: 800 }}>{cerrados}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginTop: 22, textAlign: "left" }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 180px 180px 180px 200px" }}>
          <div>
            <label style={label}>Buscar</label>
            <div style={{ position: "relative" }}>
              <FiSearch style={{ position: "absolute", left: 12, top: 10, width: 20, height: 20, color: "var(--muted)" }} />
              <input
                value={q}
                onChange={(e) => { setPage(1); setQ(e.target.value); }}
                placeholder="Asunto, #ID, solicitante o asignado"
                style={{ ...input, paddingLeft: 38 }}
              />
            </div>
          </div>
          <div>
            <label style={label}>Estado</label>
            <select value={estado} onChange={(e) => { setPage(1); setEstado(e.target.value); }} style={input}>
              {estados.map((e) => <option key={e} value={e}>{cap(e)}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Prioridad</label>
            <select value={prioridad} onChange={(e) => { setPage(1); setPrioridad(e.target.value); }} style={input}>
              {prioridades.map((p) => <option key={p} value={p}>{cap(p)}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Solicitante</label>
            <select value={solicitante} onChange={(e) => { setPage(1); setSolicitante(e.target.value); }} style={input}>
              {solicitantesUnicos.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Ordenar</label>
            <div style={{ position: "relative" }}>
              <FiFilter style={{ position: "absolute", left: 12, top: 10, width: 20, height: 20, color: "var(--muted)" }} />
              <select value={sortBy} onChange={(e) => { setPage(1); setSortBy(e.target.value); }} style={{ ...input, paddingLeft: 38 }}>
                {sorters.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="card" style={{ marginTop: 22, textAlign: "left", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--primary-10)" }}>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Asunto</th>
              <th style={th}>Estado</th>
              <th style={th}>Prioridad</th>
              <th style={th}>Solicitante</th>
              <th style={th}>Asignado</th>
              <th style={th}>Creado</th>
              <th style={th}>SLA</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((t) => {
              const mins = minsRestantesSLA(t);
              const vencido = mins < 0 && t.estado !== "cerrado";
              const cerca = mins >= 0 && mins <= 60 && t.estado !== "cerrado";
              return (
                <tr key={t.id}>
                  <td style={td}>#{t.id}</td>
                  <td style={td}>{t.asunto}</td>
                  <td style={td}>
                    <span style={badgeEstado(t.estado)}>{cap(t.estado)}</span>
                  </td>
                  <td style={td}>
                    <span style={badgePrioridad(t.prioridad)}>{cap(t.prioridad)}</span>
                  </td>
                  <td style={td}>{t.solicitante}</td>
                  <td style={td}>{t.asignadoA || <span style={{ color: "var(--muted)" }}>—</span>}</td>
                  <td style={td}>{new Date(t.creado).toLocaleString()}</td>
                  <td style={td}>
                    <span
                      title={vencido ? "SLA vencido" : `SLA restante: ${mins} min`}
                      style={badgeSLA({ vencido, cerca })}
                    >
                      {vencido ? <FiAlertTriangle /> : <FiClock />}
                      <span>{vencido ? "Vencido" : `${mins} min`}</span>
                    </span>
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="btn-primary" onClick={() => setSelected(t)}>Detalle</button>
                      {t.estado !== "cerrado" && (
                        <button
                          className="btn-primary"
                          onClick={() => {
                            // mock: avanzar estado
                            const next = t.estado === "abierto" ? "proceso" : "cerrado";
                            const idx = DATA.findIndex((x) => x.id === t.id);
                            if (idx >= 0) DATA[idx] = { ...DATA[idx], estado: next };
                            // refrescar
                            setQ((q) => q);
                          }}
                        >
                          Avanzar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="card" style={{ marginTop: 22, textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}>
        <span className="subtitle" style={{ margin: 0 }}>
          Página {page} de {totalPages} — {filtrados.length} resultados
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={() => setPage(1)} disabled={page === 1}>« Primero</button>
          <button className="btn-primary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹ Anterior</button>
          <button className="btn-primary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Siguiente ›</button>
          <button className="btn-primary" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Último »</button>
        </div>
      </div>

      {/* Panel detalle */}
      {selected && (
        <div className="card" style={{ marginTop: 22, textAlign: "left" }}>
          <div className="card-title">Detalle del ticket</div>
          <pre>{JSON.stringify(selected, null, 2)}</pre>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn-primary" onClick={() => setSelected(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- estilos inline mínimos, usando tu paleta (responsivos a claro/oscuro) ---------- */
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const label = { display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 };
const input = {
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
  verticalAlign: "middle",
};

const badgeBase = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  fontSize: 12,
  lineHeight: 1,
  color: "var(--text)",
  background: "var(--panel)",
};

const badgeEstado = (estado) => ({
  ...badgeBase,
  background:
    estado === "cerrado" ? "var(--primary-10)" :
    estado === "proceso" ? "var(--primary-20)" :
    "var(--primary-10)",
  // texto con buen contraste en ambos modos:
  color: "var(--text)",
});

const badgePrioridad = (p) => ({
  ...badgeBase,
  background:
    p === "alta" ? "var(--primary-20)" :
    p === "media" ? "var(--primary-10)" :
    "var(--panel)",
  border: "1px solid var(--border)",
});

const badgeSLA = ({ vencido, cerca }) => ({
  ...badgeBase,
  background: vencido ? "var(--primary-20)" : cerca ? "var(--primary-10)" : "var(--panel)",
  border: "1px solid var(--border)",
});
