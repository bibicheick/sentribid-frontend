// src/pages/SAMSearchPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

type Opp = Record<string, any>;

export default function SAMSearchPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [naics, setNaics] = useState("");
  const [setAside, setSetAside] = useState("");
  const [agency, setAgency] = useState("");
  const [results, setResults] = useState<Opp[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [mode, setMode] = useState<"search" | "match">("search");

  async function doSearch() {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append("keyword", keyword);
      if (naics) params.append("naics", naics);
      if (setAside) params.append("set_aside", setAside);
      if (agency) params.append("agency", agency);
      params.append("limit", "25");
      const r = await api.get(`/discovery/sam/search?${params}`);
      if (r.data.error) { setErr(r.data.error); setResults([]); }
      else { setResults(r.data.opportunities || []); setTotal(r.data.total || 0); }
    } catch (e: any) { setErr(e?.response?.data?.detail || e.message); }
    finally { setLoading(false); }
  }

  async function doAutoMatch() {
    setMatchLoading(true);
    setErr(null);
    try {
      const r = await api.post("/discovery/sam/auto-match", { keyword, naics, limit: 15 });
      if (r.data.error) { setErr(r.data.error); setResults([]); }
      else { setResults(r.data.opportunities || []); setTotal(r.data.total || 0); setMode("match"); }
    } catch (e: any) { setErr(e?.response?.data?.detail || e.message); }
    finally { setMatchLoading(false); }
  }

  async function importOpp(opp: Opp) {
    setImporting(opp.sam_notice_id);
    try {
      const r = await api.post("/discovery/sam/import", { opportunity: opp });
      navigate(`/opportunities/${r.data.id}`);
    } catch (e: any) { setErr(e?.response?.data?.detail || "Import failed"); }
    finally { setImporting(null); }
  }

  return (
    <div style={page}>
      <div style={shell}>
        <div style={topBar}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 18 }}>🔍 SAM.gov Live Search</div>
            <div style={{ opacity: 0.6, fontSize: 12 }}>Search federal contract opportunities in real-time</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate("/discover")} style={btn}>← Discover</button>
            <button onClick={() => navigate("/pipeline")} style={btn}>Pipeline</button>
          </div>
        </div>

        {/* Search Filters */}
        <div style={{ ...card, marginTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={label}>Keyword</label>
              <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="e.g. cybersecurity, IT support" style={input} onKeyDown={e => e.key === "Enter" && doSearch()} />
            </div>
            <div>
              <label style={label}>NAICS Code</label>
              <input value={naics} onChange={e => setNaics(e.target.value)} placeholder="e.g. 541512" style={input} />
            </div>
            <div>
              <label style={label}>Set-Aside</label>
              <select value={setAside} onChange={e => setSetAside(e.target.value)} style={input}>
                <option value="">All</option>
                <option value="SBA">Small Business</option>
                <option value="8A">8(a)</option>
                <option value="SDVOSBC">SDVOSB</option>
                <option value="HZC">HUBZone</option>
                <option value="WOSB">WOSB</option>
              </select>
            </div>
            <div>
              <label style={label}>Agency</label>
              <input value={agency} onChange={e => setAgency(e.target.value)} placeholder="e.g. Department of Defense" style={input} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={doSearch} disabled={loading} style={btnPrimary}>
              {loading ? "Searching..." : "🔍 Search SAM.gov"}
            </button>
            <button onClick={doAutoMatch} disabled={matchLoading} style={{ ...btnPrimary, background: "linear-gradient(135deg, rgba(122,63,255,.3), rgba(0,212,255,.2))" }}>
              {matchLoading ? "Matching..." : "🧠 AI Auto-Match (uses your profile)"}
            </button>
          </div>
        </div>

        {err && <div style={errBox}>{err}</div>}

        {/* Results */}
        {results.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 8 }}>{total.toLocaleString()} results found</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {results.map((opp, i) => (
                <div key={opp.sam_notice_id || i} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontSize: 15 }}>{opp.title}</span>
                        {opp.fit_score != null && (
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
                            background: opp.fit_score >= 70 ? "rgba(40,180,76,.2)" : opp.fit_score >= 40 ? "rgba(243,156,18,.2)" : "rgba(231,76,60,.2)",
                            color: opp.fit_score >= 70 ? "#28b44c" : opp.fit_score >= 40 ? "#f39c12" : "#e74c3c",
                          }}>
                            {opp.fit_score}% match — {opp.recommendation}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                        {opp.agency_name} • {opp.naics_code} • {opp.type} • Posted: {opp.posted_date}
                      </div>
                      {opp.due_date && <div style={{ fontSize: 12, color: "#f39c12", marginTop: 2 }}>⏰ Due: {opp.due_date}</div>}
                      {opp.set_aside_description && <div style={{ fontSize: 11, color: "#9b59b6", marginTop: 2 }}>🏷️ {opp.set_aside_description}</div>}
                      {opp.solicitation_number && <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>Sol#: {opp.solicitation_number}</div>}
                      {opp.match_reasons?.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                          {opp.match_reasons.map((r: string, j: number) => (
                            <span key={j} style={{ fontSize: 10, background: "rgba(40,180,76,.12)", color: "#28b44c", padding: "2px 6px", borderRadius: 8, marginRight: 4 }}>✓ {r}</span>
                          ))}
                        </div>
                      )}
                      {opp.gaps?.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          {opp.gaps.map((g: string, j: number) => (
                            <span key={j} style={{ fontSize: 10, background: "rgba(231,76,60,.12)", color: "#e74c3c", padding: "2px 6px", borderRadius: 8, marginRight: 4 }}>⚠ {g}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <button onClick={() => importOpp(opp)} disabled={importing === opp.sam_notice_id} style={btnPrimary}>
                        {importing === opp.sam_notice_id ? "..." : "➕ Import"}
                      </button>
                      {opp.description_url && (
                        <a href={opp.description_url} target="_blank" rel="noreferrer" style={{ ...btn, textDecoration: "none", textAlign: "center", fontSize: 11 }}>View on SAM</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !matchLoading && results.length === 0 && (
          <div style={{ ...card, marginTop: 14, textAlign: "center", padding: 40, opacity: 0.5 }}>
            Search SAM.gov or use AI Auto-Match to find opportunities that fit your business profile.
          </div>
        )}
      </div>
    </div>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(1200px 800px at 20% 12%,rgba(122,63,255,.30),transparent 55%),radial-gradient(900px 650px at 78% 28%,rgba(255,185,56,.18),transparent 55%),linear-gradient(180deg,#060712,#0B1020)", color: "rgba(255,255,255,.92)", fontFamily: "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial" };
const shell: React.CSSProperties = { width: "min(1100px,calc(100% - 48px))", margin: "0 auto", padding: "28px 0 60px" };
const topBar: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, background: "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.04))", boxShadow: "0 14px 40px rgba(0,0,0,.45)" };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, background: "rgba(255,255,255,.05)", padding: 16, backdropFilter: "blur(12px)" };
const label: React.CSSProperties = { fontSize: 11, fontWeight: 700, opacity: 0.6, display: "block", marginBottom: 4 };
const input: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.06)", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" };
const btn: React.CSSProperties = { border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: "8px 14px", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.9)", fontWeight: 700, cursor: "pointer", fontSize: 12 };
const btnPrimary: React.CSSProperties = { ...btn, border: "1px solid rgba(215,182,109,.35)", background: "radial-gradient(420px 160px at 25% 20%,rgba(215,182,109,.18),transparent 60%),linear-gradient(135deg,rgba(122,63,255,.18),rgba(255,185,56,.10))" };
const errBox: React.CSSProperties = { marginTop: 14, borderRadius: 14, border: "1px solid rgba(255,100,100,.22)", background: "rgba(255,90,90,.08)", padding: 12, color: "rgba(255,150,150,.9)", fontSize: 13 };
