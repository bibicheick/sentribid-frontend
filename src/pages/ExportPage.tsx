// src/pages/ExportPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";

type AnyObj = Record<string, any>;

export default function ExportPage() {
  const { versionId } = useParams();
  const [data, setData] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!versionId) return;
    setLoading(true);
    api.get(`/bids/versions/${versionId}`)
      .then((r) => setData(r.data))
      .catch((e) => setErr(e?.response?.data?.detail || "Failed to load version"))
      .finally(() => setLoading(false));
  }, [versionId]);

  // Load PDF preview as blob (sends auth header properly)
  useEffect(() => {
    if (!versionId) return;
    setPdfLoading(true);
    api.get(`/bids/versions/${versionId}/export/pdf`, { responseType: "blob" })
      .then((r) => {
        const blob = new Blob([r.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      })
      .catch(() => setPdfBlobUrl(null))
      .finally(() => setPdfLoading(false));
    return () => { if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl); };
  }, [versionId]);

  async function download(kind: "pdf" | "docx" | "csv") {
    try {
      const res = await api.get(`/bids/versions/${versionId}/export/${kind}`, { responseType: "blob" });
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const code = data?.bid_code || `version-${versionId}`;
      a.download = `${code}-proposal.${kind}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Download failed.";
      setErr(msg);
    }
  }

  if (loading) return <div style={{ ...pageStyle, display: "grid", placeItems: "center" }}><div style={{ opacity: 0.6 }}>Loading...</div></div>;
  if (!data) return <div style={{ ...pageStyle, display: "grid", placeItems: "center" }}><div>{err || "Not found"}</div></div>;

  const totals = data.totals || {};
  const selected = data.selected || {};

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        {/* Top Bar */}
        <div style={topBarStyle}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 16 }}>SentriBiD</div>
            <div style={{ opacity: 0.72, fontSize: 12 }}>Export Proposal — {data.bid_code}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to="/bids" style={{ ...btnStyle, textDecoration: "none" }}>Back</Link>
            <button onClick={() => download("pdf")} style={btnPrimaryStyle}>Download PDF</button>
            <button onClick={() => download("docx")} style={btnStyle}>Download DOCX</button>
            <button onClick={() => download("csv")} style={btnStyle}>Download CSV</button>
          </div>
        </div>

        {err && <div style={errStyle}>{err}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 14, marginTop: 14 }}>
          {/* Snapshot Summary */}
          <div style={cardStyle}>
            <div style={cardTitleStyle}>Snapshot Summary</div>
            {[
              ["Bid Code", data.bid_code],
              ["Version", data.version_no],
              ["Agency", data.agency_name],
              ["Contract", data.contract_title],
              ["Final Bid Price", `$${selected.bid_price?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}`],
              ["True Cost", `$${totals.true_cost?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}`],
              ["Profit", `$${selected.profit_amount?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || "0.00"}`],
            ].map(([k, v]) => (
              <div key={String(k)} style={rowStyle}>
                <span style={{ opacity: 0.7 }}>{k}</span>
                <b>{v}</b>
              </div>
            ))}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Justification</div>
              <div style={{ marginTop: 4, opacity: 0.8 }}>{data.justification_text || "—"}</div>
            </div>
          </div>

          {/* PDF Preview */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={cardTitleStyle}>PDF Preview</div>
              <button onClick={() => download("pdf")} style={{ ...btnStyle, padding: "8px 10px" }}>
                Download
              </button>
            </div>
            {pdfLoading ? (
              <div style={{ opacity: 0.5, padding: 20, textAlign: "center" }}>Loading preview...</div>
            ) : pdfBlobUrl ? (
              <iframe
                title="proposal-pdf"
                src={pdfBlobUrl}
                style={{
                  width: "100%", height: 500, border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 12, marginTop: 8, background: "white",
                }}
              />
            ) : (
              <div style={{ opacity: 0.5, padding: 20, textAlign: "center" }}>
                PDF preview unavailable. Click Download to get the file.
              </div>
            )}
          </div>
        </div>

        {/* Cost Breakdown */}
        <div style={{ ...cardStyle, marginTop: 14 }}>
          <div style={cardTitleStyle}>Cost Breakdown</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 8 }}>
            {Object.entries(totals).map(([k, v]) => (
              <div key={k} style={{
                padding: "10px 14px", borderRadius: 12,
                background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
              }}>
                <div style={{ fontSize: 11, opacity: 0.6, textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</div>
                <div style={{ fontWeight: 800, fontSize: 16, marginTop: 2 }}>
                  {typeof v === "number" ? `$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : String(v)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(1200px 800px at 20% 12%,rgba(122,63,255,.30),transparent 55%),radial-gradient(900px 650px at 78% 28%,rgba(255,185,56,.18),transparent 55%),radial-gradient(1000px 900px at 55% 90%,rgba(0,212,255,.12),transparent 60%),linear-gradient(180deg,#060712,#0B1020)",
  color: "rgba(255,255,255,.92)",
  fontFamily: "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial",
};
const shellStyle: React.CSSProperties = { width: "min(1100px,calc(100% - 48px))", margin: "0 auto", padding: "28px 0 60px" };
const topBarStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap",
  padding: "14px 16px", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18,
  background: "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.04))",
  boxShadow: "0 14px 40px rgba(0,0,0,.45)", backdropFilter: "blur(14px)",
};
const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, background: "rgba(255,255,255,.06)",
  boxShadow: "0 14px 40px rgba(0,0,0,.35)", backdropFilter: "blur(16px)", padding: 16,
};
const cardTitleStyle: React.CSSProperties = { fontWeight: 900, fontSize: 16, color: "rgba(215,182,109,.9)" };
const rowStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", padding: "8px 0",
  borderBottom: "1px solid rgba(255,255,255,.06)", fontSize: 14,
};
const btnStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)", borderRadius: 14, padding: "10px 14px",
  background: "linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.06))",
  color: "rgba(255,255,255,.92)", fontWeight: 700, cursor: "pointer", fontSize: 13,
};
const btnPrimaryStyle: React.CSSProperties = {
  border: "1px solid rgba(215,182,109,.40)", borderRadius: 14, padding: "10px 14px",
  background: "radial-gradient(420px 160px at 25% 20%,rgba(215,182,109,.20),transparent 60%),linear-gradient(135deg,rgba(122,63,255,.22),rgba(255,185,56,.12))",
  color: "rgba(255,255,255,.92)", fontWeight: 700, cursor: "pointer", fontSize: 13,
};
const errStyle: React.CSSProperties = {
  marginTop: 14, borderRadius: 18, border: "1px solid rgba(255,100,100,.22)",
  background: "rgba(255,90,90,.08)", padding: 14, color: "rgba(255,150,150,.9)",
};
