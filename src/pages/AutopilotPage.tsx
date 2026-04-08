// src/pages/AutopilotPage.tsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

const STEPS = [
  { key: "upload", icon: "📄", label: "Upload & Extract Text" },
  { key: "analysis", icon: "🔍", label: "AI Analysis (6 sub-analyses)" },
  { key: "shred", icon: "🔪", label: "Shred RFP — Extract All Requirements" },
  { key: "compliance", icon: "✅", label: "Compliance Matrix" },
  { key: "war_room", icon: "⚔️", label: "War Room — Competitive Intelligence" },
  { key: "bid", icon: "💰", label: "Convert to Bid with AI Pricing" },
  { key: "proposal", icon: "📝", label: "Generate Proposal Document" },
];

type Result = Record<string, any> | null;

export default function AutopilotPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [agency, setAgency] = useState("");
  const [format, setFormat] = useState("pdf");
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState<Result>(null);
  const [err, setErr] = useState("");

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function runAutopilot() {
    if (!file) return;
    setRunning(true);
    setErr("");
    setResult(null);
    setCurrentStep(0);

    // Animate steps while waiting
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 8000); // Move to next step every ~8s (total ~56s for 7 steps)

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title || file.name);
      fd.append("agency_name", agency || "Unknown Agency");
      fd.append("format_type", format);

      const res = await api.post("/opportunities/autopilot-upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000, // 5 min timeout
      });

      clearInterval(stepInterval);
      setCurrentStep(STEPS.length); // All done
      setResult(res.data);
    } catch (e: any) {
      clearInterval(stepInterval);
      setErr(e?.response?.data?.detail || "Autopilot failed. Check your API keys and try again.");
    } finally {
      setRunning(false);
    }
  }

  const completedSteps = result?.steps_completed || [];

  return (
    <div style={page}>
      <div style={shell}>
        {/* Header */}
        <div style={topBar}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 20 }}>
              ⚡ Bid <span style={{ color: "rgba(215,182,109,.9)" }}>Autopilot</span>
            </div>
            <div style={{ opacity: 0.6, fontSize: 12 }}>
              Upload an RFP → Get a complete proposal package. One click. Zero manual steps.
            </div>
          </div>
          <button onClick={() => navigate("/discover")} style={btn}>← Discover</button>
        </div>

        {/* Upload Area */}
        {!running && !result && (
          <div style={{ ...card, marginTop: 14 }}>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Drop Your RFP — Autopilot Does the Rest</div>
              <div style={{ opacity: 0.5, fontSize: 12, marginTop: 4, maxWidth: 500, margin: "4px auto" }}>
                Upload → Extract → Analyze → Shred → Compliance Matrix → War Room → Bid → Proposal
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <div>
                <label style={lbl}>Contract Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} style={input} placeholder="Auto-filled from filename" />
              </div>
              <div>
                <label style={lbl}>Agency</label>
                <input value={agency} onChange={(e) => setAgency(e.target.value)} style={input} placeholder="e.g. Department of Defense" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "end" }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>RFP Document</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    ...input, padding: "16px 12px", textAlign: "center", cursor: "pointer",
                    border: file ? "1px solid rgba(40,180,76,.4)" : "2px dashed rgba(255,255,255,.2)",
                    background: file ? "rgba(40,180,76,.06)" : "rgba(255,255,255,.03)",
                  }}
                >
                  {file ? (
                    <span style={{ color: "#28b44c", fontWeight: 700 }}>📄 {file.name} ({(file.size / 1024).toFixed(0)} KB)</span>
                  ) : (
                    <span style={{ opacity: 0.5 }}>Click to select PDF, DOCX, or TXT</span>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" hidden onChange={onFileSelect} />
              </div>
              <div>
                <label style={lbl}>Output</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)} style={{ ...input, width: 90 }}>
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                </select>
              </div>
            </div>

            <button
              onClick={runAutopilot}
              disabled={!file}
              style={{
                ...btnLaunch,
                opacity: file ? 1 : 0.4,
                cursor: file ? "pointer" : "not-allowed",
                marginTop: 16,
              }}
            >
              ⚡ Launch Autopilot
            </button>
          </div>
        )}

        {err && <div style={errBox}>{err}</div>}

        {/* Progress Steps */}
        {(running || result) && (
          <div style={{ ...card, marginTop: 14 }}>
            <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 12, color: "rgba(215,182,109,.9)" }}>
              {result ? `✅ Autopilot Complete — ${completedSteps.length}/${STEPS.length} steps` : "⚡ Autopilot Running..."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {STEPS.map((step, i) => {
                const done = result ? completedSteps.includes(step.key) : i < currentStep;
                const active = !result && i === currentStep;
                const failed = result && !completedSteps.includes(step.key) && result.errors?.some((e: string) => e.toLowerCase().includes(step.key.replace("_", " ")));
                const pending = !done && !active && !failed;

                return (
                  <div key={step.key} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                    borderRadius: 12,
                    background: active ? "rgba(122,63,255,.12)" : done ? "rgba(40,180,76,.06)" : failed ? "rgba(255,90,90,.06)" : "transparent",
                    border: active ? "1px solid rgba(122,63,255,.3)" : "1px solid transparent",
                    transition: "all .3s",
                  }}>
                    <div style={{ fontSize: 18, minWidth: 28, textAlign: "center" }}>
                      {done ? "✅" : failed ? "❌" : active ? (
                        <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>{step.icon}</span>
                      ) : (
                        <span style={{ opacity: 0.3 }}>{step.icon}</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, opacity: pending ? 0.4 : 1 }}>{step.label}</div>
                      {active && <div style={{ fontSize: 11, color: "rgba(122,63,255,.8)", marginTop: 2 }}>Processing...</div>}
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.4 }}>Step {i + 1}</div>
                  </div>
                );
              })}
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Score Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div style={scoreCard}>
                <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4 }}>AI Recommendation</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: result.analysis?.recommendation === "bid" ? "#28b44c" : "#f39c12" }}>
                  {(result.analysis?.recommendation || "N/A").toUpperCase()}
                </div>
                {result.analysis?.confidence != null && (
                  <div style={{ fontSize: 11, opacity: 0.6 }}>{Math.round(result.analysis.confidence * 100)}% confidence</div>
                )}
              </div>
              <div style={scoreCard}>
                <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4 }}>Win Probability</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: (result.war_room?.win_probability || 0) >= 50 ? "#28b44c" : "#f39c12" }}>
                  {result.war_room?.win_probability || 0}%
                </div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>War Room Score</div>
              </div>
              <div style={scoreCard}>
                <div style={{ fontSize: 10, opacity: 0.5, marginBottom: 4 }}>Compliance</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: (result.compliance?.score || 0) >= 70 ? "#28b44c" : "#f39c12" }}>
                  {result.compliance?.score || 0}%
                </div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{result.compliance?.gaps || 0} gaps found</div>
              </div>
            </div>

            {/* War Room Brief */}
            {result.war_room?.bottom_line && (
              <div style={{ ...card, borderColor: "rgba(122,63,255,.2)" }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: "rgba(122,63,255,.9)", marginBottom: 4 }}>⚔️ War Room Bottom Line</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.85 }}>{result.war_room.bottom_line}</div>
              </div>
            )}

            {/* Errors */}
            {result.errors?.length > 0 && (
              <div style={{ ...errBox, background: "rgba(255,185,56,.06)", borderColor: "rgba(255,185,56,.25)", color: "rgba(255,200,100,.9)" }}>
                <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 4 }}>⚠️ Some steps had issues:</div>
                {result.errors.map((e: string, i: number) => (
                  <div key={i} style={{ fontSize: 12, marginTop: 2 }}>• {e}</div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {result.has_proposal && result.proposal_download && (
                <a
                  href={`${(api.defaults.baseURL || "")}${result.proposal_download}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...btnLaunch, textDecoration: "none", textAlign: "center", flex: 1 }}
                >
                  📥 Download Proposal ({format.toUpperCase()})
                </a>
              )}
              {result.opp_id && (
                <button onClick={() => navigate(`/opportunities/${result.opp_id}`)} style={{ ...btnGold, flex: 1 }}>
                  🔍 View Opportunity Details
                </button>
              )}
              {result.bid_id && (
                <button onClick={() => navigate(`/bids/${result.bid_id}`)} style={{ ...btnGold, flex: 1 }}>
                  💰 View Bid
                </button>
              )}
              {result.opp_id && (
                <button onClick={() => navigate(`/war-room/${result.opp_id}`)} style={{ ...btn, flex: 1 }}>
                  ⚔️ Full War Room
                </button>
              )}
            </div>

            {/* Run Again */}
            <button
              onClick={() => { setResult(null); setFile(null); setTitle(""); setAgency(""); setCurrentStep(-1); }}
              style={{ ...btn, marginTop: 4, textAlign: "center" }}
            >
              ⚡ Run Another Autopilot
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(1200px 800px at 20% 12%,rgba(122,63,255,.30),transparent 55%),radial-gradient(900px 650px at 78% 28%,rgba(255,185,56,.18),transparent 55%),linear-gradient(180deg,#060712,#0B1020)", color: "rgba(255,255,255,.92)", fontFamily: "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial" };
const shell: React.CSSProperties = { width: "min(800px,calc(100% - 48px))", margin: "0 auto", padding: "28px 0 60px" };
const topBar: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, background: "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.04))", boxShadow: "0 14px 40px rgba(0,0,0,.45)", flexWrap: "wrap", gap: 10 };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, background: "rgba(255,255,255,.05)", padding: 16, backdropFilter: "blur(12px)" };
const scoreCard: React.CSSProperties = { ...card, textAlign: "center", padding: "14px 10px" };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, opacity: 0.6, display: "block", marginBottom: 4 };
const input: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.06)", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" };
const btn: React.CSSProperties = { border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: "10px 16px", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.9)", fontWeight: 700, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" };
const btnGold: React.CSSProperties = { ...btn, border: "1px solid rgba(215,182,109,.35)", background: "radial-gradient(420px 160px at 25% 20%,rgba(215,182,109,.18),transparent 60%),linear-gradient(135deg,rgba(122,63,255,.18),rgba(255,185,56,.10))" };
const btnLaunch: React.CSSProperties = {
  width: "100%", padding: "14px 20px", borderRadius: 16, fontWeight: 900, fontSize: 15,
  border: "1px solid rgba(122,63,255,.5)",
  background: "linear-gradient(135deg,rgba(122,63,255,.25),rgba(215,182,109,.15))",
  color: "rgba(255,255,255,.95)", cursor: "pointer",
  boxShadow: "0 8px 30px rgba(122,63,255,.2)",
};
const errBox: React.CSSProperties = { marginTop: 10, borderRadius: 14, border: "1px solid rgba(255,100,100,.22)", background: "rgba(255,90,90,.08)", padding: 12, color: "rgba(255,150,150,.9)", fontSize: 13 };
