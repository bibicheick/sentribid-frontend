// src/pages/SubcontractScoutPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

type Award = Record<string, any>;
type Pitch = Record<string, any>;

export default function SubcontractScoutPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [awards, setAwards] = useState<Award[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [criteria, setCriteria] = useState<Record<string, any>>({});
  const [days, setDays] = useState(90);
  const [expandedPitch, setExpandedPitch] = useState<string | null>(null);

  async function runScout() {
    setLoading(true); setErr(""); setAwards([]); setPitches([]);
    try {
      const r = await api.get(`/discovery/subcontract-scout?days=${days}&limit=15`);
      setAwards(r.data.awards || []);
      setPitches(r.data.pitches || []);
      setCriteria(r.data.search_criteria || {});
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Scout failed. Ensure your profile has NAICS codes.");
    }
    finally { setLoading(false); }
  }

  function getPitch(recipientName: string): Pitch | undefined {
    return pitches.find(p => p.award_recipient === recipientName);
  }

  return (
    <div style={page}>
      <div style={shell}>
        {/* Header */}
        <div style={topBar}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 18 }}>
              🤝 Subcontract <span style={{ color: "rgba(215,182,109,.9)" }}>Scout</span>
            </div>
            <div style={{ opacity: 0.6, fontSize: 12 }}>
              Find prime contractors who just won contracts in your NAICS codes — and pitch to team with them.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate("/discover")} style={btn}>← Discover</button>
          </div>
        </div>

        {/* Controls */}
        <div style={{ ...card, marginTop: 12, display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
          <div>
            <label style={lbl}>Look back (days)</label>
            <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ ...input, width: 120 }}>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>
          <button onClick={runScout} disabled={loading} style={btnGold}>
            {loading ? "⏳ Scanning USAspending..." : "🚀 Run Scout"}
          </button>
        </div>

        {err && <div style={errBox}>{err}</div>}

        {criteria.naics_codes && (
          <div style={{ marginTop: 8, fontSize: 11, opacity: 0.5 }}>
            Searching NAICS: {criteria.naics_codes?.join(", ")} • Last {criteria.days_back} days
          </div>
        )}

        {/* Results */}
        {awards.length > 0 && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 14, opacity: 0.8 }}>{awards.length} Prime Awards Found</div>
            {awards.map((award, i) => {
              const pitch = getPitch(award.recipient);
              const isExpanded = expandedPitch === `${i}`;
              return (
                <div key={i} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "rgba(215,182,109,.95)" }}>{award.recipient || "Unknown Prime"}</div>
                      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{award.description || award.title || "Contract Award"}</div>
                      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>
                        {award.agency || "N/A"} • NAICS: {award.naics || "N/A"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", minWidth: 100 }}>
                      <div style={{ fontWeight: 900, fontSize: 16, color: "#28b44c" }}>
                        ${(award.amount || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 10, opacity: 0.5 }}>{award.start_date || ""}</div>
                    </div>
                  </div>

                  {/* Teaming pitch */}
                  {pitch && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        onClick={() => setExpandedPitch(isExpanded ? null : `${i}`)}
                        style={{ ...btn, fontSize: 11, padding: "4px 10px", background: "rgba(122,63,255,.12)", borderColor: "rgba(122,63,255,.3)" }}
                      >
                        {isExpanded ? "▾ Hide Pitch" : "✉️ View Teaming Pitch"}
                      </button>
                      {isExpanded && (
                        <div style={{ marginTop: 8, padding: 12, borderRadius: 12, background: "rgba(122,63,255,.06)", border: "1px solid rgba(122,63,255,.15)" }}>
                          <div style={{ fontWeight: 800, fontSize: 12, color: "rgba(122,63,255,.9)", marginBottom: 4 }}>
                            Subject: {pitch.pitch_subject || "Teaming Opportunity"}
                          </div>
                          <div style={{ fontSize: 12, lineHeight: 1.5, opacity: 0.85, whiteSpace: "pre-wrap" }}>{pitch.pitch_body}</div>
                          {pitch.key_selling_points && (
                            <div style={{ marginTop: 6, fontSize: 11, opacity: 0.6 }}>
                              Key points: {pitch.key_selling_points?.join(" • ")}
                            </div>
                          )}
                          <button
                            onClick={() => { navigator.clipboard.writeText(pitch.pitch_body || ""); }}
                            style={{ ...btn, marginTop: 8, fontSize: 11, padding: "4px 10px" }}
                          >
                            📋 Copy Pitch
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && awards.length === 0 && !err && (
          <div style={{ ...card, marginTop: 20, textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🤝</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Find Your Next Teaming Partner</div>
            <div style={{ opacity: 0.5, fontSize: 12, marginTop: 4, maxWidth: 400, margin: "4px auto 0" }}>
              Click "Run Scout" to scan USAspending.gov for companies that recently won prime contracts matching your NAICS codes. SentriBiD AI will generate teaming pitch emails for the top matches.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(1200px 800px at 20% 12%,rgba(122,63,255,.30),transparent 55%),radial-gradient(900px 650px at 78% 28%,rgba(255,185,56,.18),transparent 55%),linear-gradient(180deg,#060712,#0B1020)", color: "rgba(255,255,255,.92)", fontFamily: "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial" };
const shell: React.CSSProperties = { width: "min(1000px,calc(100% - 48px))", margin: "0 auto", padding: "28px 0 60px" };
const topBar: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, background: "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.04))", boxShadow: "0 14px 40px rgba(0,0,0,.45)", flexWrap: "wrap", gap: 10 };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, background: "rgba(255,255,255,.05)", padding: 14, backdropFilter: "blur(12px)" };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, opacity: 0.6, display: "block", marginBottom: 4 };
const input: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.06)", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" };
const btn: React.CSSProperties = { border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: "8px 14px", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.9)", fontWeight: 700, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" };
const btnGold: React.CSSProperties = { ...btn, border: "1px solid rgba(215,182,109,.35)", background: "radial-gradient(420px 160px at 25% 20%,rgba(215,182,109,.18),transparent 60%),linear-gradient(135deg,rgba(122,63,255,.18),rgba(255,185,56,.10))", padding: "10px 20px", fontSize: 13 };
const errBox: React.CSSProperties = { marginTop: 10, borderRadius: 14, border: "1px solid rgba(255,100,100,.22)", background: "rgba(255,90,90,.08)", padding: 12, color: "rgba(255,150,150,.9)", fontSize: 13 };
