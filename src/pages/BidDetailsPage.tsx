// src/pages/BidDetailsPage.tsx
// AI Bid Strategist Workspace — Claude-powered pricing, chat, win analysis
import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";

type AnyObj = Record<string, any>;
type Mode = "conservative" | "balanced" | "aggressive";
type ChatMsg = { role: "user" | "assistant"; content: string };

function money(x: any) { const n = Number(x); return Number.isFinite(n) ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n) : "—"; }
function pct(x: any) { const n = Number(x); return Number.isFinite(n) ? `${(n < 1 ? n * 100 : n).toFixed(1)}%` : "—"; }

export default function BidDetailsPage() {
  const { bidId } = useParams();
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [bid, setBid] = useState<AnyObj | null>(null);
  const [calc, setCalc] = useState<AnyObj | null>(null);

  // AI Strategy
  const [strategy, setStrategy] = useState<AnyObj | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);

  // Copilot Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Approval
  const [selectedMode, setSelectedMode] = useState<Mode>("balanced");
  const [approvedVersionId, setApprovedVersionId] = useState<number | null>(null);
  const [approvedBy, setApprovedBy] = useState("internal");
  const [assumptionsNotes, setAssumptionsNotes] = useState("");
  const [approving, setApproving] = useState(false);
  const [computing, setComputing] = useState(false);

  // Proposal
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [proposalStatus, setProposalStatus] = useState<string | null>(null);

  const isApproved = useMemo(() => String(bid?.status || "").toLowerCase() === "approved", [bid]);

  useEffect(() => {
    let m = true;
    async function load() {
      try {
        setLoading(true); setErr(null);
        const r = await api.get(`/bids/${bidId}`);
        if (!m) return;
        setBid(r.data);
        if (r.data?.status === "approved" && r.data?.approved_version_id) setApprovedVersionId(Number(r.data.approved_version_id));
        try { const c = await api.get(`/bids/${bidId}/details`); if (m) setCalc(c.data); } catch {}
      } catch (e: any) { if (m) setErr(e?.response?.data?.detail || e?.message || "Failed to load bid."); }
      finally { if (m) setLoading(false); }
    }
    load();
    return () => { m = false; };
  }, [bidId]);

  async function computeNow() {
    try { setComputing(true); setErr(null); const r = await api.get(`/bids/${bidId}/details`); setCalc(r.data); }
    catch (e: any) { setErr(e?.response?.data?.detail || "Compute failed."); }
    finally { setComputing(false); }
  }

  // ─── AI Strategy ───────────────────────────────────────────
  async function loadStrategy() {
    try {
      setLoadingStrategy(true); setErr(null);
      const r = await api.post(`/copilot/strategy/${bidId}`);
      setStrategy(r.data);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Strategy analysis failed. Check Claude API key.");
    } finally { setLoadingStrategy(false); }
  }

  // ─── Copilot Chat ──────────────────────────────────────────
  async function sendChat() {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    const newMsgs: ChatMsg[] = [...chatMessages, { role: "user", content: msg }];
    setChatMessages(newMsgs);
    setChatLoading(true);
    try {
      const r = await api.post(`/copilot/chat/${bidId}`, { message: msg, history: newMsgs.slice(-8) });
      setChatMessages([...newMsgs, { role: "assistant", content: r.data.response }]);
    } catch (e: any) {
      setChatMessages([...newMsgs, { role: "assistant", content: `Error: ${e?.response?.data?.detail || "Chat failed"}` }]);
    } finally { setChatLoading(false); }
  }

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // ─── Approve & Export ──────────────────────────────────────
  async function approveAndExport() {
    try {
      setApproving(true); setErr(null);
      const r = await api.post(`/bids/${bidId}/approve`, { selected_mode: selectedMode, approved_by: approvedBy.trim() || "internal", assumptions_notes: assumptionsNotes });
      const vId = Number(r.data?.version_id);
      if (Number.isFinite(vId)) { setApprovedVersionId(vId); navigate(`/export/${vId}`); }
      try { const b = await api.get(`/bids/${bidId}`); setBid(b.data); } catch {}
    } catch (e: any) { setErr(e?.response?.data?.detail || "Approve failed."); }
    finally { setApproving(false); }
  }

  // ─── AI Proposal ───────────────────────────────────────────
  async function generateAIProposal(format: "pdf" | "docx") {
    try {
      setGeneratingProposal(true); setProposalStatus(`Generating ${format.toUpperCase()}...`); setErr(null);
      let oppId: number | null = null;
      try {
        const opps = (await api.get("/opportunities")).data || [];
        const match = opps.find((o: any) => o.converted_bid_id === Number(bidId));
        if (match) oppId = match.id;
      } catch {}
      if (oppId) {
        const r = await api.post(`/opportunities/${oppId}/generate-proposal`, { format }, { responseType: "blob" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([r.data]));
        a.download = `Proposal-${bid?.bid_code}.${format}`; document.body.appendChild(a); a.click(); a.remove();
        setProposalStatus(`✅ ${format.toUpperCase()} downloaded!`);
      } else if (approvedVersionId) {
        const r = await api.get(`/bids/versions/${approvedVersionId}/export/${format}`, { responseType: "blob" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([r.data]));
        a.download = `${bid?.bid_code}-proposal.${format}`; document.body.appendChild(a); a.click(); a.remove();
        setProposalStatus(`✅ Exported!`);
      } else { throw new Error("Approve bid first or ensure it was converted from an opportunity."); }
    } catch (e: any) { setErr(e?.response?.data?.detail || e?.message || "Failed"); setProposalStatus(null); }
    finally { setGeneratingProposal(false); }
  }

  const recs: AnyObj[] = (calc?.recommendations || []).filter((r: any) => r?.mode);
  const selectedRec = recs.find(r => r.mode === selectedMode);

  if (loading) return <Shell><div style={card}>Loading bid details...</div></Shell>;
  if (!bid) return <Shell><div style={errBox}>{err || "Bid not found"}</div></Shell>;

  const winProb = strategy?.win_probability || (strategy?.confidence === "high" ? 75 : strategy?.confidence === "medium" ? 55 : strategy?.confidence === "low" ? 35 : null);

  return (
    <div style={page}>
      <div style={shell}>
        {/* Top Bar */}
        <div style={topBar}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 20 }}>Sentri<span style={{ color: G }}>BiD</span></div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{bid.bid_code} — {bid.contract_title?.slice(0, 50)}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => navigate("/bids")} style={btn}>← Back</button>
            <button onClick={() => navigate("/discover")} style={btn}>🔍 Discover</button>
            <button onClick={computeNow} disabled={computing} style={btn}>{computing ? "⏳" : "🔄"} Recompute</button>
            <button onClick={() => setChatOpen(!chatOpen)} style={{ ...btnGold, background: chatOpen ? "rgba(120,88,255,.25)" : btnGold.background }}>
              💬 {chatOpen ? "Close Chat" : "AI Copilot"}
            </button>
            {!isApproved && <button onClick={approveAndExport} disabled={approving} style={btnGold}>{approving ? "⏳" : "✅"} Approve</button>}
            {approvedVersionId && <button onClick={() => navigate(`/export/${approvedVersionId}`)} style={btnGold}>📄 Export</button>}
          </div>
        </div>

        {err && <div style={errBox}>{err}</div>}

        {/* ─── AI Strategy Banner ─── */}
        <div style={stratBanner}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>🧠 AI Bid Strategist</div>
            <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>Claude analyzes the RFP, your company profile, historical bids, and market data to recommend the optimal bid price</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {strategy && winProb !== null && (
              <div style={{ textAlign: "center", padding: "4px 14px", borderRadius: 12, background: winProb >= 60 ? "rgba(80,220,140,.15)" : winProb >= 40 ? "rgba(215,182,109,.15)" : "rgba(255,80,80,.15)", border: `1px solid ${winProb >= 60 ? "rgba(80,220,140,.3)" : winProb >= 40 ? "rgba(215,182,109,.3)" : "rgba(255,80,80,.3)"}` }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: winProb >= 60 ? "rgba(110,220,160,.95)" : winProb >= 40 ? G : "rgba(255,120,120,.95)" }}>{winProb}%</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>Win Prob</div>
              </div>
            )}
            <button onClick={loadStrategy} disabled={loadingStrategy} style={{ ...btnGold, padding: "10px 20px" }}>
              {loadingStrategy ? "⏳ Analyzing..." : strategy ? "🔄 Re-Analyze" : "🧠 Analyze with Claude"}
            </button>
          </div>
        </div>

        {/* ─── AI Strategy Results ─── */}
        {strategy && !strategy.error && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            {/* Recommended Price */}
            <div style={{ ...card, borderColor: "rgba(215,182,109,.25)" }}>
              <div style={{ fontSize: 12, opacity: 0.5 }}>AI Recommended Price</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: G, marginTop: 4 }}>{money(strategy.recommended_price)}</div>
              {strategy.price_range && <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>Range: {money(strategy.price_range.low)} – {money(strategy.price_range.high)}</div>}
              {strategy.price_breakdown && (
                <div style={{ marginTop: 10, fontSize: 12 }}>
                  <Row l="Labor" r={money(strategy.price_breakdown.labor)} />
                  <Row l="Materials" r={money(strategy.price_breakdown.materials)} />
                  <Row l="Overhead" r={money(strategy.price_breakdown.overhead)} />
                  <Row l="Margin" r={`${strategy.price_breakdown.profit_margin_pct || 0}%`} />
                </div>
              )}
            </div>
            {/* Strategy */}
            <div style={card}>
              <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Strategy</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>{strategy.strategy}</div>
              <div style={{ fontSize: 12, opacity: 0.5, marginTop: 8, marginBottom: 4 }}>Pricing Rationale</div>
              <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>{strategy.pricing_rationale}</div>
            </div>
            {/* Competitive & Risks */}
            <div style={card}>
              <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 6 }}>Competitive Analysis</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>{strategy.competitive_position}</div>
              {strategy.strengths_to_highlight?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>Strengths to Highlight</div>
                  {strategy.strengths_to_highlight.map((s: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, padding: "2px 0", color: "rgba(110,220,160,.9)" }}>✓ {s}</div>
                  ))}
                </div>
              )}
              {strategy.risk_factors?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>Risk Factors</div>
                  {strategy.risk_factors.map((r: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, padding: "2px 0", color: "rgba(255,150,100,.9)" }}>⚠ {r}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {strategy?.error && <div style={errBox}>{strategy.error}{strategy.raw_response && <pre style={{ fontSize: 11, marginTop: 8, opacity: 0.6, whiteSpace: "pre-wrap" }}>{strategy.raw_response.slice(0, 500)}</pre>}</div>}

        {/* ─── Proposal Generation ─── */}
        <div style={{ ...proposalBar, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>📄 AI Proposal</span>
            {proposalStatus && <span style={{ marginLeft: 10, fontSize: 13, color: G }}>{proposalStatus}</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => generateAIProposal("pdf")} disabled={generatingProposal} style={btn}>📄 PDF</button>
            <button onClick={() => generateAIProposal("docx")} disabled={generatingProposal} style={btn}>📝 DOCX</button>
          </div>
        </div>

        {/* ─── Main Grid ─── */}
        <div style={grid}>
          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={card}>
              <div style={cardTitle}>Summary</div>
              <Row l="Bid Code" r={<span style={{ fontFamily: "monospace", color: G, fontWeight: 700 }}>{bid.bid_code}</span>} />
              <Row l="Status" r={<Pill text={bid.status} style={sCol(bid.status)} />} />
              <Row l="Agency" r={bid.agency_name} />
              <Row l="Contract" r={bid.contract_title} />
              <Row l="Type" r={bid.contract_type} />
              <Row l="Deadline" r={bid.deadline_date || "—"} />
              <Row l="Risk" r={<Pill text={`${bid.risk_level}/5`} style={{ background: (bid.risk_level||0)>=4?"rgba(255,80,80,.15)":"rgba(215,182,109,.12)", color: (bid.risk_level||0)>=4?"rgba(255,120,120,.95)":G }} />} />
              {bid.notes && <div style={{ marginTop: 8, fontSize: 12, opacity: 0.5, whiteSpace: "pre-wrap", maxHeight: 80, overflow: "auto" }}>{bid.notes}</div>}
            </div>
            <div style={card}>
              <div style={cardTitle}>Approval & Pricing</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {(["conservative","balanced","aggressive"] as Mode[]).map(m => (
                  <button key={m} onClick={() => setSelectedMode(m)} style={{ ...chip, borderColor: m===selectedMode?"rgba(215,182,109,.5)":"rgba(255,255,255,.1)", background: m===selectedMode?"linear-gradient(135deg,rgba(122,63,255,.25),rgba(255,185,56,.12))":"rgba(255,255,255,.04)" }}>{m.toUpperCase()}</button>
                ))}
              </div>
              <div style={{ fontSize: 11, opacity: 0.4, marginBottom: 3 }}>Approved By</div>
              <input value={approvedBy} onChange={e=>setApprovedBy(e.target.value)} style={input} />
              <div style={{ fontSize: 11, opacity: 0.4, marginTop: 8, marginBottom: 3 }}>Notes</div>
              <textarea value={assumptionsNotes} onChange={e=>setAssumptionsNotes(e.target.value)} style={textarea} placeholder="Export notes..." />
              {selectedRec && <div style={miniCard}>
                <div style={{ fontWeight: 800, color: G, marginBottom: 6 }}>{selectedMode.toUpperCase()}</div>
                <Row l="Bid Price" r={money(selectedRec.bid_price)} /><Row l="Profit" r={money(selectedRec.profit_amount)} />
                <Row l="Margin" r={pct(selectedRec.margin_pct)} /><Row l="Win Score" r={selectedRec.win_score ?? "—"} />
              </div>}
            </div>
          </div>

          {/* Right */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={card}>
              <div style={cardTitle}>Cost Breakdown</div>
              {!calc ? <div style={{ opacity: 0.5 }}>Click Recompute to see totals.</div> : (<>
                <Row l="Items" r={money(calc?.totals?.item_subtotal)} /><Row l="Labor" r={money(calc?.totals?.labor_total)} />
                <Row l="Transport" r={money(calc?.totals?.transport_total)} /><Row l="Equipment" r={money(calc?.totals?.equipment_total)} />
                <Row l="Overhead" r={money(calc?.totals?.overhead_total)} />
                <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "6px 0" }} />
                <Row l="True Cost" r={<b style={{ color: G }}>{money(calc?.totals?.true_cost)}</b>} />
                <Row l="Risk Buffer" r={money(calc?.totals?.risk_buffer)} />
                <Row l="Adjusted Cost" r={<b style={{ color: G }}>{money(calc?.totals?.adjusted_cost)}</b>} />
              </>)}
            </div>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={cardTitle}>Recommendations</div>
                <button onClick={computeNow} disabled={computing} style={{ ...btn, padding: "3px 8px", fontSize: 11 }}>Refresh</button>
              </div>
              {recs.map(r => (<div key={r.mode} style={{ ...recCard, borderColor: r.mode===selectedMode?"rgba(215,182,109,.35)":"rgba(255,255,255,.06)", background: r.mode===selectedMode?"linear-gradient(135deg,rgba(122,63,255,.12),rgba(255,185,56,.06))":"rgba(255,255,255,.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 800, letterSpacing: ".5px", fontSize: 13 }}>{String(r.mode).toUpperCase()}</span>
                  <button onClick={() => setSelectedMode(r.mode)} style={{ ...btn, padding: "3px 8px", fontSize: 11 }}>Select</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
                  <MKV l="Price" v={money(r.bid_price)} /><MKV l="Profit" v={money(r.profit_amount)} />
                  <MKV l="Margin" v={pct(r.margin_pct)} /><MKV l="Win" v={r.win_score ?? "—"} />
                </div>
              </div>))}
            </div>
          </div>
        </div>

        {/* ─── Copilot Chat Panel ─── */}
        {chatOpen && (
          <div style={chatPanel}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
              <span>💬 Claude Bid Copilot</span>
              <button onClick={() => setChatOpen(false)} style={{ ...btn, padding: "2px 8px", fontSize: 11 }}>✕</button>
            </div>
            <div style={chatArea}>
              {chatMessages.length === 0 && (
                <div style={{ opacity: 0.4, textAlign: "center", padding: 20, fontSize: 13 }}>
                  Ask Claude anything about this bid. Examples:<br />
                  "What price should I bid?"<br />
                  "What are the biggest risks?"<br />
                  "How should I position our past performance?"<br />
                  "What if I lower price by 15%?"
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} style={{ marginBottom: 10, display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ ...chatBubble, background: m.role === "user" ? "rgba(120,88,255,.2)" : "rgba(255,255,255,.06)", borderColor: m.role === "user" ? "rgba(120,88,255,.3)" : "rgba(255,255,255,.08)" }}>
                    <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 3 }}>{m.role === "user" ? "You" : "🤖 Claude"}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{m.content}</div>
                  </div>
                </div>
              ))}
              {chatLoading && <div style={{ opacity: 0.5, fontSize: 13, padding: 8 }}>🤖 Claude is thinking...</div>}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                placeholder="Ask Claude about this bid..."
                style={{ ...input, flex: 1 }} />
              <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={btnGold}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ l, r }: { l: string; r: any }) {
  return <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,.04)", fontSize: 13 }}><span style={{ opacity: 0.5 }}>{l}</span><span style={{ fontWeight: 600 }}>{r}</span></div>;
}
function MKV({ l, v }: { l: string; v: string }) { return <div><div style={{ fontSize: 10, opacity: 0.35 }}>{l}</div><div style={{ fontWeight: 700, fontSize: 13 }}>{v}</div></div>; }
function Pill({ text, style: s }: { text: string; style: React.CSSProperties }) { return <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, ...s }}>{text}</span>; }
function Shell({ children }: { children: React.ReactNode }) {
  return <div style={page}><div style={shell}><div style={topBar}><div style={{ fontWeight: 900, fontSize: 20 }}>Sentri<span style={{ color: G }}>BiD</span></div><Link to="/bids" style={btn}>← Back</Link></div>{children}</div></div>;
}
function sCol(s: string): React.CSSProperties {
  if (s==="approved") return { background: "rgba(80,220,140,.12)", color: "rgba(110,220,160,.95)" };
  if (s==="draft") return { background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.6)" };
  return { background: "rgba(215,182,109,.12)", color: G };
}

