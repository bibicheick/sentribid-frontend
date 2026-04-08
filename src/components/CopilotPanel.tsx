// src/components/CopilotPanel.tsx
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";

type AnyObj = Record<string, any>;
type ChatMsg = { role: "user" | "copilot"; text: string };

export default function CopilotPanel({ bidId, onClose }: { bidId: string; onClose: () => void }) {
  const [tab, setTab] = useState<"analysis" | "chat">("analysis");
  const [analysis, setAnalysis] = useState<AnyObj | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!analysis && !analyzing) runAnalysis();
  }, [bidId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function runAnalysis() {
    try {
      setAnalyzing(true);
      const res = await api.post(`/bids/${bidId}/copilot/analyze`);
      setAnalysis(res.data);
    } catch (e: any) {
      setAnalysis({ error: e?.response?.data?.detail || e?.message || "Analysis failed." });
    } finally {
      setAnalyzing(false);
    }
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);
    try {
      const res = await api.post(`/bids/${bidId}/copilot/chat`, { message: userMsg });
      setChatMessages((prev) => [...prev, { role: "copilot", text: res.data.reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "copilot", text: "Sorry, I couldn't process that request." }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 0.2 }}>🤖 Bid Copilot</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTab("analysis")} style={tabBtn(tab === "analysis", "gold")}>Analysis</button>
          <button onClick={() => setTab("chat")} style={tabBtn(tab === "chat", "purple")}>Chat</button>
          <button onClick={onClose} style={{ ...tabBtnBase, opacity: 0.6 }}>✕</button>
        </div>
      </div>

      {tab === "analysis" ? (
        <div>
          {analyzing ? (
            <div style={loadingStyle}>
              <div style={pulseStyle} />
              <span>Analyzing bid data…</span>
            </div>
          ) : analysis?.error ? (
            <div style={{ color: "rgba(255,120,120,.95)", padding: 8 }}>{analysis.error}</div>
          ) : analysis ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Executive Summary */}
              <div style={sectionStyle}>
                <div style={sectionHeaderGold}>Executive Summary</div>
                <div style={{ opacity: 0.88, lineHeight: 1.55, fontSize: 13 }}>{analysis.executive_summary}</div>
              </div>

              {/* Risk */}
              <div style={sectionStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={sectionHeader}>Risk Assessment</div>
                  <span style={gradeBadge(analysis.risk?.risk_grade)}>
                    {analysis.risk?.risk_grade} — {analysis.risk?.overall_risk_score}/100
                  </span>
                </div>
                <div style={{ opacity: 0.75, fontSize: 12, marginBottom: 8 }}>{analysis.risk?.summary}</div>
                {(analysis.risk?.items || []).map((item: any, i: number) => (
                  <div key={i} style={itemCard}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={severityDot(item.severity)} />
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{item.title}</span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.78 }}>{item.detail}</div>
                    <div style={recText}>→ {item.recommendation}</div>
                  </div>
                ))}
              </div>

              {/* Profit */}
              <div style={sectionStyle}>
                <div style={sectionHeader}>Profit Optimization</div>
                <div style={{ opacity: 0.75, fontSize: 12, marginBottom: 6 }}>{analysis.profit?.current_margin_assessment}</div>
                <div style={{ fontSize: 12, marginBottom: 10, color: "rgba(122,63,255,.92)" }}>
                  Optimal mode: <b>{analysis.profit?.optimal_mode?.toUpperCase()}</b>
                </div>
                {(analysis.profit?.suggestions || []).map((s: any, i: number) => (
                  <div key={i} style={itemCard}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                      #{s.priority} {s.strategy}
                      <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.55 }}>({s.confidence})</span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.78 }}>{s.description}</div>
                    <div style={{
                      fontSize: 12, marginTop: 4,
                      color: s.estimated_impact_pct >= 0 ? "rgba(40,220,160,.92)" : "rgba(255,180,100,.92)"
                    }}>
                      Impact: {s.estimated_impact_pct >= 0 ? "+" : ""}{s.estimated_impact_pct}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Compliance */}
              <div style={sectionStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={sectionHeader}>Compliance</div>
                  <span style={compBadge(analysis.compliance?.overall_status)}>
                    {(analysis.compliance?.overall_status || "").replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
                {(analysis.compliance?.flags || []).map((f: any, i: number) => (
                  <div key={i} style={itemCard}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={flagIcon(f.status)} />
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{f.rule}</span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.78 }}>{f.detail}</div>
                    <div style={recText}>Action: {f.action_required}</div>
                  </div>
                ))}
              </div>

              <button onClick={runAnalysis} style={reAnalyzeBtn}>Re-analyze</button>
            </div>
          ) : (
            <button onClick={runAnalysis} style={primaryBtn}>Run AI Analysis</button>
          )}
        </div>
      ) : (
        /* Chat Tab */
        <div style={{ display: "flex", flexDirection: "column", height: 420 }}>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" }}>
            {chatMessages.length === 0 && (
              <div style={{ opacity: 0.55, fontSize: 13, padding: 8 }}>
                Ask me anything about this bid — costs, risks, strategy, next steps…
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} style={{
                ...bubbleStyle,
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user"
                  ? "linear-gradient(135deg, rgba(122,63,255,.35), rgba(47,91,255,.25))"
                  : "rgba(255,255,255,.06)",
                borderColor: m.role === "user" ? "rgba(122,63,255,.35)" : "rgba(255,255,255,.12)",
                maxWidth: "85%",
              }}>
                {m.role === "copilot" && <div style={{ fontSize: 10, opacity: 0.55, marginBottom: 4 }}>🤖 Copilot</div>}
                <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{m.text}</div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ opacity: 0.55, fontSize: 12, padding: 8, display: "flex", gap: 8, alignItems: "center" }}>
                <div style={pulseStyleSmall} />
                Thinking…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestions */}
          {chatMessages.length === 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {["What's my risk exposure?", "How to improve win rate?", "What should I do next?", "Cost breakdown"].map((q) => (
                <button key={q} onClick={() => { setChatInput(q); }} style={suggestionBtn}>{q}</button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder="Ask about this bid…"
              style={chatInputStyle}
            />
            <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={sendBtn}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */

const panelStyle: React.CSSProperties = {
  marginTop: 14,
  borderRadius: 22,
  border: "1px solid rgba(215,182,109,.25)",
  background:
    "radial-gradient(800px 400px at 10% 0%, rgba(122,63,255,.15), transparent 60%)," +
    "radial-gradient(600px 300px at 90% 100%, rgba(215,182,109,.10), transparent 60%)," +
    "linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03))",
  boxShadow: "0 20px 60px rgba(0,0,0,.45)",
  backdropFilter: "blur(18px)",
  padding: 18,
};

const tabBtnBase: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 12,
  padding: "7px 12px",
  background: "transparent",
  color: "rgba(255,255,255,.88)",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
};

function tabBtn(active: boolean, accent: "gold" | "purple"): React.CSSProperties {
  const gold = "rgba(215,182,109,";
  const purple = "rgba(122,63,255,";
  const c = accent === "gold" ? gold : purple;
  return {
    ...tabBtnBase,
    borderColor: active ? `${c}.55)` : "rgba(255,255,255,.14)",
    background: active ? `${c}.12)` : "transparent",
  };
}

const sectionStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(255,255,255,.04)",
  padding: 14,
};
const sectionHeader: React.CSSProperties = { fontWeight: 800, fontSize: 14 };
const sectionHeaderGold: React.CSSProperties = { ...sectionHeader, color: "rgba(215,182,109,.95)", marginBottom: 8 };

const itemCard: React.CSSProperties = {
  marginTop: 8,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(0,0,0,.12)",
  padding: 10,
};

const recText: React.CSSProperties = { fontSize: 12, color: "rgba(215,182,109,.88)", marginTop: 4 };

function severityDot(sev: string): React.CSSProperties {
  const colors: Record<string, string> = {
    critical: "rgba(255,80,80,.95)",
    high: "rgba(255,150,80,.95)",
    medium: "rgba(215,182,109,.95)",
    low: "rgba(40,220,160,.95)",
  };
  return {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: 999,
    background: colors[sev] || colors.medium,
    boxShadow: `0 0 8px ${colors[sev] || colors.medium}`,
  };
}

function gradeBadge(grade: string): React.CSSProperties {
  const colors: Record<string, string> = { A: "rgba(40,220,160,", B: "rgba(40,220,160,", C: "rgba(215,182,109,", D: "rgba(255,150,80,", F: "rgba(255,80,80," };
  const c = colors[grade] || colors.C;
  return {
    fontSize: 12,
    fontWeight: 800,
    padding: "5px 10px",
    borderRadius: 999,
    border: `1px solid ${c}.35)`,
    background: `${c}.12)`,
    color: `${c}.95)`,
  };
}

function compBadge(status: string): React.CSSProperties {
  const isOk = status === "compliant";
  const isFail = status === "non_compliant";
  const c = isOk ? "rgba(40,220,160," : isFail ? "rgba(255,80,80," : "rgba(215,182,109,";
  return {
    fontSize: 11,
    fontWeight: 800,
    padding: "5px 10px",
    borderRadius: 999,
    border: `1px solid ${c}.35)`,
    background: `${c}.12)`,
    color: `${c}.95)`,
    letterSpacing: 0.3,
  };
}

function flagIcon(status: string): React.CSSProperties {
  const colors: Record<string, string> = { pass: "rgba(40,220,160,.95)", warning: "rgba(215,182,109,.95)", fail: "rgba(255,80,80,.95)" };
  return {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: 999,
    background: colors[status] || colors.warning,
  };
}

const loadingStyle: React.CSSProperties = { display: "flex", gap: 12, alignItems: "center", padding: 12, opacity: 0.75 };
const pulseStyle: React.CSSProperties = {
  width: 12, height: 12, borderRadius: 999,
  background: "rgba(215,182,109,.6)",
  animation: "pulse 1.2s infinite",
};
const pulseStyleSmall: React.CSSProperties = { ...pulseStyle, width: 8, height: 8 };

const bubbleStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.12)",
  padding: "10px 14px",
};

const chatInputStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(0,0,0,.18)",
  color: "rgba(255,255,255,.92)",
  outline: "none",
};

const sendBtn: React.CSSProperties = {
  border: "1px solid rgba(122,63,255,.35)",
  borderRadius: 14,
  padding: "10px 14px",
  background: "linear-gradient(135deg, rgba(122,63,255,.35), rgba(47,91,255,.25))",
  color: "rgba(255,255,255,.92)",
  fontWeight: 700,
  cursor: "pointer",
};

const suggestionBtn: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 999,
  padding: "6px 10px",
  background: "rgba(255,255,255,.04)",
  color: "rgba(255,255,255,.72)",
  fontSize: 11,
  cursor: "pointer",
};

const reAnalyzeBtn: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 14,
  padding: "10px 14px",
  background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))",
  color: "rgba(255,255,255,.88)",
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 8,
};

const primaryBtn: React.CSSProperties = {
  border: "1px solid rgba(215,182,109,.40)",
  borderRadius: 14,
  padding: "12px 16px",
  background:
    "radial-gradient(420px 160px at 25% 20%, rgba(215,182,109,.20), transparent 60%)," +
    "linear-gradient(135deg, rgba(122,63,255,.22), rgba(255,185,56,.12))",
  color: "rgba(255,255,255,.92)",
  fontWeight: 800,
  cursor: "pointer",
};
