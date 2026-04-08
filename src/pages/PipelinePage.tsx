// src/pages/PipelinePage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

type Card = Record<string, any>;
type Pipeline = Record<string, Card[]>;

const STAGES = [
  { key: "identified", label: "Identified", icon: "🔍", color: "#95a5a6" },
  { key: "qualified", label: "Qualified", icon: "✅", color: "#3498db" },
  { key: "capture", label: "Capture", icon: "🎯", color: "#9b59b6" },
  { key: "proposal", label: "Proposal", icon: "📝", color: "#f39c12" },
  { key: "submitted", label: "Submitted", icon: "📤", color: "#e67e22" },
  { key: "won", label: "Won", icon: "🏆", color: "#28b44c" },
  { key: "lost", label: "Lost", icon: "❌", color: "#e74c3c" },
];

export default function PipelinePage() {
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState<Pipeline>({});
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dragItem, setDragItem] = useState<Card | null>(null);

  async function loadPipeline() {
    try {
      const r = await api.get("/discovery/pipeline");
      setPipeline(r.data.pipeline || {});
      setStats(r.data.stats || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadPipeline(); }, []);

  async function moveCard(card: Card, newStage: string) {
    if (card.pipeline_stage === newStage) return;
    try {
      await api.put(`/discovery/pipeline/${card.id}`, { stage: newStage });
      // Optimistic update
      const old = card.pipeline_stage || "identified";
      setPipeline(prev => {
        const updated = { ...prev };
        updated[old] = (updated[old] || []).filter(c => c.id !== card.id);
        updated[newStage] = [...(updated[newStage] || []), { ...card, pipeline_stage: newStage }];
        return updated;
      });
    } catch (e) { console.error(e); loadPipeline(); }
  }

  function handleDragStart(card: Card) { setDragItem(card); }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); }
  function handleDrop(stage: string) {
    if (dragItem) { moveCard(dragItem, stage); setDragItem(null); }
  }

  if (loading) return <div style={page}><div style={{ ...shell, display: "grid", placeItems: "center", minHeight: "60vh" }}><div style={{ opacity: 0.5 }}>Loading pipeline...</div></div></div>;

  return (
    <div style={page}>
      <div style={{ ...shell, width: "min(1400px,calc(100% - 32px))" }}>
        {/* Header */}
        <div style={topBar}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 18 }}>📊 Capture Pipeline</div>
            <div style={{ opacity: 0.6, fontSize: 12 }}>{stats.total || 0} opportunities tracked</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate("/discover")} style={btn}>Discover</button>
            <button onClick={() => navigate("/sam-search")} style={btn}>SAM Search</button>
            <button onClick={() => navigate("/bids")} style={btn}>Bids</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {STAGES.map(s => (
            <div key={s.key} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${s.color}33`, background: `${s.color}11`, fontSize: 12, fontWeight: 700 }}>
              <span style={{ color: s.color }}>{s.icon} {s.label}</span>
              <span style={{ marginLeft: 6, opacity: 0.7 }}>{(pipeline[s.key] || []).length}</span>
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, minmax(160px, 1fr))`, gap: 10, marginTop: 14, overflowX: "auto" }}>
          {STAGES.map(stage => (
            <div
              key={stage.key}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.key)}
              style={{
                borderRadius: 16, border: `1px solid ${stage.color}22`,
                background: `linear-gradient(180deg, ${stage.color}08, transparent)`,
                minHeight: 300, padding: 8,
              }}
            >
              {/* Column Header */}
              <div style={{ padding: "8px 10px", borderRadius: 12, background: `${stage.color}15`, marginBottom: 8, textAlign: "center" }}>
                <div style={{ fontSize: 16 }}>{stage.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: stage.color }}>{stage.label}</div>
                <div style={{ fontSize: 10, opacity: 0.5 }}>{(pipeline[stage.key] || []).length}</div>
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(pipeline[stage.key] || []).map(card => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => handleDragStart(card)}
                    onClick={() => navigate(`/opportunities/${card.id}`)}
                    style={{
                      padding: 10, borderRadius: 12,
                      border: "1px solid rgba(255,255,255,.10)",
                      background: "rgba(255,255,255,.05)",
                      cursor: "grab", fontSize: 11,
                      transition: "all .15s",
                    }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = `${stage.color}55`; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,.10)"; }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 12, lineHeight: 1.3, marginBottom: 4 }}>
                      {card.title?.substring(0, 50)}{(card.title?.length || 0) > 50 ? "..." : ""}
                    </div>
                    <div style={{ opacity: 0.6, fontSize: 10 }}>{card.agency_name?.substring(0, 30)}</div>
                    {card.due_date && <div style={{ color: "#f39c12", fontSize: 10, marginTop: 2 }}>⏰ {card.due_date}</div>}
                    <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                      {card.source === "sam.gov" && <span style={tag("#3498db")}>SAM</span>}
                      {card.naics_code && <span style={tag("#9b59b6")}>{card.naics_code}</span>}
                      {card.has_analysis && <span style={tag("#28b44c")}>Analyzed</span>}
                      {card.has_war_room && <span style={tag("#e74c3c")}>War Room</span>}
                      {card.fit_score && <span style={tag(card.fit_score >= 70 ? "#28b44c" : "#f39c12")}>{card.fit_score}%</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const tag = (color: string): React.CSSProperties => ({
  fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 6,
  background: `${color}22`, color, whiteSpace: "nowrap",
});

const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(1200px 800px at 20% 12%,rgba(122,63,255,.30),transparent 55%),radial-gradient(900px 650px at 78% 28%,rgba(255,185,56,.18),transparent 55%),linear-gradient(180deg,#060712,#0B1020)", color: "rgba(255,255,255,.92)", fontFamily: "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial" };
const shell: React.CSSProperties = { width: "min(1100px,calc(100% - 48px))", margin: "0 auto", padding: "28px 0 60px" };
const topBar: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, background: "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.04))", boxShadow: "0 14px 40px rgba(0,0,0,.45)" };
const btn: React.CSSProperties = { border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: "8px 14px", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.9)", fontWeight: 700, cursor: "pointer", fontSize: 12 };
