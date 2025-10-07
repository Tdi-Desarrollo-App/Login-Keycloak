// src/DevView.jsx
import React, { useMemo, useState } from "react";
import {
  FiPlusCircle,
  FiDownload,
  FiSearch,
  FiArrowLeft,
  FiArrowRight,
  FiAlertTriangle,
  FiCheckCircle,
  FiRefreshCw,
  FiList,
} from "react-icons/fi";

const INITIAL = {
  backlog: [
    { id: 1, title: "Migrar a Vite", owner: "Ana", pr: null, priority: "media" },
    { id: 2, title: "Refactor auth", owner: "Luis", pr: null, priority: "alta" },
  ],
  doing: [
    { id: 3, title: "UI Almacén", owner: "María", pr: 42, priority: "media" },
  ],
  review: [
    { id: 4, title: "Hook useAuthFetch", owner: "Jorge", pr: 57, priority: "alta" },
  ],
  done: [
    { id: 5, title: "Config Keycloak", owner: "Pablo", pr: 39, priority: "baja" },
  ],
};

const COLUMNS = [
  { key: "backlog", label: "Backlog", hint: "Ideas y pendientes" },
  { key: "doing", label: "Doing", hint: "En progreso" },
  { key: "review", label: "Review", hint: "En revisión" },
  { key: "done", label: "Done", hint: "Listo" },
];

const DEFAULT_WIP = { backlog: 999, doing: 2, review: 3, done: 999 };

