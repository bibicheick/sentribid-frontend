// src/pages/RegisterPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await api.post("/auth/register", { email, password, full_name: fullName, company_name: companyName });
      // Auto-login after register
      const r = await api.post("/auth/login", { username: email, password });
      localStorage.setItem("token", r.data.access_token);
      navigate("/discover");
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  }

  return (
    <div style={page}>
      <div style={box}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontWeight: 950, fontSize: 22, letterSpacing: "-0.03em" }}>Sentri<span style={{ color: "rgba(215,182,109,.9)" }}>BiD</span></div>
          <div style={{ opacity: 0.5, fontSize: 12 }}>Create your account</div>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={label}>Full Name</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} required style={input} placeholder="Kiswendsida Dondasse" />
          <label style={{ ...label, marginTop: 12 }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required style={input} placeholder="you@company.com" />
          <label style={{ ...label, marginTop: 12 }}>Company Name</label>
          <input value={companyName} onChange={e => setCompanyName(e.target.value)} style={input} placeholder="SENTRi LLC" />
          <label style={{ ...label, marginTop: 12 }}>Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required style={input} placeholder="••••••••" />
          {err && <div style={{ color: "#e74c3c", fontSize: 12, marginTop: 8 }}>{err}</div>}
          <button type="submit" disabled={loading} style={btnPrimary}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, opacity: 0.6 }}>
          Already have an account? <Link to="/login" style={{ color: "rgba(215,182,109,.9)" }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", display: "grid", placeItems: "center", background: "radial-gradient(1200px 800px at 20% 12%,rgba(122,63,255,.30),transparent 55%),linear-gradient(180deg,#060712,#0B1020)", color: "rgba(255,255,255,.92)", fontFamily: "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial" };
const box: React.CSSProperties = { width: "min(400px, calc(100% - 48px))", padding: 32, borderRadius: 20, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", backdropFilter: "blur(20px)" };
const label: React.CSSProperties = { fontSize: 11, fontWeight: 700, opacity: 0.6, display: "block", marginBottom: 4 };
const input: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.06)", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box" };
const btnPrimary: React.CSSProperties = { width: "100%", marginTop: 20, padding: "12px 0", borderRadius: 12, border: "1px solid rgba(215,182,109,.35)", background: "linear-gradient(135deg,rgba(122,63,255,.18),rgba(255,185,56,.10))", color: "white", fontWeight: 800, cursor: "pointer", fontSize: 14 };
