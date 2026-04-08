import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

type BidCreate = {
  contract_title: string;
  agency_name: string;
  agency_type: string;
  solicitation_number?: string;
  procurement_method?: string;
  contract_type: string;
  delivery_distance_miles: number;
  deadline_date: string; // YYYY-MM-DD
  urgency_level: number;
  competition_level: string;
  risk_level: number;
  desired_profit_mode: "conservative" | "balanced" | "aggressive";
  min_acceptable_profit: number;
  margin_override_pct: number;
  notes?: string;
};

const todayPlus = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export default function NewBidPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<BidCreate>({
    contract_title: "",
    agency_name: "",
    agency_type: "Federal",
    solicitation_number: "",
    procurement_method: "IFB",
    contract_type: "Supply",
    delivery_distance_miles: 0,
    deadline_date: todayPlus(7),
    urgency_level: 3,
    competition_level: "Medium",
    risk_level: 3,
    desired_profit_mode: "balanced",
    min_acceptable_profit: 0,
    margin_override_pct: 0,
    notes: "",
  });

  function set<K extends keyof BidCreate>(k: K, v: BidCreate[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api.post("/bids", form);
      const bidId = res.data?.id;
      if (!bidId) throw new Error("Backend did not return bid id.");
      nav(`/bids/${bidId}`);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || e?.message || "Failed to create bid");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        <div style={topBarStyle}>
          <div>
            <div style={brandStyle}>SentriBiD</div>
            <div style={subStyle}>Create New Bid</div>
          </div>
          <button onClick={() => nav("/bids")} style={btnGhostStyle}>Back</button>
        </div>

        <form onSubmit={onCreate} style={cardStyle}>
          <div style={titleStyle}>New Bid</div>
          <div style={mutedStyle}>Fill the basics. You can add items/labor after.</div>

          {err ? (
            <div style={alertStyle}>
              <b>Error</b>
              <div style={{ marginTop: 6 }}>{err}</div>
            </div>
          ) : null}

          <div style={gridStyle}>
            <Field label="Contract title">
              <input value={form.contract_title} onChange={(e) => set("contract_title", e.target.value)} style={inputStyle} required />
            </Field>

            <Field label="Agency name">
              <input value={form.agency_name} onChange={(e) => set("agency_name", e.target.value)} style={inputStyle} required />
            </Field>

            <Field label="Agency type">
              <select value={form.agency_type} onChange={(e) => set("agency_type", e.target.value)} style={inputStyle}>
                <option>Federal</option>
                <option>State</option>
                <option>Local</option>
                <option>Commercial</option>
              </select>
            </Field>

            <Field label="Contract type">
              <select value={form.contract_type} onChange={(e) => set("contract_type", e.target.value)} style={inputStyle}>
                <option>Supply</option>
                <option>Service</option>
                <option>Construction</option>
                <option>IT</option>
              </select>
            </Field>

            <Field label="Deadline (YYYY-MM-DD)">
              <input type="date" value={form.deadline_date} onChange={(e) => set("deadline_date", e.target.value)} style={inputStyle} />
            </Field>

            <Field label="Delivery miles">
              <input type="number" value={form.delivery_distance_miles} onChange={(e) => set("delivery_distance_miles", Number(e.target.value))} style={inputStyle} />
            </Field>

            <Field label="Risk level (1-5)">
              <input type="number" min={1} max={5} value={form.risk_level} onChange={(e) => set("risk_level", Number(e.target.value))} style={inputStyle} />
            </Field>

            <Field label="Profit mode">
              <select value={form.desired_profit_mode} onChange={(e) => set("desired_profit_mode", e.target.value as any)} style={inputStyle}>
                <option value="conservative">Conservative</option>
                <option value="balanced">Balanced</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </Field>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
            <button type="button" onClick={() => nav("/bids")} style={btnGhostStyle}>Cancel</button>
            <button disabled={loading} style={btnPrimaryStyle}>
              {loading ? "Creating..." : "Create Bid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

/* Styling (same Apple + Afro Royal vibe) */
const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(1200px 800px at 15% 10%, rgba(120,88,255,.22), transparent 60%)," +
    "radial-gradient(900px 650px at 80% 20%, rgba(0,212,255,.12), transparent 55%)," +
    "radial-gradient(900px 800px at 60% 90%, rgba(215,182,109,.14), transparent 55%)," +
    "linear-gradient(180deg, #070A12, #0B1020)",
  color: "rgba(255,255,255,.92)",
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
};
const shellStyle: React.CSSProperties = { width: "min(1100px, calc(100% - 48px))", margin: "0 auto", padding: "26px 0 44px" };
const topBarStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
  padding: "14px 16px", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18,
  background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))",
  boxShadow: "0 14px 40px rgba(0,0,0,.45)", backdropFilter: "blur(14px)",
};
const brandStyle: React.CSSProperties = { fontWeight: 900, letterSpacing: ".3px" };
const subStyle: React.CSSProperties = { fontSize: 12, opacity: 0.7, marginTop: 2 };

const cardStyle: React.CSSProperties = {
  marginTop: 14, border: "1px solid rgba(255,255,255,.12)", borderRadius: 18,
  background: "rgba(255,255,255,.06)", boxShadow: "0 14px 40px rgba(0,0,0,.35)",
  backdropFilter: "blur(16px)", padding: 16,
};
const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 900 };
const mutedStyle: React.CSSProperties = { marginTop: 6, fontSize: 13, opacity: 0.75 };

const gridStyle: React.CSSProperties = { marginTop: 14, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 14,
  border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.18)",
  color: "rgba(255,255,255,.92)", outline: "none",
};

const btnBase: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)", borderRadius: 14, padding: "10px 12px",
  background: "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.06))",
  color: "rgba(255,255,255,.92)", fontWeight: 800, cursor: "pointer",
};
const btnPrimaryStyle: React.CSSProperties = {
  ...btnBase,
  border: "1px solid rgba(215,182,109,.35)",
  background:
    "radial-gradient(400px 160px at 30% 20%, rgba(215,182,109,.22), transparent 60%)," +
    "linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06))",
};
const btnGhostStyle: React.CSSProperties = { ...btnBase, background: "transparent" };

const alertStyle: React.CSSProperties = {
  marginTop: 14, borderRadius: 18, border: "1px solid rgba(255,120,120,.22)",
  background: "rgba(255,90,90,.08)", padding: 14,
};
