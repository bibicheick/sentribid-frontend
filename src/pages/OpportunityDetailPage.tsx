// src/pages/OpportunityDetailPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";

type OppData = Record<string, any>;

export default function OpportunityDetailPage() {
  const { oppId } = useParams();
  const navigate = useNavigate();
  const [opp, setOpp] = useState<OppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [shredding, setShredding] = useState(false);
  const [generatingMatrix, setGeneratingMatrix] = useState(false);
  const [generatingProposal, setGeneratingProposal] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [shredResult, setShredResult] = useState<any>(null);
  const [matrixResult, setMatrixResult] = useState<any>(null);

  async function loadOpp() {
    try { setLoading(true); const r = await api.get(`/opportunities/${oppId}`); setOpp(r.data); }
    catch (e: any) { setErr(e?.response?.data?.detail || "Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadOpp(); }, [oppId]);

  async function analyze() {
    setAnalyzing(true); setErr(null);
    try { await api.post(`/opportunities/${oppId}/analyze`); loadOpp(); }
    catch (e: any) { setErr(e?.response?.data?.detail || "Analysis failed"); }
    finally { setAnalyzing(false); }
  }

  async function convert() {
    setConverting(true); setErr(null);
    try { const r = await api.post(`/opportunities/${oppId}/convert`); navigate(`/bids/${r.data.bid_id}`); }
    catch (e: any) { setErr(e?.response?.data?.detail || "Conversion failed"); }
    finally { setConverting(false); }
  }

  async function shredRfp() {
    setShredding(true); setErr(null);
    try { const r = await api.post(`/discovery/shred/${oppId}`); setShredResult(r.data); }
    catch (e: any) { setErr(e?.response?.data?.detail || "Shred failed"); }
    finally { setShredding(false); }
  }

  async function generateMatrix() {
    setGeneratingMatrix(true); setErr(null);
    try { const r = await api.post(`/discovery/compliance-matrix/${oppId}`); setMatrixResult(r.data); }
    catch (e: any) { setErr(e?.response?.data?.detail || "Matrix generation failed"); }
    finally { setGeneratingMatrix(false); }
  }

  async function downloadProposal(format: string) {
    setGeneratingProposal(format); setErr(null);
    try {
      const r = await api.post(`/opportunities/${oppId}/generate-proposal`, { format }, { responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a"); a.href = url; a.download = `Proposal-${opp?.opp_code || oppId}.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) { setErr("Proposal generation failed"); }
    finally { setGeneratingProposal(null); }
  }

  if (loading) return <div style={page}><div style={{ ...shell, display: "grid", placeItems: "center", minHeight: "60vh" }}><div style={{ opacity: 0.5 }}>Loading...</div></div></div>;
  if (!opp) return <div style={page}><div style={shell}><div style={errBox}>Opportunity not found</div></div></div>;

  const hasAnalysis = !!opp.ai_summary;
  let analysis: Record<string, any> = {};
  try {
    if (opp.ai_summary) analysis.summary = typeof opp.ai_summary === "string" ? JSON.parse(opp.ai_summary) : opp.ai_summary;
    if (opp.ai_requirements) analysis.requirements = typeof opp.ai_requirements === "string" ? JSON.parse(opp.ai_requirements) : opp.ai_requirements;
    if (opp.ai_risk_flags) analysis.risks = typeof opp.ai_risk_flags === "string" ? JSON.parse(opp.ai_risk_flags) : opp.ai_risk_flags;
    if (opp.ai_bid_strategy) analysis.strategy = typeof opp.ai_bid_strategy === "string" ? JSON.parse(opp.ai_bid_strategy) : opp.ai_bid_strategy;
  } catch {}

  return (
    <div style={page}>
      <div style={shell}>
        {/* Header */}
        <div style={topBar}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opp.title}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{opp.agency_name} • {opp.opp_code}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => navigate("/discover")} style={btn}>← Discover</button>
            <button onClick={() => navigate("/profile")} style={btn}>👤 Profile</button>
          </div>
        </div>

        {err && <div style={errBox}>{err}</div>}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {!hasAnalysis && <button onClick={analyze} disabled={analyzing} style={btnGold}>{analyzing ? "🧠 Analyzing..." : "🧠 AI Analyze"}</button>}
          {hasAnalysis && (
            <>
              <button onClick={convert} disabled={converting} style={btnGold}>{converting ? "..." : "💰 Convert to Bid"}</button>
              <button onClick={() => downloadProposal("pdf")} disabled={!!generatingProposal} style={btn}>{generatingProposal === "pdf" ? "..." : "📄 Proposal PDF"}</button>
              <button onClick={() => downloadProposal("docx")} disabled={!!generatingProposal} style={btn}>{generatingProposal === "docx" ? "..." : "📝 Proposal Word"}</button>
            </>
          )}
          <button onClick={shredRfp} disabled={shredding} style={btn}>{shredding ? "Shredding..." : "🔪 Shred RFP"}</button>
          <button onClick={generateMatrix} disabled={generatingMatrix} style={btn}>{generatingMatrix ? "Generating..." : "✅ Compliance Matrix"}</button>
          <button onClick={() => navigate(`/war-room/${oppId}`)} style={{ ...btnGold, background: "linear-gradient(135deg,rgba(231,76,60,.15),rgba(243,156,18,.10))" }}>⚔️ War Room</button>
        </div>

        {/* Opportunity Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
          <div style={card}>
            <div style={cardTitle}>📋 Details</div>
            <div style={infoGrid}>
              <InfoRow l="Status" v={opp.status} />
              <InfoRow l="NAICS" v={opp.naics_code} />
              <InfoRow l="Set-Aside" v={opp.set_aside || opp.set_aside_type || "Open"} />
              <InfoRow l="Due Date" v={opp.due_date ? new Date(opp.due_date).toLocaleDateString() : "—"} />
              <InfoRow l="Source" v={opp.source || opp.source_type || "manual"} />
              <InfoRow l="Solicitation" v={opp.solicitation_number || "—"} />
              <InfoRow l="Contact" v={opp.contact_name || "—"} />
              <InfoRow l="Email" v={opp.contact_email || "—"} />
            </div>
          </div>
          {hasAnalysis && (
            <div style={card}>
              <div style={cardTitle}>🧠 AI Recommendation</div>
              <div style={{ textAlign: "center", marginTop: 10 }}>
                <div style={{
                  display: "inline-block", padding: "8px 24px", borderRadius: 20, fontWeight: 900, fontSize: 16,
                  background: opp.ai_bid_recommendation === "bid" ? "rgba(40,180,76,.15)" : opp.ai_bid_recommendation === "no_bid" ? "rgba(231,76,60,.15)" : "rgba(243,156,18,.15)",
                  color: opp.ai_bid_recommendation === "bid" ? "#28b44c" : opp.ai_bid_recommendation === "no_bid" ? "#e74c3c" : "#f39c12",
                }}>{opp.ai_bid_recommendation?.toUpperCase() || "—"}</div>
                <div style={{ fontSize: 24, fontWeight: 950, marginTop: 8 }}>{opp.ai_confidence_score}%</div>
                <div style={{ fontSize: 11, opacity: 0.5 }}>confidence score</div>
              </div>
            </div>
          )}
        </div>

        {/* AI Analysis */}
        {hasAnalysis && analysis.summary && (
          <div style={{ ...card, marginTop: 12 }}>
            <div style={cardTitle}>📊 AI Analysis Summary</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
              {typeof analysis.summary === "string" ? analysis.summary : JSON.stringify(analysis.summary, null, 2)}
            </div>
          </div>
        )}

        {/* Shredded RFP */}
        {shredResult && !shredResult.error && (
          <div style={{ ...card, marginTop: 12 }}>
            <div style={cardTitle}>🔪 Shredded RFP ({shredResult.total_requirements_count || shredResult.requirements?.length || 0} requirements)</div>
            {shredResult.evaluation_factors?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 4 }}>Evaluation Factors:</div>
                {shredResult.evaluation_factors.map((f: any, i: number) => (
                  <div key={i} style={{ fontSize: 12, padding: "4px 8px", background: "rgba(155,89,182,.08)", borderRadius: 8, marginBottom: 4 }}>
                    <b>{f.factor}</b> ({f.weight}) — {f.description}
                  </div>
                ))}
              </div>
            )}
            {shredResult.requirements?.slice(0, 15).map((r: any, i: number) => (
              <div key={i} style={{ fontSize: 11, padding: "4px 8px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <b>{r.id}</b> [{r.type}] {r.requirement?.substring(0, 120)}{(r.requirement?.length || 0) > 120 ? "..." : ""}
                {r.mandatory && <span style={{ color: "#e74c3c", fontSize: 9, marginLeft: 4 }}>MANDATORY</span>}
              </div>
            ))}
            {(shredResult.requirements?.length || 0) > 15 && <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>+ {shredResult.requirements.length - 15} more requirements</div>}
            {shredResult.risk_flags?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: "#e74c3c", marginBottom: 4 }}>⚠️ Risk Flags:</div>
                {shredResult.risk_flags.map((f: string, i: number) => (
                  <div key={i} style={{ fontSize: 12, color: "rgba(231,76,60,.8)", padding: "2px 0" }}>• {f}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compliance Matrix */}
        {matrixResult && !matrixResult.error && (
          <div style={{ ...card, marginTop: 12 }}>
            <div style={cardTitle}>✅ Compliance Matrix — Score: {matrixResult.compliance_score || 0}%</div>
            {matrixResult.summary && (
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <Stat label="Met" value={matrixResult.summary.met} color="#28b44c" />
                <Stat label="Partial" value={matrixResult.summary.partial} color="#f39c12" />
                <Stat label="Gap" value={matrixResult.summary.gap} color="#e74c3c" />
                <Stat label="N/A" value={matrixResult.summary.not_applicable} color="#95a5a6" />
              </div>
            )}
            {matrixResult.matrix?.slice(0, 20).map((m: any, i: number) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 80px", gap: 8, padding: "6px 4px", borderBottom: "1px solid rgba(255,255,255,.06)", fontSize: 11, alignItems: "center" }}>
                <span style={{ fontWeight: 800, opacity: 0.6 }}>{m.req_id}</span>
                <span>{m.requirement?.substring(0, 80)}</span>
                <span style={{ opacity: 0.6 }}>{m.proposal_section?.substring(0, 20)}</span>
                <span style={{
                  fontWeight: 700, fontSize: 10, textAlign: "center", padding: "2px 6px", borderRadius: 8,
                  background: m.status === "Met" ? "rgba(40,180,76,.15)" : m.status === "Gap" ? "rgba(231,76,60,.15)" : "rgba(243,156,18,.15)",
                  color: m.status === "Met" ? "#28b44c" : m.status === "Gap" ? "#e74c3c" : "#f39c12",
                }}>{m.status}</span>
              </div>
            ))}
            {matrixResult.critical_gaps?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: "#e74c3c" }}>🚨 Critical Gaps:</div>
                {matrixResult.critical_gaps.map((g: any, i: number) => (
                  <div key={i} style={{ fontSize: 12, padding: "6px 8px", background: "rgba(231,76,60,.08)", borderRadius: 8, marginTop: 4 }}>
                    <b>{g.requirement}</b> — {g.gap_description}
                    {g.mitigation && <div style={{ color: "#28b44c", marginTop: 2 }}>→ {g.mitigation}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Documents */}
        {opp.attachments?.length > 0 && (
          <div style={{ ...card, marginTop: 12 }}>
            <div style={cardTitle}>📎 Documents ({opp.attachments.length})</div>
            {opp.attachments.map((a: any) => (
              <div key={a.id} style={{ fontSize: 12, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                📄 {a.original_filename || a.filename} <span style={{ opacity: 0.4 }}>({a.file_type})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ l, v }: { l: string; v?: string }) {
  return <><span style={{ opacity: 0.5, fontSize: 12 }}>{l}</span><span style={{ fontSize: 13, fontWeight: 600 }}>{v || "—"}</span></>;
}
function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return <div style={{ textAlign: "center" }}><div style={{ fontWeight: 900, fontSize: 20, color }}>{value || 0}</div><div style={{ fontSize: 10, opacity: 0.5 }}>{label}</div></div>;
}

const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(1200px 800px at 20% 12%,rgba(122,63,255,.30),transparent 55%),radial-gradient(900px 650px at 78% 28%,rgba(255,185,56,.18),transparent 55%),linear-gradient(180deg,#060712,#0B1020)", color: "rgba(255,255,255,.92)", fontFamily: "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial" };
const shell: React.CSSProperties = { width: "min(1100px,calc(100% - 48px))", margin: "0 auto", padding: "28px 0 60px" };
const topBar: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, background: "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.04))", boxShadow: "0 14px 40px rgba(0,0,0,.45)", flexWrap: "wrap", gap: 10 };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, background: "rgba(255,255,255,.05)", padding: 16, backdropFilter: "blur(12px)" };
const cardTitle: React.CSSProperties = { fontWeight: 900, fontSize: 14, color: "rgba(215,182,109,.9)" };
const infoGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "100px 1fr", gap: "6px 12px", marginTop: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: "8px 14px", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.9)", fontWeight: 700, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" };
const btnGold: React.CSSProperties = { ...btn, border: "1px solid rgba(215,182,109,.35)", background: "radial-gradient(420px 160px at 25% 20%,rgba(215,182,109,.18),transparent 60%),linear-gradient(135deg,rgba(122,63,255,.18),rgba(255,185,56,.10))" };
const errBox: React.CSSProperties = { marginTop: 10, borderRadius: 14, border: "1px solid rgba(255,100,100,.22)", background: "rgba(255,90,90,.08)", padding: 12, color: "rgba(255,150,150,.9)", fontSize: 13 };
