// src/pages/OnboardingPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [showSamHelp, setShowSamHelp] = useState(false);

  // Profile fields
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [naicsCodes, setNaicsCodes] = useState("");
  const [certifications, setCertifications] = useState("");
  const [setAsideEligible, setSetAsideEligible] = useState("");
  const [coreCompetencies, setCoreCompetencies] = useState("");
  const [elevatorPitch, setElevatorPitch] = useState("");
  const [samApiKey, setSamApiKey] = useState("");

  async function saveProfile() {
    setSaving(true);
    setErr("");
    try {
      await api.put("/profile", {
        company_name: companyName,
        company_description: companyDescription,
        naics_codes: naicsCodes,
        certifications: certifications,
        set_aside_eligible: setAsideEligible,
        core_competencies: coreCompetencies,
        elevator_pitch: elevatorPitch,
      });

      // Save SAM.gov API key if provided
      if (samApiKey.trim()) {
        localStorage.setItem("sam_api_key", samApiKey.trim());
      }

      // Mark onboarding as complete
      localStorage.setItem("onboarding_complete", "true");
      navigate("/discover", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    localStorage.setItem("onboarding_complete", "true");
    navigate("/discover", { replace: true });
  }

  return (
    <div style={page}>
      <div style={shell}>
        {/* Welcome Header */}
        <div style={welcomeCard}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
          <div style={{ fontWeight: 950, fontSize: 22 }}>
            Welcome to Sentri<span style={{ color: gold }}>BiD</span>
          </div>
          <div style={{ opacity: 0.7, fontSize: 14, marginTop: 6, maxWidth: 500, margin: "6px auto 0", lineHeight: 1.5 }}>
            Let's set up your business profile so our AI can match you with the best government contract opportunities, generate winning proposals, and find teaming partners.
          </div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 14 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                width: 32, height: 32, borderRadius: "50%",
                display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800,
                background: step >= s ? "rgba(122,63,255,.3)" : "rgba(255,255,255,.06)",
                border: step === s ? "2px solid rgba(122,63,255,.7)" : "1px solid rgba(255,255,255,.12)",
                color: step >= s ? "#fff" : "rgba(255,255,255,.3)",
              }}>{s}</div>
            ))}
          </div>
          <div style={{ fontSize: 11, opacity: 0.4, marginTop: 6 }}>
            {step === 1 ? "Company Basics" : step === 2 ? "Capabilities & Certifications" : "SAM.gov Connection"}
          </div>
        </div>

        {err && <div style={errBox}>{err}</div>}

        {/* Step 1: Company Basics */}
        {step === 1 && (
          <div style={{ ...card, marginTop: 14 }}>
            <div style={cardTitle}>🏢 Tell us about your company</div>
            <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
              This helps our AI write proposals in your voice and match you with relevant opportunities.
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={lbl}>Company Name *</label>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} style={input} placeholder="e.g. SENTRi LLC" />
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={lbl}>What does your company do?</label>
              <textarea value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} rows={3} style={{ ...input, resize: "vertical" as any }} placeholder="Brief description of your company's services and capabilities..." />
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={lbl}>Elevator Pitch</label>
              <textarea value={elevatorPitch} onChange={e => setElevatorPitch(e.target.value)} rows={2} style={{ ...input, resize: "vertical" as any }} placeholder="Your 30-second pitch — this goes into AI-generated proposals..." />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <button onClick={handleSkip} style={btnSkip}>Skip for now →</button>
              <button onClick={() => setStep(2)} style={btnNext} disabled={!companyName.trim()}>
                Next: Capabilities →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Capabilities & Certifications */}
        {step === 2 && (
          <div style={{ ...card, marginTop: 14 }}>
            <div style={cardTitle}>📜 Certifications & Capabilities</div>
            <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>
              NAICS codes and certifications are how the government categorizes contracts. The AI uses these to find matching opportunities automatically.
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={lbl}>NAICS Codes (comma-separated)</label>
              <input value={naicsCodes} onChange={e => setNaicsCodes(e.target.value)} style={input} placeholder="e.g. 541512, 541511, 541519" />
              <div style={hint}>These are the industry codes for your services. <a href="https://www.census.gov/naics/" target="_blank" rel="noreferrer" style={linkStyle}>Find your NAICS codes →</a></div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={lbl}>Certifications</label>
              <input value={certifications} onChange={e => setCertifications(e.target.value)} style={input} placeholder="e.g. 8(a), SDVOSB, HUBZone, WOSB" />
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={lbl}>Set-Aside Eligibility</label>
              <input value={setAsideEligible} onChange={e => setSetAsideEligible(e.target.value)} style={input} placeholder="e.g. Small Business, SDVOSB, 8(a)" />
              <div style={hint}>Set-asides give small businesses an advantage on certain contracts.</div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={lbl}>Core Competencies</label>
              <textarea value={coreCompetencies} onChange={e => setCoreCompetencies(e.target.value)} rows={3} style={{ ...input, resize: "vertical" as any }} placeholder="e.g. Cybersecurity, Cloud Migration, IT Support, Software Development..." />
              <div style={hint}>The AI uses these keywords to auto-scan SAM.gov for matching opportunities.</div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <button onClick={() => setStep(1)} style={btnSkip}>← Back</button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleSkip} style={btnSkip}>Skip →</button>
                <button onClick={() => setStep(3)} style={btnNext}>Next: SAM.gov →</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: SAM.gov API */}
        {step === 3 && (
          <div style={{ ...card, marginTop: 14 }}>
            <div style={cardTitle}>🔑 Connect to SAM.gov</div>
            <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
              SentriBiD searches SAM.gov for live contract opportunities. To access the SAM.gov API, you need a free API key from the government.
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={lbl}>SAM.gov API Key</label>
              <input
                value={samApiKey}
                onChange={e => setSamApiKey(e.target.value)}
                style={input}
                placeholder="Enter your SAM.gov API key..."
                type="password"
              />
            </div>

            <button onClick={() => setShowSamHelp(!showSamHelp)} style={{ ...btnSkip, marginTop: 10, fontSize: 12 }}>
              {showSamHelp ? "▾ Hide instructions" : "❓ How do I get a SAM.gov API key?"}
            </button>

            {showSamHelp && (
              <div style={helpBox}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8, color: gold }}>
                  How to Get Your Free SAM.gov API Key
                </div>
                <div style={stepItem}>
                  <span style={stepNum}>1</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Go to the SAM.gov API Registration page</div>
                    <a href="https://open.gsa.gov/api/sam-entity-management-api/" target="_blank" rel="noreferrer" style={linkStyle}>
                      https://open.gsa.gov →
                    </a>
                  </div>
                </div>
                <div style={stepItem}>
                  <span style={stepNum}>2</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Click "Get an API Key" or visit api.data.gov</div>
                    <a href="https://api.data.gov/signup/" target="_blank" rel="noreferrer" style={linkStyle}>
                      https://api.data.gov/signup/ →
                    </a>
                  </div>
                </div>
                <div style={stepItem}>
                  <span style={stepNum}>3</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Fill in your name and email</div>
                    <div style={{ opacity: 0.6, fontSize: 12 }}>Use your business email. The API key is sent instantly to your inbox.</div>
                  </div>
                </div>
                <div style={stepItem}>
                  <span style={stepNum}>4</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Check your email and copy the API key</div>
                    <div style={{ opacity: 0.6, fontSize: 12 }}>It looks like a long string of letters and numbers (e.g., aBcD1234eFgH5678...).</div>
                  </div>
                </div>
                <div style={stepItem}>
                  <span style={stepNum}>5</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Paste it above and you're connected!</div>
                    <div style={{ opacity: 0.6, fontSize: 12 }}>SentriBiD will use this key to search live federal opportunities on SAM.gov.</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(122,63,255,.08)", border: "1px solid rgba(122,63,255,.15)", fontSize: 12, lineHeight: 1.5 }}>
                  💡 <strong>Tip:</strong> The SAM.gov API is completely free. It's a public government service. You don't need a SAM registration or an entity to get the API key — just an email address.
                </div>
              </div>
            )}

            {!samApiKey.trim() && (
              <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 10, background: "rgba(255,185,56,.06)", border: "1px solid rgba(255,185,56,.15)", fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>
                ⚠️ Without a SAM.gov API key, you can still use SentriBiD — but SAM.gov search, Auto-Scan, and Subcontract Scout features won't find live opportunities. You can always add it later in your Profile.
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <button onClick={() => setStep(2)} style={btnSkip}>← Back</button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleSkip} style={btnSkip}>Skip →</button>
                <button onClick={saveProfile} disabled={saving} style={btnLaunch}>
                  {saving ? "Saving..." : "🚀 Complete Setup"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* What you get */}
        <div style={{ ...card, marginTop: 14, opacity: 0.7 }}>
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>Why does this matter?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
            <div style={featureItem}>🤖 <strong>Auto-Scan</strong> — AI finds matching opportunities using your NAICS codes</div>
            <div style={featureItem}>⚡ <strong>Autopilot</strong> — Upload an RFP, get a complete proposal in one click</div>
            <div style={featureItem}>🤝 <strong>Scout</strong> — Find prime contractors to team with based on your capabilities</div>
            <div style={featureItem}>⚔️ <strong>War Room</strong> — AI competitive analysis tailored to your strengths</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const gold = "rgba(215,182,109,.9)";
const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(1200px 800px at 20% 12%,rgba(122,63,255,.30),transparent 55%),radial-gradient(900px 650px at 78% 28%,rgba(255,185,56,.18),transparent 55%),linear-gradient(180deg,#060712,#0B1020)", color: "rgba(255,255,255,.92)", fontFamily: "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial" };
const shell: React.CSSProperties = { width: "min(620px,calc(100% - 48px))", margin: "0 auto", padding: "28px 0 60px" };
const welcomeCard: React.CSSProperties = { textAlign: "center", padding: "24px 16px", border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, background: "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03))", backdropFilter: "blur(16px)" };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, background: "rgba(255,255,255,.05)", padding: 18, backdropFilter: "blur(12px)" };
const cardTitle: React.CSSProperties = { fontWeight: 900, fontSize: 15, color: gold };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, opacity: 0.7, display: "block", marginBottom: 4 };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.06)", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" };
const hint: React.CSSProperties = { fontSize: 11, opacity: 0.5, marginTop: 4, lineHeight: 1.4 };
const linkStyle: React.CSSProperties = { color: "rgba(122,63,255,.85)", textDecoration: "underline" };
const btnSkip: React.CSSProperties = { border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: "8px 16px", background: "transparent", color: "rgba(255,255,255,.5)", fontWeight: 600, cursor: "pointer", fontSize: 12 };
const btnNext: React.CSSProperties = { border: "1px solid rgba(215,182,109,.35)", borderRadius: 12, padding: "10px 20px", background: "radial-gradient(420px 160px at 25% 20%,rgba(215,182,109,.18),transparent 60%),linear-gradient(135deg,rgba(122,63,255,.18),rgba(255,185,56,.10))", color: "rgba(255,255,255,.95)", fontWeight: 800, cursor: "pointer", fontSize: 13 };
const btnLaunch: React.CSSProperties = { border: "1px solid rgba(122,63,255,.5)", borderRadius: 14, padding: "12px 24px", background: "linear-gradient(135deg,rgba(122,63,255,.25),rgba(215,182,109,.15))", color: "#fff", fontWeight: 900, cursor: "pointer", fontSize: 14, boxShadow: "0 6px 20px rgba(122,63,255,.15)" };
const errBox: React.CSSProperties = { marginTop: 10, borderRadius: 14, border: "1px solid rgba(255,100,100,.22)", background: "rgba(255,90,90,.08)", padding: 12, color: "rgba(255,150,150,.9)", fontSize: 13 };
const helpBox: React.CSSProperties = { marginTop: 10, padding: 14, borderRadius: 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" };
const stepItem: React.CSSProperties = { display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, fontSize: 13, lineHeight: 1.4 };
const stepNum: React.CSSProperties = { minWidth: 24, height: 24, borderRadius: "50%", background: "rgba(122,63,255,.2)", border: "1px solid rgba(122,63,255,.3)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 };
const featureItem: React.CSSProperties = { padding: "6px 0", lineHeight: 1.4 };
