// src/pages/WarRoomPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";

type WR = Record<string, any>;

export default function WarRoomPage() {
  const { oppId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<WR | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [oppTitle, setOppTitle] = useState("");

  useEffect(() => {
    // Load opportunity title
    api.get(`/opportunities/${oppId}`).then(r => setOppTitle(r.data.title || "")).catch(() => {});
    // Check if war room already exists
    api.get(`/opportunities/${oppId}`).then(r => {
      if (r.data.war_room_analysis) {
        try { setData(JSON.parse(r.data.war_room_analysis)); } catch {}
      }
    }).catch(() => {});
  }, [oppId]);

  async function runWarRoom() {
    setLoading(true);
    setErr(null);
    try {
      const r = await api.post(`/discovery/war-room/${oppId}`);
      if (r.data.error) { setErr(r.data.error); }
      else { setData(r.data); }
    } catch (e: any) { setErr(e?.response?.data?.detail || e.message); }
    finally { setLoading(false); }
  }

  const wp = data?.win_probability || {};
  const cl = data?.competitive_landscape || {};
  const ghost = data?.ghost_proposal || {};
  const strat = data?.our_win_strategy || {};

  return (
    <div style={page}>
      <div style={shell}>
        {/* Header */}
        <div style={topBar}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 18 }}>⚔️ AI War Room</div>
            <div style={{ opacity: 0.6, fontSize: 12 }}>{oppTitle || `Opportunity #${oppId}`}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate(`/opportunities/${oppId}`)} style={btn}>← Back</button>
            {!data && !loading && <button onClick={runWarRoom} style={btnGold}>🧠 Launch War Room Analysis</button>}
            {data && <button onClick={runWarRoom} disabled={loading} style={btnGold}>{loading ? "Re-analyzing..." : "🔄 Re-run"}</button>}
          </div>
        </div>

        {loading && (
          <div style={{ ...card, marginTop: 14, textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🧠</div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Claude AI is analyzing the competitive landscape...</div>
            <div style={{ opacity: 0.5, marginTop: 8 }}>Simulating competitors, generating ghost proposals, building counter-strategies</div>
            <div style={{ opacity: 0.3, marginTop: 4, fontSize: 12 }}>This takes 15-30 seconds</div>
          </div>
        )}

        {err && <div style={errBox}>{err}</div>}

        {data && !data.error && (
          <>
            {/* Executive Brief + Win Probability */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginTop: 14 }}>
              <div style={card}>
                <div style={cardTitle}>📋 Executive Brief</div>
                <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>{data.executive_brief}</p>
                {data.bottom_line && (
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(215,182,109,.08)", border: "1px solid rgba(215,182,109,.2)" }}>
                    <div style={{ fontWeight: 800, color: "rgba(215,182,109,.9)", fontSize: 12, marginBottom: 4 }}>💡 BOTTOM LINE</div>
                    <div style={{ fontSize: 13, lineHeight: 1.5 }}>{data.bottom_line}</div>
                  </div>
                )}
              </div>
              <div style={card}>
                <div style={cardTitle}>🎯 Win Probability</div>
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <div style={{
                    width: 100, height: 100, borderRadius: "50%", margin: "0 auto",
                    display: "grid", placeItems: "center",
                    background: `conic-gradient(${wp.score >= 60 ? "#28b44c" : wp.score >= 35 ? "#f39c12" : "#e74c3c"} ${wp.score}%, rgba(255,255,255,.08) 0)`,
                  }}>
                    <div style={{ width: 76, height: 76, borderRadius: "50%", background: "#0d1117", display: "grid", placeItems: "center" }}>
                      <span style={{ fontWeight: 950, fontSize: 24 }}>{wp.score}%</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>Confidence: {wp.confidence}</div>
                </div>
                {wp.key_factors?.map((f: string, i: number) => (
                  <div key={i} style={{ fontSize: 11, marginTop: 4, padding: "4px 8px", borderRadius: 8, background: "rgba(255,255,255,.04)" }}>• {f}</div>
                ))}
              </div>
            </div>

            {/* Competitors */}
            <div style={{ ...card, marginTop: 14 }}>
              <div style={cardTitle}>🏢 Competitive Landscape ({cl.competitive_intensity} intensity, ~{cl.total_expected_bidders} bidders)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginTop: 10 }}>
                {(cl.likely_competitors || []).map((c: any, i: number) => (
                  <div key={i} style={{ padding: 12, borderRadius: 12, border: `1px solid ${c.threat_level === "High" ? "rgba(231,76,60,.3)" : c.threat_level === "Medium" ? "rgba(243,156,18,.3)" : "rgba(255,255,255,.1)"}`, background: "rgba(255,255,255,.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{c.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: c.threat_level === "High" ? "rgba(231,76,60,.15)" : "rgba(243,156,18,.15)", color: c.threat_level === "High" ? "#e74c3c" : "#f39c12" }}>
                        {c.threat_level} Threat
                      </span>
                    </div>
                    {c.incumbent && <div style={{ fontSize: 10, color: "#e74c3c", fontWeight: 800, marginTop: 2 }}>⚠️ INCUMBENT</div>}
                    {c.estimated_bid_range && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>💰 {c.estimated_bid_range}</div>}
                    <div style={{ fontSize: 11, marginTop: 6 }}>
                      <span style={{ fontWeight: 700, color: "#28b44c" }}>Strengths:</span> {c.strengths?.join(", ")}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 2 }}>
                      <span style={{ fontWeight: 700, color: "#e74c3c" }}>Weaknesses:</span> {c.weaknesses?.join(", ")}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7, fontStyle: "italic" }}>{c.likely_strategy}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ghost Proposal */}
            <div style={{ ...card, marginTop: 14, border: "1px solid rgba(155,89,182,.2)" }}>
              <div style={{ ...cardTitle, color: "#9b59b6" }}>👻 Ghost Proposal (Strongest Competitor)</div>
              <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{ghost.description}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                <div style={infoBox}><div style={infoLabel}>Technical Approach</div><div style={infoVal}>{ghost.technical_approach}</div></div>
                <div style={infoBox}><div style={infoLabel}>Pricing Strategy</div><div style={infoVal}>{ghost.pricing_strategy}</div></div>
              </div>
              {ghost.weaknesses_to_exploit?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 12, color: "#e74c3c", marginBottom: 4 }}>🎯 Weaknesses to Exploit:</div>
                  {ghost.weaknesses_to_exploit.map((w: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, padding: "4px 8px", background: "rgba(231,76,60,.08)", borderRadius: 8, marginBottom: 4 }}>→ {w}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Our Win Strategy */}
            <div style={{ ...card, marginTop: 14, border: "1px solid rgba(40,180,76,.2)" }}>
              <div style={{ ...cardTitle, color: "#28b44c" }}>🏆 Our Win Strategy</div>
              {/* Win Themes */}
              {strat.primary_win_themes?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 6 }}>Win Themes:</div>
                  {strat.primary_win_themes.map((t: any, i: number) => (
                    <div key={i} style={{ padding: 10, borderRadius: 10, background: "rgba(40,180,76,.06)", marginBottom: 6 }}>
                      <div style={{ fontWeight: 800 }}>{t.theme}</div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{t.description}</div>
                      {t.evidence && <div style={{ fontSize: 11, color: "#28b44c", marginTop: 2 }}>📎 {t.evidence}</div>}
                    </div>
                  ))}
                </div>
              )}
              {/* Pricing */}
              {strat.pricing_strategy && (
                <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: "rgba(215,182,109,.06)", border: "1px solid rgba(215,182,109,.15)" }}>
                  <div style={{ fontWeight: 800, color: "rgba(215,182,109,.9)", fontSize: 12 }}>💰 Pricing Strategy: {strat.pricing_strategy.approach}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Range: <b>{strat.pricing_strategy.recommended_range}</b></div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{strat.pricing_strategy.reasoning}</div>
                  {strat.pricing_strategy.price_to_win && <div style={{ fontSize: 13, fontWeight: 800, color: "#28b44c", marginTop: 4 }}>Price to Win: {strat.pricing_strategy.price_to_win}</div>}
                </div>
              )}
              {/* Teaming */}
              {strat.teaming_recommendations?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 4 }}>🤝 Teaming Recommendations:</div>
                  {strat.teaming_recommendations.map((t: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, padding: "4px 8px", background: "rgba(52,152,219,.08)", borderRadius: 8, marginBottom: 4 }}>
                      <b>{t.capability_gap}:</b> {t.partner_type} — {t.impact}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Counter Strategies */}
            {data.counter_strategies?.length > 0 && (
              <div style={{ ...card, marginTop: 14 }}>
                <div style={cardTitle}>♟️ Counter Strategies</div>
                {data.counter_strategies.map((cs: any, i: number) => (
                  <div key={i} style={{ padding: 10, borderRadius: 10, background: "rgba(255,255,255,.03)", marginTop: 8, borderLeft: "3px solid rgba(122,63,255,.5)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{cs.if_competitor}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>They'll: {cs.their_likely_move}</div>
                    <div style={{ fontSize: 12, color: "#28b44c", fontWeight: 700, marginTop: 4 }}>→ {cs.our_counter}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Plan */}
            {data.action_plan?.length > 0 && (
              <div style={{ ...card, marginTop: 14 }}>
                <div style={cardTitle}>📋 Action Plan</div>
                {data.action_plan.map((a: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(215,182,109,.15)", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 12, color: "rgba(215,182,109,.9)", flexShrink: 0 }}>{a.priority}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{a.action}</div>
                      <div style={{ fontSize: 11, opacity: 0.5 }}>{a.owner} • {a.deadline} • {a.impact}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!data && !loading && (
          <div style={{ ...card, marginTop: 14, textAlign: "center", padding: 50 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚔️</div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>AI War Room</div>
            <div style={{ opacity: 0.5, marginTop: 8, maxWidth: 500, margin: "8px auto 0" }}>
              Claude AI will simulate the competitive landscape, generate ghost proposals,
              create counter-strategies, and tell you exactly how to win.
            </div>
            <button onClick={runWarRoom} style={{ ...btnGold, marginTop: 20, padding: "12px 24px", fontSize: 14 }}>
              🧠 Launch War Room Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(1200px 800px at 20% 12%,rgba(122,63,255,.30),transparent 55%),radial-gradient(900px 650px at 78% 28%,rgba(255,185,56,.18),transparent 55%),linear-gradient(180deg,#060712,#0B1020)", color: "rgba(255,255,255,.92)", fontFamily: "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial" };
const shell: React.CSSProperties = { width: "min(1100px,calc(100% - 48px))", margin: "0 auto", padding: "28px 0 60px" };
const topBar: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, background: "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.04))", boxShadow: "0 14px 40px rgba(0,0,0,.45)", flexWrap: "wrap", gap: 10 };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, background: "rgba(255,255,255,.05)", padding: 16, backdropFilter: "blur(12px)" };
const cardTitle: React.CSSProperties = { fontWeight: 900, fontSize: 15, color: "rgba(215,182,109,.9)" };
const btn: React.CSSProperties = { border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: "8px 14px", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.9)", fontWeight: 700, cursor: "pointer", fontSize: 12 };
const btnGold: React.CSSProperties = { ...btn, border: "1px solid rgba(215,182,109,.35)", background: "radial-gradient(420px 160px at 25% 20%,rgba(215,182,109,.18),transparent 60%),linear-gradient(135deg,rgba(122,63,255,.18),rgba(255,185,56,.10))" };
const errBox: React.CSSProperties = { marginTop: 14, borderRadius: 14, border: "1px solid rgba(255,100,100,.22)", background: "rgba(255,90,90,.08)", padding: 12, color: "rgba(255,150,150,.9)", fontSize: 13 };
const infoBox: React.CSSProperties = { padding: 10, borderRadius: 10, background: "rgba(255,255,255,.03)" };
const infoLabel: React.CSSProperties = { fontWeight: 800, fontSize: 11, opacity: 0.6, marginBottom: 4 };
const infoVal: React.CSSProperties = { fontSize: 12, lineHeight: 1.5 };
