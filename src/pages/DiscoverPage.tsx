// src/pages/DiscoverPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/auth";

type Opp = Record<string, any>;

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [opps, setOpps] = useState<Opp[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addAgency, setAddAgency] = useState("");
  const [addNaics, setAddNaics] = useState("");
  const [adding, setAdding] = useState(false);

  // Auto-scan state
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<Opp[] | null>(null);

  // User info
  const [userName, setUserName] = useState("");
  const [userCompany, setUserCompany] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  async function loadOpps() {
    try {
      setLoading(true); setErr(null);
      const r = await api.get("/opportunities");
      setOpps(r.data || []);
    } catch (e: any) { setErr(e?.response?.data?.detail || "Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadOpps(); loadUser(); }, []);

  async function loadUser() {
    try {
      const r = await api.get("/profile");
      setUserName(r.data?.company_name || "");
      setUserCompany(r.data?.company_name || "");
    } catch { }
    // Also try auth/me for the user's name
    try {
      const r = await api.get("/auth/me");
      if (r.data?.full_name) setUserName(r.data.full_name);
      if (r.data?.company_name) setUserCompany(r.data.company_name);
    } catch { }
  }

  function handleLogout() {
    clearToken();
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files; if (!fileList || fileList.length === 0) return;
    setUploading(true); setErr(null);
    try {
      const fd = new FormData();
      for (let i = 0; i < fileList.length; i++) {
        fd.append("files", fileList[i]);
      }
      fd.append("title", fileList[0].name.replace(/\.[^.]+$/, ""));
      fd.append("agency_name", "Unknown Agency");
      const r = await api.post("/opportunities/upload-and-analyze", fd, { headers: { "Content-Type": "multipart/form-data" } });
      if (r.data.opp_id) {
        navigate(`/opportunities/${r.data.opp_id}`);
      } else {
        loadOpps();
      }
    } catch (e: any) { setErr(e?.response?.data?.detail || "Upload failed"); }
    finally { setUploading(false); }
  }

  async function handleAdd() {
    if (!addTitle || !addAgency) return;
    setAdding(true);
    try {
      await api.post("/opportunities", { title: addTitle, agency_name: addAgency, naics_code: addNaics, source_type: "manual" });
      setShowAdd(false); setAddTitle(""); setAddAgency(""); setAddNaics("");
      loadOpps();
    } catch (e: any) { setErr(e?.response?.data?.detail || "Add failed"); }
    finally { setAdding(false); }
  }

  async function handleAutoScan() {
    setScanning(true); setErr(null); setScanResults(null);
    try {
      const r = await api.post("/discovery/auto-scan", { limit: 10 });
      setScanResults(r.data.opportunities || []);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Auto-Scan failed. Make sure your profile has NAICS codes.");
    }
    finally { setScanning(false); }
  }

  const filtered = opps.filter(o =>
    !search || o.title?.toLowerCase().includes(search.toLowerCase()) || o.agency_name?.toLowerCase().includes(search.toLowerCase()) || o.opp_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={page}>
      <div style={shell}>
        {/* Header */}
        <div style={topBar}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 18, letterSpacing: "-0.03em" }}>
              Sentri<span style={{ color: "rgba(215,182,109,.9)" }}>BiD</span>
              <span style={{ fontWeight: 400, fontSize: 13, opacity: 0.5, marginLeft: 8 }}>Discovery Hub</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => navigate("/autopilot")} style={btnAutopilot}>⚡ Autopilot</button>
            <button onClick={() => navigate("/sam-search")} style={btnGold}>🔍 SAM.gov</button>
            <button onClick={() => navigate("/subcontract-scout")} style={btnGold}>🤝 Scout</button>
            <button onClick={() => navigate("/pipeline")} style={btnGold}>📊 Pipeline</button>
            <button onClick={() => navigate("/bids")} style={btn}>🗂️ Bids</button>

            {/* User Menu */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ ...btn, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(122,63,255,.3)", border: "1px solid rgba(122,63,255,.4)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 900 }}>
                  {(userName || "U").charAt(0).toUpperCase()}
                </div>
                <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName || "Account"}</span>
                <span style={{ fontSize: 10, opacity: 0.5 }}>▾</span>
              </button>

              {showUserMenu && (
                <>
                  <div onClick={() => setShowUserMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
                  <div style={userMenu}>
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{userName || "User"}</div>
                      {userCompany && <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>{userCompany}</div>}
                    </div>
                    <button onClick={() => { setShowUserMenu(false); navigate("/profile"); }} style={menuItem}>👤 Profile</button>
                    <button onClick={() => { setShowUserMenu(false); handleLogout(); }} style={{ ...menuItem, color: "rgba(255,120,120,.9)" }}>🚪 Log out</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <div style={statBox}><span style={{ fontSize: 18, fontWeight: 900 }}>{opps.length}</span><span style={{ fontSize: 10, opacity: 0.5, marginLeft: 4 }}>Opps</span></div>
          <div style={statBox}><span style={{ fontSize: 18, fontWeight: 900 }}>{opps.filter(o => o.status === "analyzed").length}</span><span style={{ fontSize: 10, opacity: 0.5, marginLeft: 4 }}>Analyzed</span></div>
          <div style={statBox}><span style={{ fontSize: 18, fontWeight: 900 }}>{opps.filter(o => o.converted_bid_id).length}</span><span style={{ fontSize: 10, opacity: 0.5, marginLeft: 4 }}>Bids</span></div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...input, flex: 1, minWidth: 140 }} />
          <button onClick={handleAutoScan} disabled={scanning} style={btnAutoScan}>{scanning ? "⏳ Scanning..." : "🤖 Auto-Scan"}</button>
          <label style={btnPrimary}>{uploading ? "⏳..." : "📄 Upload RFP"}<input type="file" accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.csv,.rtf" multiple hidden onChange={handleUpload} /></label>
          <button onClick={() => setShowAdd(!showAdd)} style={btn}>{showAdd ? "✕" : "➕"}</button>
        </div>

        {showAdd && (
          <div style={{ ...card, marginTop: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
              <div><label style={lbl}>Title *</label><input value={addTitle} onChange={e => setAddTitle(e.target.value)} style={input} placeholder="Contract title" /></div>
              <div><label style={lbl}>Agency *</label><input value={addAgency} onChange={e => setAddAgency(e.target.value)} style={input} placeholder="Agency" /></div>
              <div><label style={lbl}>NAICS</label><input value={addNaics} onChange={e => setAddNaics(e.target.value)} style={input} placeholder="541512" /></div>
              <button onClick={handleAdd} disabled={adding} style={btnPrimary}>{adding ? "..." : "Add"}</button>
            </div>
          </div>
        )}

        {err && <div style={errBox}>{err}</div>}

        {/* Auto-Scan Results */}
        {scanResults && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: "rgba(122,63,255,.9)" }}>🤖 Auto-Scan Results ({scanResults.length})</div>
              <button onClick={() => setScanResults(null)} style={{ ...btn, fontSize: 11, padding: "4px 10px" }}>✕ Close</button>
            </div>
            {scanResults.length === 0 ? (
              <div style={{ ...card, textAlign: "center", padding: 20, opacity: 0.6 }}>No matching opportunities found. Update your profile NAICS codes.</div>
            ) : scanResults.map((opp, i) => (
              <div key={i} style={{ ...card, marginBottom: 6, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{opp.title}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{opp.agency_name} • {opp.naics_code || "N/A"}</div>
                    {opp.matched_by && <div style={{ fontSize: 10, color: "rgba(122,63,255,.8)", marginTop: 2 }}>Matched by: {opp.matched_by}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {opp.fit_score != null && <div style={{ fontSize: 14, fontWeight: 900, color: opp.fit_score >= 70 ? "#28b44c" : opp.fit_score >= 40 ? "#f39c12" : "#e74c3c" }}>{opp.fit_score}%</div>}
                    {opp.recommendation && <div style={{ fontSize: 10, opacity: 0.6 }}>{opp.recommendation}</div>}
                  </div>
                </div>
                {opp.suggested_action && <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>{opp.suggested_action}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Existing Opps List */}
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {loading ? <div style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>Loading...</div> :
           filtered.length === 0 ? (
            <div style={{ ...card, textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              <div style={{ fontWeight: 700 }}>No opportunities yet</div>
              <div style={{ opacity: 0.5, fontSize: 12, marginTop: 4 }}>Upload an RFP, add manually, or search SAM.gov</div>
            </div>
          ) : filtered.map(opp => (
            <div key={opp.id} onClick={() => navigate(`/opportunities/${opp.id}`)}
              style={{ ...card, cursor: "pointer", transition: "border-color .15s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(215,182,109,.3)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,.10)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{opp.title}</span>
                    <span style={statusBadge(opp.status)}>{opp.status}</span>
                    {opp.source === "sam.gov" && <span style={tagSam}>SAM</span>}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                    {opp.agency_name} {opp.naics_code && `• ${opp.naics_code}`} {opp.opp_code && `• ${opp.opp_code}`}
                  </div>
                  {opp.due_date && <div style={{ fontSize: 11, color: "#f39c12", marginTop: 2 }}>⏰ Due: {new Date(opp.due_date).toLocaleDateString()}</div>}
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {opp.ai_confidence_score && <span style={{ fontSize: 11, fontWeight: 800, color: opp.ai_confidence_score >= 70 ? "#28b44c" : "#f39c12" }}>{opp.ai_confidence_score}%</span>}
                  {opp.ai_bid_recommendation && <span style={recBadge(opp.ai_bid_recommendation)}>{opp.ai_bid_recommendation?.toUpperCase()}</span>}
                  <span style={{ fontSize: 16, opacity: 0.3 }}>→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function statusBadge(s: string): React.CSSProperties {
  const c: Record<string, string> = { new: "#3498db", reviewing: "#9b59b6", analyzed: "#28b44c", converted: "#f39c12", archived: "#95a5a6" };
  return { fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${c[s] || "#95a5a6"}22`, color: c[s] || "#95a5a6" };
}
function recBadge(r: string): React.CSSProperties {
  const c = r === "bid" ? "#28b44c" : r === "no_bid" ? "#e74c3c" : "#f39c12";
  return { fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: `${c}15`, color: c };
}
const tagSam: React.CSSProperties = { fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 8, background: "rgba(52,152,219,.15)", color: "#3498db" };
const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(1200px 800px at 20% 12%,rgba(122,63,255,.30),transparent 55%),radial-gradient(900px 650px at 78% 28%,rgba(255,185,56,.18),transparent 55%),linear-gradient(180deg,#060712,#0B1020)", color: "rgba(255,255,255,.92)", fontFamily: "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial" };
const shell: React.CSSProperties = { width: "min(1100px,calc(100% - 48px))", margin: "0 auto", padding: "28px 0 60px" };
const topBar: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, background: "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.04))", boxShadow: "0 14px 40px rgba(0,0,0,.45)", flexWrap: "wrap", gap: 10 };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, background: "rgba(255,255,255,.05)", padding: 14, backdropFilter: "blur(12px)" };
const statBox: React.CSSProperties = { padding: "8px 16px", borderRadius: 14, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", display: "flex", alignItems: "center" };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, opacity: 0.6, display: "block", marginBottom: 4 };
const input: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.06)", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" };
const btn: React.CSSProperties = { border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: "8px 14px", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.9)", fontWeight: 700, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" };
const btnPrimary: React.CSSProperties = { ...btn, border: "1px solid rgba(215,182,109,.35)", background: "radial-gradient(420px 160px at 25% 20%,rgba(215,182,109,.18),transparent 60%),linear-gradient(135deg,rgba(122,63,255,.18),rgba(255,185,56,.10))" };
const btnGold = btnPrimary;
const btnAutoScan: React.CSSProperties = { ...btn, border: "1px solid rgba(122,63,255,.4)", background: "radial-gradient(420px 160px at 25% 20%,rgba(122,63,255,.22),transparent 60%),linear-gradient(135deg,rgba(122,63,255,.12),rgba(0,212,255,.08))", color: "rgba(200,180,255,.95)" };
const btnAutopilot: React.CSSProperties = { ...btn, border: "1px solid rgba(122,63,255,.5)", background: "linear-gradient(135deg,rgba(122,63,255,.25),rgba(215,182,109,.12))", color: "#fff", fontWeight: 900, boxShadow: "0 4px 16px rgba(122,63,255,.15)" };
const errBox: React.CSSProperties = { marginTop: 10, borderRadius: 14, border: "1px solid rgba(255,100,100,.22)", background: "rgba(255,90,90,.08)", padding: 12, color: "rgba(255,150,150,.9)", fontSize: 13 };
const userMenu: React.CSSProperties = { position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 100, minWidth: 200, borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", background: "rgba(15,18,30,.95)", backdropFilter: "blur(20px)", boxShadow: "0 12px 40px rgba(0,0,0,.6)", overflow: "hidden" };
const menuItem: React.CSSProperties = { display: "block", width: "100%", padding: "10px 14px", border: "none", background: "transparent", color: "rgba(255,255,255,.85)", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" };
