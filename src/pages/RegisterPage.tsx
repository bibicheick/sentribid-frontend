// src/pages/RegisterPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function RegisterPage() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/register", {
        email,
        password,
        full_name: fullName,
        company_name: companyName,
      });

      // Auto-login with returned token
      const token = res.data?.access_token;
      if (token) {
        setToken(token);
        localStorage.setItem("token", token);
        // Mark as new user — send to onboarding
        localStorage.removeItem("onboarding_complete");
        nav("/onboarding", { replace: true });
      } else {
        // Fallback: no token returned, go to login
        nav("/login", { replace: true });
      }
    } catch (e: any) {
      let msg = e?.response?.data?.detail || e?.message || "Registration failed";
      if (typeof msg === "object") {
        try { msg = JSON.stringify(msg); } catch { msg = "Registration failed"; }
      }
      setErr(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <form onSubmit={onRegister} style={cardStyle}>
        <div style={{ fontWeight: 950, fontSize: 22, letterSpacing: "-0.03em" }}>
          Sentri<span style={{ color: "rgba(215,182,109,.9)" }}>BiD</span>
        </div>
        <div style={{ opacity: 0.72, marginTop: 6, fontSize: 13, color: "rgba(255,255,255,.75)" }}>
          Create your account
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={labelStyle}>Full Name *</div>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)}
            autoComplete="name" style={inputStyle} placeholder="Your full name" required />
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={labelStyle}>Email *</div>
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            type="email" autoComplete="email" style={inputStyle} placeholder="you@company.com" required />
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={labelStyle}>Company Name</div>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
            style={inputStyle} placeholder="Your company name" />
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={labelStyle}>Password *</div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password" style={inputStyle} placeholder="Min 6 characters" required minLength={6} />
        </div>

        {err ? <div style={errorStyle}>{err}</div> : null}

        <button disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <div style={{ marginTop: 14, textAlign: "center" }}>
          <span style={{ fontSize: 13, opacity: 0.6, color: "rgba(255,255,255,.72)" }}>
            Already have an account?{" "}
          </span>
          <span onClick={() => nav("/login")} style={{ fontSize: 13, color: "rgba(215,182,109,.9)", cursor: "pointer", fontWeight: 700 }}>
            Sign in
          </span>
        </div>
      </form>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh", display: "grid", placeItems: "center", padding: 24,
  background: "radial-gradient(1200px 800px at 15% 10%,rgba(120,88,255,.22),transparent 60%),radial-gradient(900px 650px at 80% 20%,rgba(0,212,255,.12),transparent 55%),radial-gradient(900px 800px at 60% 90%,rgba(215,182,109,.14),transparent 55%),linear-gradient(180deg,#070A12,#0B1020)",
};
const cardStyle: React.CSSProperties = {
  width: "min(420px, 100%)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18,
  padding: 18, boxShadow: "0 18px 60px rgba(0,0,0,.45)", background: "rgba(255,255,255,.06)", backdropFilter: "blur(16px)", color: "rgba(255,255,255,.92)",
};
const labelStyle: React.CSSProperties = { fontSize: 12, opacity: 0.75, marginBottom: 6, color: "rgba(255,255,255,.78)" };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(0,0,0,.20)", color: "rgba(255,255,255,.92)", outline: "none",
};
const errorStyle: React.CSSProperties = { marginTop: 12, color: "rgba(255,120,120,.95)", fontSize: 13 };
const btnStyle: React.CSSProperties = {
  marginTop: 14, width: "100%", padding: "12px 12px", borderRadius: 14,
  border: "1px solid rgba(215,182,109,.35)",
  background: "radial-gradient(420px 160px at 30% 20%,rgba(215,182,109,.22),transparent 60%),linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.06))",
  color: "rgba(255,255,255,.92)", fontWeight: 900, cursor: "pointer",
};