const G = "rgba(215,182,109,.9)";
const page: React.CSSProperties = { minHeight: "100vh", color: "rgba(255,255,255,.88)", fontFamily: "Inter,system-ui,sans-serif", background: "radial-gradient(1200px 800px at 15% 10%,rgba(120,88,255,.18),transparent 60%),radial-gradient(900px 650px at 80% 20%,rgba(0,212,255,.10),transparent 55%),radial-gradient(900px 800px at 60% 90%,rgba(215,182,109,.12),transparent 55%),linear-gradient(180deg,#060712,#0B1020)" };
const shell: React.CSSProperties = { width: "min(1300px,calc(100% - 32px))", margin: "0 auto", padding: "20px 0 60px" };
const topBar: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", marginBottom: 14, borderRadius: 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", backdropFilter: "blur(12px)", flexWrap: "wrap", gap: 8 };
const btn: React.CSSProperties = { padding: "6px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.8)", textDecoration: "none", display: "inline-flex", alignItems: "center" };
const btnGold: React.CSSProperties = { padding: "6px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 12, background: "radial-gradient(420px 160px at 30% 20%,rgba(215,182,109,.22),transparent 60%),linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.06))", border: "1px solid rgba(215,182,109,.35)", color: "rgba(255,255,255,.92)" };
const stratBanner: React.CSSProperties = { display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", marginBottom: 14, borderRadius: 14, background: "linear-gradient(135deg,rgba(120,88,255,.08),rgba(215,182,109,.05))", border: "1px solid rgba(120,88,255,.15)", flexWrap: "wrap" };
const proposalBar: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 12, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.07)", borderRadius: 14, background: "rgba(255,255,255,.04)", boxShadow: "0 10px 30px rgba(0,0,0,.25)", backdropFilter: "blur(12px)", padding: 16 };
const cardTitle: React.CSSProperties = { fontWeight: 900, marginBottom: 10, fontSize: 14 };
const recCard: React.CSSProperties = { padding: 12, marginBottom: 8, borderRadius: 12, border: "1px solid rgba(255,255,255,.06)" };
const chip: React.CSSProperties = { padding: "5px 12px", borderRadius: 9, fontSize: 11, fontWeight: 800, cursor: "pointer", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.9)", letterSpacing: ".4px" };
const input: React.CSSProperties = { width: "100%", padding: "7px 11px", borderRadius: 9, border: "1px solid rgba(255,255,255,.10)", background: "rgba(0,0,0,.18)", color: "rgba(255,255,255,.9)", outline: "none", fontSize: 13 };
const textarea: React.CSSProperties = { width: "100%", padding: "7px 11px", borderRadius: 9, border: "1px solid rgba(255,255,255,.10)", background: "rgba(0,0,0,.18)", color: "rgba(255,255,255,.9)", outline: "none", fontSize: 13, minHeight: 50, resize: "vertical" as any, fontFamily: "inherit" };
const miniCard: React.CSSProperties = { marginTop: 12, padding: 12, borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" };
const errBox: React.CSSProperties = { padding: "10px 16px", marginBottom: 12, borderRadius: 12, background: "rgba(255,60,60,.1)", border: "1px solid rgba(255,60,60,.18)", color: "rgba(255,140,140,.95)", fontSize: 13 };
const chatPanel: React.CSSProperties = { marginTop: 16, padding: 18, borderRadius: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(120,88,255,.2)", backdropFilter: "blur(14px)" };
const chatArea: React.CSSProperties = { maxHeight: 400, overflowY: "auto", padding: 8, borderRadius: 12, background: "rgba(0,0,0,.15)", border: "1px solid rgba(255,255,255,.06)" };
const chatBubble: React.CSSProperties = { maxWidth: "85%", padding: "8px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,.08)" };
