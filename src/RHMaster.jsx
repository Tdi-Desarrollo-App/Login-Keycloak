// src/RHMaster.jsx
import React, { useMemo, useState } from "react";
import {
  FiUsers,
  FiUserCheck,
  FiSearch,
  FiFilter,
  FiPlusCircle,
  FiDownload,
  FiUser,
  FiBriefcase,
} from "react-icons/fi";

const EMP_BASE = [
  { id: 1, nombre: "Ana",   depto: "Ventas",  puesto: "Ejecutiva", estado: "Activa" },
  { id: 2, nombre: "Luis",  depto: "Dev",     puesto: "Backend",   estado: "Activa" },
  { id: 3, nombre: "Pablo", depto: "Dev",     puesto: "QA",        estado: "Baja"   },
  { id: 4, nombre: "Sara",  depto: "Soporte", puesto: "Helpdesk",  estado: "Activa" },
];

const ESTADOS = ["Todos", "Activa", "Baja"];

export default function RHMaster() {
  const [empleados, setEmpleados] = useState(EMP_BASE);
  const [q, setQ] = useState("");
  const [depto, setDepto] = useState("Todos");
  const [estado, setEstado] = useState("Todos");
  const [sortBy, setSortBy] = useState("nombre_asc");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [selected, setSelected] = useState(null);

  // KPIs
  const total = empleados.length;
  const activas = empleados.filter((e) => e.estado === "Activa").length;

  // opciones dinámicas
  const deptosUnicos = useMemo(
    () => ["Todos", ...Array.from(new Set(empleados.map((e) => e.depto))).sort()],
    [empleados]
  );

  // filtros + orden
  const filtrados = useMemo(() => {
    let list = empleados.filter((e) => {
      const matchQ =
        q.trim() === "" ||
        e.nombre.toLowerCase().includes(q.toLowerCase()) ||
        e.depto.toLowerCase().includes(q.toLowerCase()) ||
        e.puesto.toLowerCase().includes(q.toLowerCase());
      const matchDepto = depto === "Todos" || e.depto === depto;
      const matchEstado = estado === "Todos" || e.estado === estado;
      return matchQ && matchDepto && matchEstado;
    });

    list.sort((a, b) => {
      switch (sortBy) {
        case "nombre_asc": return a.nombre.localeCompare(b.nombre);
        case "nombre_desc": return b.nombre.localeCompare(a.nombre);
        case "depto_asc": return a.depto.localeCompare(b.depto);
        case "depto_desc": return b.depto.localeCompare(a.depto);
        case "estado_asc": return a.estado.localeCompare(b.estado);
        case "estado_desc": return b.estado.localeCompare(a.estado);
        default: return 0;
      }
    });

    return list;
  }, [empleados, q, depto, estado, sortBy]);

  // paginación
  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtrados.slice(start, start + pageSize);
  }, [filtrados, page]);

  // alta simple (mock local)
  const altaEmpleado = () => {
    const nombre = prompt("Nombre:");
    if (!nombre) return;
    const depto = prompt("Departamento: (Dev, Ventas, Soporte, etc.)") || "Dev";
    const puesto = prompt("Puesto:") || "General";
    const estado = (prompt("Estado (Activa/Baja):") || "Activa").trim();
    const id = Math.max(0, ...empleados.map((e) => e.id)) + 1;
    setEmpleados((prev) => [...prev, { id, nombre, depto, puesto, estado: /baja/i.test(estado) ? "Baja" : "Activa" }]);
  };

  // export CSV
  const exportCSV = () => {
    const headers = ["id", "nombre", "depto", "puesto", "estado"];
    const rows = filtrados.map((e) =>
      headers.map((h) => `"${String(e[h] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "empleados.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // estilos pequeños (respetando Dashboard.css)
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
  const th = { textAlign: "left", padding: 12, fontSize: 12, color: "var(--muted)", borderBottom: "1px solid var(--border)" };
  const td = { padding: 12, fontSize: 14, color: "var(--text)", borderBottom: "1px solid var(--border)", verticalAlign: "middle" };

  const badgeEstado = (e) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    fontSize: 12,
    color: "var(--text)",
    background: e === "Activa" ? "var(--primary-10)" : "var(--primary-20)", // buen contraste en claro/oscuro
  });

  return (
    <div className="content">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
        <div>
          <h1 className="title">RRHH</h1>
          <p className="subtitle">Maestro de empleados con filtros, orden y exportación.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={altaEmpleado} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <FiPlusCircle /> Alta rápida
          </button>
          <button className="btn-primary" onClick={exportCSV} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <FiDownload /> Exportar CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="cards">
        <div className="card" style={{ textAlign: "center" }}>
          <div className="card-icon"><FiUsers className="icon-lg" /></div>
          <div className="card-title">Total empleados</div>
          <div className="card-desc" style={{ fontSize: 22, fontWeight: 800 }}>{total}</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div className="card-icon"><FiUserCheck className="icon-lg" /></div>
          <div className="card-title">Activos</div>
          <div className="card-desc" style={{ fontSize: 22, fontWeight: 800 }}>{activas}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginTop: 22, textAlign: "left" }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 180px 180px 200px" }}>
          <div>
            <label style={label}>Buscar</label>
            <div style={{ position: "relative" }}>
              <FiSearch style={{ position: "absolute", left: 12, top: 10, width: 20, height: 20, color: "var(--muted)" }} />
              <input
                value={q}
                onChange={(e) => { setPage(1); setQ(e.target.value); }}
                placeholder="Nombre, depto o puesto…"
                style={{ ...input, paddingLeft: 38 }}
              />
            </div>
          </div>
          <div>
            <label style={label}>Departamento</label>
            <select value={depto} onChange={(e) => { setPage(1); setDepto(e.target.value); }} style={input}>
              {deptosUnicos.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Estado</label>
            <select value={estado} onChange={(e) => { setPage(1); setEstado(e.target.value); }} style={input}>
              {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Ordenar</label>
            <div style={{ position: "relative" }}>
              <FiFilter style={{ position: "absolute", left: 12, top: 10, width: 20, height: 20, color: "var(--muted)" }} />
              <select value={sortBy} onChange={(e) => { setPage(1); setSortBy(e.target.value); }} style={{ ...input, paddingLeft: 38 }}>
                <option value="nombre_asc">Nombre (A→Z)</option>
                <option value="nombre_desc">Nombre (Z→A)</option>
                <option value="depto_asc">Depto (A→Z)</option>
                <option value="depto_desc">Depto (Z→A)</option>
                <option value="estado_asc">Estado (A→Z)</option>
                <option value="estado_desc">Estado (Z→A)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card" style={{ marginTop: 22, textAlign: "left", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--primary-10)" }}>
            <tr>
              <th style={th}>Nombre</th>
              <th style={th}>Depto</th>
              <th style={th}>Puesto</th>
              <th style={th}>Estado</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((e) => (
              <tr key={e.id}>
                <td style={td}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <FiUser /> {e.nombre}
                  </div>
                </td>
                <td style={td}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <FiBriefcase /> {e.depto}
                  </div>
                </td>
                <td style={td}>{e.puesto}</td>
                <td style={td}>
                  <span style={badgeEstado(e.estado)}>{e.estado}</span>
                </td>
                <td style={td}>
                  <button className="btn-primary" onClick={() => setSelected(e)}>Detalle</button>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td style={{ ...td, color: "var(--muted)", fontStyle: "italic" }} colSpan={5}>
                  Sin resultados
                </td>
              </tr>
            )}
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

      {/* Detalle */}
      {selected && (
        <div className="card" style={{ marginTop: 22, textAlign: "left" }}>
          <div className="card-title">Detalle del empleado</div>
          <pre>{JSON.stringify(selected, null, 2)}</pre>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn-primary" onClick={() => setSelected(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
