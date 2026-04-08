// src/pages/ForgotPasswordPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function ForgotPasswordPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setErr(""); setTempPassword("");
    try {
      const res = await api.post("/auth/reset-password", { email });
      setTempPassword(res.data.temporary_password);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Reset failed. Check that the email is registered.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <form onSubmit={handleReset} style={cardStyle}>
        <div style={{ fontWeight: 950, fontSize: 22, letterSpacing: "-0.03em" }}>
          Sentri<span style={{ color: "rgba(215,182,109,.9)" }}>BiD</span>
        </div>
        <div style={{ opacity: 0.72, marginTop: 6, fontSize: 13, color: "rgba(255,255,255,.75)" }}>
          Reset your password. A temporary password will be shown on screen.
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={labelStyle}>Email Address</div>
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            type="email" placeholder="you@example.com" autoComplete="email" style={inputStyle} />
        </div>

        {err && <div style={errorStyle}>{err}</div>}

        {tempPassword && (
          <div style={successBox}>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>Password Reset!</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Your temporary password:</div>
            <div style={{
              marginTop: 6, padding: "10px 14px", borderRadius: 10,
              background: "rgba(0,0,0,.3)", fontFamily: "monospace", fontSize: 16,
              fontWeight: 900, letterSpacing: "0.05em", color: "rgba(215,182,109,1)",
              userSelect: "all", textAlign: "center",
            }}>
              {tempPassword}
            </div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>
              Copy this password and use it to log in. Change it after logging in.
            </div>
          </div>
        )}

        {!tempPassword && (
          <button disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        )}

        {tempPassword && (
          <button type="button" onClick={() => nav("/login")} style={btnStyle}>
            Go to Login
          </button>
        )}

        <div style={{ marginTop: 14, textAlign: "center" }}>
          <span onClick={() => nav("/login")} style={{ fontSize: 13, color: "rgba(122,63,255,.8)", cursor: "pointer", fontWeight: 600 }}>
            ← Back to Login
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
const successBox: React.CSSProperties = {
  marginTop: 14, padding: 14, borderRadius: 14,
  border: "1px solid rgba(40,180,76,.3)", background: "rgba(40,180,76,.08)", color: "rgba(255,255,255,.92)",
};
const btnStyle: React.CSSProperties = {
  marginTop: 14, width: "100%", padding: "12px 12px", borderRadius: 14,
  border: "1px solid rgba(215,182,109,.35)",
  background: "radial-gradient(420px 160px at 30% 20%,rgba(215,182,109,.22),transparent 60%),linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.06))",
  color: "rgba(255,255,255,.92)", fontWeight: 900, cursor: "pointer",
};
