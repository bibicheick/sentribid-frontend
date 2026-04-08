// src/pages/BidsPage.tsx
// Unified Bids + Opportunities dashboard with pipeline flow, quick-convert, and AI insights
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

type Bid = {
  id: number; bid_code: string; contract_title: string; agency_name: string;
  agency_type: string; contract_type: string; deadline_date: string;
  competition_level: string; risk_level: number; status: string;
  approved_at?: string | null; notes?: string; created_at?: string;
};
type Opp = {
  id: number; opp_code: string; title: string; agency_name: string;
  naics_code?: string; status: string; source_type?: string;
  due_date?: string; ai_bid_recommendation?: string; ai_confidence_score?: number;
  converted_bid_id?: number | null; created_at?: string;
};

type Tab = "all" | "opportunities" | "bids" | "pipeline";

export default function BidsPage() {
  const nav = useNavigate();
  const [bids, setBids] = useState<Bid[]>([]);
  const [opps, setOpps] = useState<Opp[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [converting, setConverting] = useState<number | null>(null);

  async function loadAll() {
    setLoading(true); setErr(null);
    try {
      const [bidsRes, oppsRes] = await Promise.allSettled([
        api.get<Bid[]>("/bids", { params: { limit: 100, offset: 0 } }),
        api.get<Opp[]>("/opportunities"),
      ]);
      if (bidsRes.status === "fulfilled") setBids(Array.isArray(bidsRes.value.data) ? bidsRes.value.data : []);
      if (oppsRes.status === "fulfilled") setOpps(Array.isArray(oppsRes.value.data) ? oppsRes.value.data : []);
      if (bidsRes.status === "rejected" && oppsRes.status === "rejected") {
        setErr("Failed to load data. Check backend connection.");
      }
    } catch (e: any) {
      setErr(typeof e?.message === "string" ? e.message : "Failed to load");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadAll(); }, []);

  // Quick convert opportunity to bid
  async function quickConvert(oppId: number) {
    setConverting(oppId);
    try {
      const r = await api.post(`/opportunities/${oppId}/convert`);
      if (r.data?.bid_id) {
        nav(`/bids/${r.data.bid_id}`);
      } else {
        loadAll();
      }
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Convert failed";
      alert(typeof msg === "object" ? JSON.stringify(msg) : msg);
    } finally { setConverting(null); }
  }

  // Stats
  const oppNew = opps.filter(o => o.status === "new").length;
  const oppAnalyzed = opps.filter(o => o.status === "analyzed").length;
  const oppConverted = opps.filter(o => o.status === "converted").length;
  const bidDraft = bids.filter(b => b.status === "draft").length;
  const bidApproved = bids.filter(b => b.status === "approved").length;
  const highRisk = bids.filter(b => b.risk_level >= 4).length;
  const unconverted = opps.filter(o => !o.converted_bid_id && o.status !== "converted");
  const aiRecommendBid = opps.filter(o => o.ai_bid_recommendation === "bid").length;

  // Unified items for "all" view
  type UnifiedItem = { type: "opp" | "bid"; id: number; code: string; title: string; agency: string; status: string; date?: string; risk?: number; aiRec?: string; confidence?: number; convertedBidId?: number | null; };

  const unified: UnifiedItem[] = useMemo(() => {
    const items: UnifiedItem[] = [];
    if (tab === "all" || tab === "opportunities" || tab === "pipeline") {
      opps.forEach(o => items.push({
        type: "opp", id: o.id, code: o.opp_code, title: o.title, agency: o.agency_name,
        status: o.status, date: o.due_date || o.created_at, aiRec: o.ai_bid_recommendation,
        confidence: o.ai_confidence_score, convertedBidId: o.converted_bid_id,
      }));
    }
    if (tab === "all" || tab === "bids") {
      bids.forEach(b => items.push({
        type: "bid", id: b.id, code: b.bid_code, title: b.contract_title, agency: b.agency_name,
        status: b.status, date: b.deadline_date || b.created_at, risk: b.risk_level,
      }));
    }
    // Sort: newest first
    items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return items;
  }, [opps, bids, tab]);

  const filtered = useMemo(() => {
    if (!q.trim()) return unified;
    const lq = q.toLowerCase();
    return unified.filter(i => i.code?.toLowerCase().includes(lq) || i.title?.toLowerCase().includes(lq) || i.agency?.toLowerCase().includes(lq));
  }, [unified, q]);

  // Pipeline stages
  const pipelineStages = [
    { key: "new", label: "📥 New", color: "rgba(100,180,255,.9)", items: opps.filter(o => o.status === "new") },
    { key: "analyzed", label: "🧠 Analyzed", color: "rgba(180,130,255,.9)", items: opps.filter(o => o.status === "analyzed") },
    { key: "converted", label: "💰 Converted", color: "rgba(215,182,109,.9)", items: opps.filter(o => o.status === "converted") },
    { key: "draft", label: "📝 Draft Bids", color: "rgba(255,255,255,.7)", items: bids.filter(b => b.status === "draft") },
    { key: "approved", label: "✅ Approved", color: "rgba(110,220,160,.9)", items: bids.filter(b => b.status === "approved") },
  ];

  return (
    <div style={page}>
      {/* ── Top Nav ── */}
      <div style={topBar}>
        <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: "-0.03em" }}>
          Sentri<span style={{ color: "rgba(215,182,109,.9)" }}>BiD</span>
          <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.5, marginLeft: 10 }}>Command Center</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => nav("/discover")} style={btnGold}>🔍 Discover</button>
          <button onClick={() => nav("/sam-search")} style={btnSmall}>🌐 SAM.gov</button>
          <button onClick={() => nav("/pipeline")} style={btnSmall}>📊 Pipeline</button>
          <button onClick={() => nav("/profile")} style={btnSmall}>👤 Profile</button>
          <button onClick={() => nav("/bids/new")} style={btnGold}>+ New Bid</button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div style={statsBar}>
        <div style={statPill}><span style={{ opacity: 0.5, fontSize: 11 }}>Opportunities</span><span style={{ fontWeight: 800, fontSize: 20 }}>{opps.length}</span></div>
        <div style={statPill}><span style={{ opacity: 0.5, fontSize: 11 }}>New</span><span style={{ fontWeight: 800, fontSize: 20, color: "rgba(100,180,255,.9)" }}>{oppNew}</span></div>
        <div style={statPill}><span style={{ opacity: 0.5, fontSize: 11 }}>Analyzed</span><span style={{ fontWeight: 800, fontSize: 20, color: "rgba(180,130,255,.9)" }}>{oppAnalyzed}</span></div>
        <div style={statPill}><span style={{ opacity: 0.5, fontSize: 11 }}>AI: Bid ✓</span><span style={{ fontWeight: 800, fontSize: 20, color: "rgba(110,220,160,.9)" }}>{aiRecommendBid}</span></div>
        <div style={{ width: 1, height: 36, background: "rgba(255,255,255,.1)", margin: "0 4px" }} />
        <div style={statPill}><span style={{ opacity: 0.5, fontSize: 11 }}>Total Bids</span><span style={{ fontWeight: 800, fontSize: 20 }}>{bids.length}</span></div>
        <div style={statPill}><span style={{ opacity: 0.5, fontSize: 11 }}>Draft</span><span style={{ fontWeight: 800, fontSize: 20 }}>{bidDraft}</span></div>
        <div style={statPill}><span style={{ opacity: 0.5, fontSize: 11 }}>Approved</span><span style={{ fontWeight: 800, fontSize: 20, color: "rgba(110,220,160,.9)" }}>{bidApproved}</span></div>
        <div style={statPill}><span style={{ opacity: 0.5, fontSize: 11 }}>High Risk</span><span style={{ fontWeight: 800, fontSize: 20, color: "rgba(255,120,120,.9)" }}>{highRisk}</span></div>
      </div>

      {/* ── AI Insights Banner ── */}
      {unconverted.length > 0 && (
        <div style={insightBanner}>
          <span style={{ fontSize: 16 }}>💡</span>
          <span>
            <b>{unconverted.length}</b> opportunit{unconverted.length === 1 ? "y" : "ies"} ready to convert to bids
            {aiRecommendBid > 0 && <> · <b style={{ color: "rgba(110,220,160,.9)" }}>{aiRecommendBid}</b> AI-recommended</>}
          </span>
          <button onClick={() => setTab("opportunities")} style={{ ...btnGold, padding: "5px 12px", fontSize: 12 }}>View →</button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {([["all", "🏠 All"], ["pipeline", "📊 Pipeline"], ["opportunities", "🔍 Opportunities"], ["bids", "📋 Bids"]] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ ...tabBtn, background: tab === key ? "rgba(215,182,109,.15)" : "rgba(255,255,255,.04)",
              border: `1px solid ${tab === key ? "rgba(215,182,109,.35)" : "rgba(255,255,255,.08)"}`,
              color: tab === key ? "rgba(215,182,109,.95)" : "rgba(255,255,255,.6)" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div style={{ marginBottom: 16 }}>
        <input placeholder="Search codes, titles, agencies..." value={q}
          onChange={e => setQ(e.target.value)} style={searchInput} />
      </div>

      {err && <div style={errBox}>{err}</div>}
      {loading && <div style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>Loading...</div>}

      {/* ── Pipeline View ── */}
      {tab === "pipeline" && !loading && (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12 }}>
          {pipelineStages.map(stage => (
            <div key={stage.key} style={pipelineCol}>
              <div style={{ fontWeight: 800, fontSize: 14, color: stage.color, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                <span>{stage.label}</span>
                <span style={{ opacity: 0.5, fontSize: 12 }}>{stage.items.length}</span>
              </div>
              {stage.items.length === 0 && <div style={{ opacity: 0.3, fontSize: 12, textAlign: "center", padding: 16 }}>Empty</div>}
              {stage.items.map((item: any) => (
                <div key={item.id || item.bid_code || item.opp_code}
                  onClick={() => nav(item.bid_code ? `/bids/${item.id}` : `/opportunities/${item.id}`)}
                  style={pipelineCard}>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(215,182,109,.8)", marginBottom: 4 }}>
                    {item.bid_code || item.opp_code}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, marginBottom: 4 }}>
                    {(item.contract_title || item.title || "").slice(0, 60)}{(item.contract_title || item.title || "").length > 60 ? "…" : ""}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.5 }}>{item.agency_name}</div>
                  {item.ai_bid_recommendation && (
                    <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700,
                      color: item.ai_bid_recommendation === "bid" ? "rgba(110,220,160,.9)" : item.ai_bid_recommendation === "no_bid" ? "rgba(255,120,120,.9)" : "rgba(215,182,109,.9)" }}>
                      AI: {item.ai_bid_recommendation.toUpperCase()} {item.ai_confidence_score ? `(${Math.round(item.ai_confidence_score * 100)}%)` : ""}
                    </div>
                  )}
                  {/* Quick convert button for analyzed opportunities */}
                  {!item.bid_code && item.status === "analyzed" && !item.converted_bid_id && (
                    <button onClick={(e) => { e.stopPropagation(); quickConvert(item.id); }}
                      disabled={converting === item.id}
                      style={{ ...btnGold, marginTop: 8, padding: "4px 10px", fontSize: 11, width: "100%" }}>
                      {converting === item.id ? "Converting..." : "💰 Quick Convert to Bid"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Table View (All / Opportunities / Bids) ── */}
      {tab !== "pipeline" && !loading && filtered.length === 0 && !err && (
        <div style={emptyCard}>
          <div style={{ fontSize: 36 }}>{tab === "bids" ? "📋" : tab === "opportunities" ? "🔍" : "🚀"}</div>
          <div style={{ fontWeight: 700, marginTop: 8 }}>No {tab === "all" ? "items" : tab} yet</div>
          <div style={{ opacity: 0.5, fontSize: 13 }}>Upload an RFP or search SAM.gov to get started</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
            <button onClick={() => nav("/discover")} style={btnGold}>🔍 Discover Opportunities</button>
            <button onClick={() => nav("/bids/new")} style={btnSmall}>+ Manual Bid</button>
          </div>
        </div>
      )}

      {tab !== "pipeline" && !loading && filtered.length > 0 && (
        <div style={tableCard}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Type", "Code", "Title", "Agency", "Status", "Due/Deadline", tab !== "bids" ? "AI Rec" : "Risk", "Actions"].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={`${item.type}-${item.id}`}
                  onClick={() => nav(item.type === "bid" ? `/bids/${item.id}` : `/opportunities/${item.id}`)}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={td}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                      background: item.type === "bid" ? "rgba(215,182,109,.15)" : "rgba(100,180,255,.15)",
                      color: item.type === "bid" ? "rgba(215,182,109,.9)" : "rgba(100,180,255,.9)",
                      border: `1px solid ${item.type === "bid" ? "rgba(215,182,109,.25)" : "rgba(100,180,255,.25)"}`,
                    }}>{item.type === "bid" ? "BID" : "OPP"}</span>
                  </td>
                  <td style={td}><span style={{ fontFamily: "monospace", fontWeight: 700, color: "rgba(215,182,109,.85)", fontSize: 13 }}>{item.code}</span></td>
                  <td style={{ ...td, maxWidth: 280 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                  </td>
                  <td style={td}><span style={{ opacity: 0.6, fontSize: 13 }}>{item.agency}</span></td>
                  <td style={td}>
                    <span style={{
                      padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      ...statusStyle(item.status),
                    }}>{item.status}</span>
                  </td>
                  <td style={td}><span style={{ fontSize: 13, opacity: 0.7 }}>{item.date ? new Date(item.date).toLocaleDateString() : "—"}</span></td>
                  <td style={td}>
                    {item.type === "opp" && item.aiRec && (
                      <span style={{
                        padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: item.aiRec === "bid" ? "rgba(80,220,140,.12)" : item.aiRec === "no_bid" ? "rgba(255,80,80,.12)" : "rgba(215,182,109,.12)",
                        color: item.aiRec === "bid" ? "rgba(110,220,160,.95)" : item.aiRec === "no_bid" ? "rgba(255,120,120,.95)" : "rgba(215,182,109,.9)",
                        border: `1px solid ${item.aiRec === "bid" ? "rgba(80,220,140,.25)" : item.aiRec === "no_bid" ? "rgba(255,80,80,.25)" : "rgba(215,182,109,.25)"}`,
                      }}>{item.aiRec}{item.confidence ? ` ${Math.round(item.confidence * 100)}%` : ""}</span>
                    )}
                    {item.type === "bid" && item.risk !== undefined && (
                      <span style={{
                        padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: item.risk >= 4 ? "rgba(255,80,80,.15)" : "rgba(215,182,109,.12)",
                        color: item.risk >= 4 ? "rgba(255,120,120,.95)" : "rgba(215,182,109,.9)",
                        border: `1px solid ${item.risk >= 4 ? "rgba(255,80,80,.25)" : "rgba(215,182,109,.25)"}`,
                      }}>{item.risk >= 4 ? "High" : item.risk <= 2 ? "Low" : "Med"}</span>
                    )}
                  </td>
                  <td style={td} onClick={e => e.stopPropagation()}>
                    {item.type === "opp" && !item.convertedBidId && item.status !== "converted" && (
                      <button onClick={() => quickConvert(item.id)} disabled={converting === item.id}
                        style={{ ...btnGold, padding: "3px 10px", fontSize: 11 }}>
                        {converting === item.id ? "..." : "💰 Convert"}
                      </button>
                    )}
                    {item.type === "opp" && item.convertedBidId && (
                      <button onClick={() => nav(`/bids/${item.convertedBidId}`)}
                        style={{ ...btnSmall, padding: "3px 10px", fontSize: 11, color: "rgba(110,220,160,.9)" }}>
                        📋 View Bid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function statusStyle(s: string): React.CSSProperties {
  switch (s) {
    case "new": return { background: "rgba(100,180,255,.12)", color: "rgba(100,180,255,.9)", border: "1px solid rgba(100,180,255,.25)" };
    case "analyzed": return { background: "rgba(180,130,255,.12)", color: "rgba(180,130,255,.9)", border: "1px solid rgba(180,130,255,.25)" };
    case "converted": return { background: "rgba(215,182,109,.12)", color: "rgba(215,182,109,.9)", border: "1px solid rgba(215,182,109,.25)" };
    case "draft": return { background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.12)" };
    case "approved": return { background: "rgba(80,220,140,.12)", color: "rgba(110,220,160,.95)", border: "1px solid rgba(80,220,140,.25)" };
    default: return { background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.5)", border: "1px solid rgba(255,255,255,.08)" };
  }
}

/* ─── Styles ──────────────────────────────────────────────── */

const page: React.CSSProperties = {
  minHeight: "100vh", padding: "20px 24px",
  color: "rgba(255,255,255,.88)", fontFamily: "Inter, system-ui, sans-serif",
  background:
    "radial-gradient(1200px 800px at 15% 10%, rgba(120,88,255,.18), transparent 60%)," +
    "radial-gradient(900px 650px at 80% 20%, rgba(0,212,255,.10), transparent 55%)," +
    "radial-gradient(900px 800px at 60% 90%, rgba(215,182,109,.12), transparent 55%)," +
    "linear-gradient(180deg, #060712, #0B1020)",
};
const topBar: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "12px 18px", marginBottom: 16, borderRadius: 16,
  background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
  backdropFilter: "blur(12px)", flexWrap: "wrap", gap: 10,
};
const btnSmall: React.CSSProperties = {
  padding: "7px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12,
  background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)",
  color: "rgba(255,255,255,.75)",
};
const btnGold: React.CSSProperties = {
  padding: "7px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12,
  background: "radial-gradient(420px 160px at 30% 20%, rgba(215,182,109,.22), transparent 60%), linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06))",
  border: "1px solid rgba(215,182,109,.35)", color: "rgba(255,255,255,.92)",
};
const statsBar: React.CSSProperties = {
  display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center",
};
const statPill: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 14px",
  borderRadius: 12, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)",
  minWidth: 60,
};
const insightBanner: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", marginBottom: 16,
  borderRadius: 14, background: "rgba(215,182,109,.06)", border: "1px solid rgba(215,182,109,.18)",
  fontSize: 14,
};
const tabBtn: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13,
  transition: "all .15s",
};
const searchInput: React.CSSProperties = {
  width: "100%", padding: "10px 16px", borderRadius: 12,
  border: "1px solid rgba(255,255,255,.10)", background: "rgba(0,0,0,.18)",
  color: "rgba(255,255,255,.9)", outline: "none", fontSize: 14,
};
const errBox: React.CSSProperties = {
  padding: "12px 18px", marginBottom: 16, borderRadius: 12,
  background: "rgba(255,60,60,.12)", border: "1px solid rgba(255,60,60,.25)",
  color: "rgba(255,140,140,.95)", fontSize: 14,
};
const emptyCard: React.CSSProperties = {
  textAlign: "center", padding: "48px 24px", borderRadius: 16,
  background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
};
const tableCard: React.CSSProperties = {
  borderRadius: 16, overflow: "hidden",
  background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
  backdropFilter: "blur(12px)",
};
const th: React.CSSProperties = {
  textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700,
  opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.05em",
  borderBottom: "1px solid rgba(255,255,255,.08)",
};
const td: React.CSSProperties = {
  padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,.05)", fontSize: 13,
};
const pipelineCol: React.CSSProperties = {
  flex: "1 1 200px", minWidth: 200, padding: 12, borderRadius: 14,
  background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)",
};
const pipelineCard: React.CSSProperties = {
  padding: 12, marginBottom: 8, borderRadius: 12, cursor: "pointer",
  background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)",
  transition: "all .15s",
};
