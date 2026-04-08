// src/pages/ProfilePage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

type Profile = Record<string, any>;

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);

  async function loadProfile() {
    try { const r = await api.get("/profile"); setProfile(r.data || {}); }
    catch { setProfile({}); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadProfile(); }, []);

  async function save() {
    setSaving(true); setErr(""); setMsg("");
    try {
      await api.put("/profile", profile);
      setMsg("Profile saved!");
      setTimeout(() => setMsg(""), 3000);
    } catch (e: any) { setErr(e?.response?.data?.detail || "Save failed"); }
    finally { setSaving(false); }
  }

  async function uploadCapStatement(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", f);
      const r = await api.post("/profile/capability-statement", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setProfile(prev => ({ ...prev, capability_statement_text: r.data.extracted_text || "Uploaded" }));
      setMsg("Capability statement uploaded!");
    } catch (e: any) { setErr("Upload failed"); }
    finally { setUploading(false); }
  }

  function u(field: string, val: any) { setProfile(prev => ({ ...prev, [field]: val })); }

  if (loading) return <div style={page}><div style={{ ...shell, display: "grid", placeItems: "center", minHeight: "60vh" }}><div style={{ opacity: 0.5 }}>Loading...</div></div></div>;

  return (
    <div style={page}>
      <div style={shell}>
        <div style={topBar}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 18 }}>👤 Business Profile</div>
            <div style={{ opacity: 0.6, fontSize: 12 }}>Used by AI for opportunity matching and proposal generation</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate("/discover")} style={btn}>← Discover</button>
            <button onClick={save} disabled={saving} style={btnGold}>{saving ? "Saving..." : "💾 Save"}</button>
          </div>
        </div>

        {msg && <div style={{ ...errBox, borderColor: "rgba(40,180,76,.3)", background: "rgba(40,180,76,.08)", color: "#28b44c" }}>{msg}</div>}
        {err && <div style={errBox}>{err}</div>}

        {/* Company Info */}
        <div style={{ ...card, marginTop: 14 }}>
          <div style={cardTitle}>🏢 Company Information</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <div><label style={lbl}>Company Name</label><input value={profile.company_name || ""} onChange={e => u("company_name", e.target.value)} style={input} /></div>
            <div><label style={lbl}>DUNS / UEI</label><input value={profile.duns_uei || ""} onChange={e => u("duns_uei", e.target.value)} style={input} /></div>
            <div><label style={lbl}>CAGE Code</label><input value={profile.cage_code || ""} onChange={e => u("cage_code", e.target.value)} style={input} /></div>
            <div><label style={lbl}>Website</label><input value={profile.website || ""} onChange={e => u("website", e.target.value)} style={input} /></div>
            <div><label style={lbl}>Annual Revenue</label>
              <select value={profile.annual_revenue || ""} onChange={e => u("annual_revenue", e.target.value)} style={input}>
                <option value="">Select...</option>
                <option value="under_1m">Under $1M</option><option value="1m_5m">$1M - $5M</option>
                <option value="5m_25m">$5M - $25M</option><option value="25m_100m">$25M - $100M</option>
                <option value="over_100m">Over $100M</option>
              </select>
            </div>
            <div><label style={lbl}>Employees</label>
              <select value={profile.employee_count || ""} onChange={e => u("employee_count", e.target.value)} style={input}>
                <option value="">Select...</option>
                <option value="1_10">1-10</option><option value="11_50">11-50</option>
                <option value="51_200">51-200</option><option value="201_500">201-500</option>
                <option value="500_plus">500+</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 10 }}><label style={lbl}>Company Description</label><textarea value={profile.company_description || ""} onChange={e => u("company_description", e.target.value)} rows={3} style={{ ...input, resize: "vertical" as any }} /></div>
          <div style={{ marginTop: 10 }}><label style={lbl}>Elevator Pitch</label><textarea value={profile.elevator_pitch || ""} onChange={e => u("elevator_pitch", e.target.value)} rows={2} style={{ ...input, resize: "vertical" as any }} placeholder="One paragraph pitch for proposals" /></div>
        </div>

        {/* Certifications */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={cardTitle}>📜 Certifications & Set-Asides</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <div><label style={lbl}>NAICS Codes (comma-separated)</label><input value={profile.naics_codes || ""} onChange={e => u("naics_codes", e.target.value)} style={input} placeholder="541512, 541511, 541519" /></div>
            <div><label style={lbl}>Certifications (comma-separated)</label><input value={profile.certifications || ""} onChange={e => u("certifications", e.target.value)} style={input} placeholder="8(a), SDVOSB, HUBZone" /></div>
            <div><label style={lbl}>Set-Aside Eligibility</label><input value={profile.set_aside_eligible || ""} onChange={e => u("set_aside_eligible", e.target.value)} style={input} placeholder="SBA, WOSB, SDVOSB" /></div>
            <div><label style={lbl}>Contract Vehicles</label><input value={profile.contract_vehicles || ""} onChange={e => u("contract_vehicles", e.target.value)} style={input} placeholder="GSA Schedule, SEWP V" /></div>
          </div>
        </div>

        {/* Capabilities */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={cardTitle}>💪 Capabilities & Differentiators</div>
          <div style={{ marginTop: 10 }}><label style={lbl}>Core Competencies</label><textarea value={profile.core_competencies || ""} onChange={e => u("core_competencies", e.target.value)} rows={3} style={{ ...input, resize: "vertical" as any }} placeholder="List your primary capabilities..." /></div>
          <div style={{ marginTop: 10 }}><label style={lbl}>Differentiators</label><textarea value={profile.differentiators || ""} onChange={e => u("differentiators", e.target.value)} rows={3} style={{ ...input, resize: "vertical" as any }} placeholder="What makes you unique in the market..." /></div>
          <div style={{ marginTop: 10 }}><label style={lbl}>Past Performance</label><textarea value={profile.past_performance || ""} onChange={e => u("past_performance", e.target.value)} rows={4} style={{ ...input, resize: "vertical" as any }} placeholder="Describe past contracts, agencies, values..." /></div>
          <div style={{ marginTop: 10 }}><label style={lbl}>Key Personnel</label><textarea value={profile.key_personnel || ""} onChange={e => u("key_personnel", e.target.value)} rows={3} style={{ ...input, resize: "vertical" as any }} placeholder="Key team members and qualifications..." /></div>
        </div>

        {/* Capability Statement */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={cardTitle}>📄 Capability Statement</div>
          <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
            <label style={btnGold}>
              {uploading ? "Uploading..." : "Upload PDF/DOCX"}
              <input type="file" accept=".pdf,.docx" hidden onChange={uploadCapStatement} />
            </label>
            {profile.capability_statement_text && <span style={{ fontSize: 12, color: "#28b44c" }}>✅ Statement uploaded ({profile.capability_statement_text.length} chars)</span>}
          </div>
        </div>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button onClick={save} disabled={saving} style={{ ...btnGold, padding: "14px 40px", fontSize: 14 }}>{saving ? "Saving..." : "💾 Save Profile"}</button>
        </div>
      </div>
    </div>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(1200px 800px at 20% 12%,rgba(122,63,255,.30),transparent 55%),radial-gradient(900px 650px at 78% 28%,rgba(255,185,56,.18),transparent 55%),linear-gradient(180deg,#060712,#0B1020)", color: "rgba(255,255,255,.92)", fontFamily: "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial" };
const shell: React.CSSProperties = { width: "min(800px,calc(100% - 48px))", margin: "0 auto", padding: "28px 0 60px" };
const topBar: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, background: "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.04))", boxShadow: "0 14px 40px rgba(0,0,0,.45)", flexWrap: "wrap", gap: 10 };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, background: "rgba(255,255,255,.05)", padding: 16, backdropFilter: "blur(12px)" };
const cardTitle: React.CSSProperties = { fontWeight: 900, fontSize: 14, color: "rgba(215,182,109,.9)" };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, opacity: 0.6, display: "block", marginBottom: 4 };
const input: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.06)", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" };
const btn: React.CSSProperties = { border: "1px solid rgba(255,255,255,.14)", borderRadius: 12, padding: "8px 14px", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.9)", fontWeight: 700, cursor: "pointer", fontSize: 12 };
const btnGold: React.CSSProperties = { ...btn, border: "1px solid rgba(215,182,109,.35)", background: "radial-gradient(420px 160px at 25% 20%,rgba(215,182,109,.18),transparent 60%),linear-gradient(135deg,rgba(122,63,255,.18),rgba(255,185,56,.10))" };
const errBox: React.CSSProperties = { marginTop: 10, borderRadius: 14, border: "1px solid rgba(255,100,100,.22)", background: "rgba(255,90,90,.08)", padding: 12, color: "rgba(255,150,150,.9)", fontSize: 13 };