export default function DevView() {
  const [board, setBoard] = useState(INITIAL);
  const [query, setQuery] = useState("");
  const [wip, setWip] = useState(DEFAULT_WIP);
  const [dragData, setDragData] = useState(null); // { fromKey, cardId }

  const allCards = useMemo(
    () => COLUMNS.flatMap((c) => board[c.key].map((card) => ({ ...card, status: c.key }))),
    [board]
  );

  const totals = useMemo(
    () =>
      COLUMNS.reduce((acc, c) => {
        acc[c.key] = board[c.key].length;
        return acc;
      }, {}),
    [board]
  );

  const filteredBoard = useMemo(() => {
    if (!query.trim()) return board;
    const q = query.toLowerCase();
    const pick = (arr) =>
      arr.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.owner || "").toLowerCase().includes(q) ||
          String(c.pr || "").includes(q)
      );
    return Object.fromEntries(COLUMNS.map((c) => [c.key, pick(board[c.key])]));
  }, [board, query]);

  const nextId = () => Math.max(...allCards.map((c) => c.id)) + 1;

  const addCard = () => {
    const title = prompt("Título de la tarea:");
    if (!title) return;
    const owner = prompt("Responsable (opcional):") || "";
    const priority = (prompt("Prioridad (alta/media/baja):") || "media").toLowerCase();
    setBoard((b) => ({
      ...b,
      backlog: [{ id: nextId(), title, owner, pr: null, priority: ["alta", "media", "baja"].includes(priority) ? priority : "media" }, ...b.backlog],
    }));
  };

  const exportCSV = () => {
    const headers = ["id", "title", "owner", "priority", "pr", "status"];
    const rows = allCards.map((c) =>
      headers.map((h) => `"${String(c[h] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dev_kanban.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const moveCard = (id, fromKey, toKey) => {
    if (fromKey === toKey) return;
    setBoard((b) => {
      const from = [...b[fromKey]];
      const idx = from.findIndex((c) => c.id === id);
      if (idx < 0) return b;
      const card = from.splice(idx, 1)[0];
      const to = [...b[toKey], card];
      return { ...b, [fromKey]: from, [toKey]: to };
    });
  };

  // Drag & Drop nativo
  const onDragStart = (e, fromKey, cardId) => {
    setDragData({ fromKey, cardId });
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e) => {
    e.preventDefault(); // necesario para permitir drop
    e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (e, toKey) => {
    e.preventDefault();
    if (!dragData) return;
    moveCard(dragData.cardId, dragData.fromKey, toKey);
    setDragData(null);
  };

  const overWip = (key) => totals[key] > (wip[key] ?? 999);

  // helpers UI
  const badge = (text, tone = "neutral") => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    fontSize: 12,
    lineHeight: 1,
    color: "var(--text)",
    background:
      tone === "danger" ? "var(--primary-20)" :
      tone === "warn" ? "var(--primary-10)" :
      "var(--panel)",
  });

  const priorityBadgeStyle = (p) => ({
    ...badge("", p === "alta" ? "danger" : p === "media" ? "warn" : "neutral"),
  });

  const columnStyle = (key) => ({
    background: "var(--panel)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: 12,
    boxShadow: "var(--shadow)",
    outline: overWip(key) ? "2px solid #b45309" : "none",
  });

  const cardStyle = {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 12,
    boxShadow: "var(--shadow)",
    cursor: "grab",
  };

  const th = {
    textAlign: "left",
    padding: 10,
    fontSize: 12,
    color: "var(--muted)",
    borderBottom: "1px solid var(--border)",
  };
  const td = {
    padding: 10,
    fontSize: 14,
    color: "var(--text)",
    borderBottom: "1px solid var(--border)",
    verticalAlign: "middle",
  };

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

  return (
    <div className="content">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
        <div>
          <h1 className="title">Desarrollo</h1>
          <p className="subtitle">Kanban simple con drag & drop, WIP, búsqueda y exportación.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={addCard} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <FiPlusCircle /> Nueva tarea
          </button>
          <button className="btn-primary" onClick={exportCSV} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <FiDownload /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Controles */}
      <div className="cards" style={{ marginTop: 22 }}>
        <div className="card" style={{ textAlign: "left" }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 160px 160px 160px 160px" }}>
            <div>
              <label style={label}>Buscar</label>
              <div style={{ position: "relative" }}>
                <FiSearch style={{ position: "absolute", left: 12, top: 10, width: 20, height: 20, color: "var(--muted)" }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Título, responsable, PR…"
                  style={{ ...input, paddingLeft: 38 }}
                />
              </div>
            </div>
            {COLUMNS.map((c) => (
              <div key={c.key}>
                <label style={label}>WIP {c.label}</label>
                <input
                  type="number"
                  min={1}
                  value={wip[c.key] ?? 999}
                  onChange={(e) => setWip((w) => ({ ...w, [c.key]: Number(e.target.value || 999) }))}
                  style={input}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="cards">
        {COLUMNS.map((c) => {
          const over = overWip(c.key);
          return (
            <div key={c.key} className="card" style={{ textAlign: "center" }}>
              <div className="card-icon">
                {c.key === "done" ? <FiCheckCircle className="icon-lg" /> : c.key === "review" ? <FiRefreshCw className="icon-lg" /> : <FiList className="icon-lg" />}
              </div>
              <div className="card-title">{c.label}</div>
              <div className="card-desc" style={{ fontSize: 22, fontWeight: 800 }}>{totals[c.key]}/{wip[c.key] ?? "∞"}</div>
              <div className="card-desc" style={{ marginTop: 6 }}>{c.hint}</div>
              {over && (
                <div style={{ marginTop: 10 }}>
                  <span style={badge("Sugerencia", "warn")}>
                    <FiAlertTriangle /> WIP excedido
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* TABLERO (por columnas) */}
      <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(4, minmax(240px, 1fr))", gap: 16 }}>
        {COLUMNS.map((column) => (
          <div
            key={column.key}
            style={columnStyle(column.key)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column.key)}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontWeight: 800, color: "var(--primary)" }}>{column.label}</div>
              <div className="subtitle" style={{ margin: 0 }}>{filteredBoard[column.key].length} items</div>
            </div>

            {/* Cabecera mini-tabla */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Tarea</th>
                    <th style={th}>Owner</th>
                    <th style={th}>PR</th>
                    <th style={th}>Prioridad</th>
                    <th style={th}>Mover</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBoard[column.key].map((card) => (
                    <tr key={card.id}>
                      <td style={td}>
                        <div
                          draggable
                          onDragStart={(e) => onDragStart(e, column.key, card.id)}
                          title="Arrastra para mover"
                          style={cardStyle}
                        >
                          {card.title}
                        </div>
                      </td>
                      <td style={td}>{card.owner || <span style={{ color: "var(--muted)" }}>—</span>}</td>
                      <td style={td}>{card.pr != null ? `#${card.pr}` : <span style={{ color: "var(--muted)" }}>—</span>}</td>
                      <td style={td}>
                        <span style={priorityBadgeStyle(card.priority)}>{cap(card.priority)}</span>
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {/* Mover a la izquierda */}
                          <button
                            className="btn-primary"
                            onClick={() => {
                              const idx = COLUMNS.findIndex((c) => c.key === column.key);
                              if (idx > 0) moveCard(card.id, column.key, COLUMNS[idx - 1].key);
                            }}
                            title="Mover a la columna anterior"
                            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                          >
                            <FiArrowLeft /> Prev
                          </button>
                          {/* Mover a la derecha */}
                          <button
                            className="btn-primary"
                            onClick={() => {
                              const idx = COLUMNS.findIndex((c) => c.key === column.key);
                              if (idx < COLUMNS.length - 1) moveCard(card.id, column.key, COLUMNS[idx + 1].key);
                            }}
                            title="Mover a la siguiente columna"
                            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                          >
                            Next <FiArrowRight />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredBoard[column.key].length === 0 && (
                    <tr>
                      <td style={{ ...td, color: "var(--muted)", fontStyle: "italic" }} colSpan={5}>
                        Sin tarjetas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* util */
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
