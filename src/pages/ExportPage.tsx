import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import {
  Alert,
  Button,
  Card,
  CardHeading,
  DescList,
  DescRow,
  Icon,
  SkeletonRows,
  Spinner,
} from "@/ui/kit";
import { money, percentLabel } from "@/lib/format";

type AnyObj = Record<string, any>;

export default function ExportPage() {
  const { versionId } = useParams();
  const [data, setData] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!versionId) return;
    setLoading(true);
    api
      .get(`/bids/versions/${versionId}`)
      .then((r) => setData(r.data))
      .catch((e) => setErr(e?.response?.data?.detail || "We couldn't load this version."))
      .finally(() => setLoading(false));
  }, [versionId]);

  useEffect(() => {
    if (!versionId) return;
    let url: string | null = null;
    setPdfLoading(true);
    api
      .get(`/bids/versions/${versionId}/export/pdf`, { responseType: "blob" })
      .then((r) => {
        url = URL.createObjectURL(new Blob([r.data], { type: "application/pdf" }));
        setPdfUrl(url);
      })
      .catch(() => setPdfUrl(null))
      .finally(() => setPdfLoading(false));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [versionId]);

  async function download(kind: "pdf" | "docx" | "csv") {
    setBusy(kind);
    try {
      const res = await api.get(`/bids/versions/${versionId}/export/${kind}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data?.bid_code ?? `version-${versionId}`}-proposal.${kind}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "That download didn't work.");
    } finally {
      setBusy(null);
    }
  }

  const totals = data?.totals ?? {};

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between px-5 sm:px-8">
          <Link to="/bids" className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
            Sentri<span className="text-brand-600">BiD</span>
          </Link>
          <Link
            to={data?.bid_id ? `/bids/${data.bid_id}` : "/bids"}
            className="inline-flex items-center gap-1 text-meta font-medium text-muted hover:text-body"
          >
            <Icon name="arrow_back" className="text-[16px]" />
            Back to the bid
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-content px-5 py-10 sm:px-8">
        {loading ? (
          <Card>
            <SkeletonRows rows={4} />
          </Card>
        ) : !data ? (
          <Alert>{err ?? "That version doesn't exist."}</Alert>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-h1">{data.contract_title ?? "Proposal"}</h1>
              <p className="mt-1.5 text-base text-muted">
                The approved version of this bid, ready to send. Version {data.version_no ?? "—"} ·{" "}
                {data.agency_name ?? "Agency not listed"}
              </p>
            </div>

            {err ? (
              <Alert className="mb-gap" onDismiss={() => setErr(null)}>
                {err}
              </Alert>
            ) : null}

            <div className="grid grid-cols-1 gap-gap lg:grid-cols-3">
              <Card padded={false} className="overflow-hidden lg:col-span-2">
                <div className="border-b border-line px-card py-4">
                  <h2 className="text-h2">Preview</h2>
                </div>
                {pdfLoading ? (
                  <div className="flex items-center justify-center gap-3 py-24 text-base text-muted">
                    <Spinner /> Building the preview…
                  </div>
                ) : pdfUrl ? (
                  <iframe
                    title="Proposal preview"
                    src={pdfUrl}
                    className="h-[720px] w-full border-0 bg-sunken"
                  />
                ) : (
                  <div className="px-card py-20 text-center text-base text-muted">
                    The preview didn't load. The downloads on the right still work.
                  </div>
                )}
              </Card>

              <div className="space-y-gap">
                <Card>
                  <CardHeading title="Download" />
                  <div className="mt-4 flex flex-col gap-2.5">
                    <Button
                      tone="primary"
                      icon="picture_as_pdf"
                      block
                      loading={busy === "pdf"}
                      onClick={() => download("pdf")}
                    >
                      PDF
                    </Button>
                    <Button
                      icon="description"
                      block
                      loading={busy === "docx"}
                      onClick={() => download("docx")}
                    >
                      Word document
                    </Button>
                    <Button
                      icon="calculate"
                      block
                      loading={busy === "csv"}
                      onClick={() => download("csv")}
                    >
                      Cost sheet (CSV)
                    </Button>
                  </div>
                </Card>

                <Card>
                  <CardHeading title="The numbers" />
                  <div className="mt-4">
                    <DescList>
                      <DescRow label="Bid code">
                        <span className="font-mono text-[12px]">{data.bid_code ?? "—"}</span>
                      </DescRow>
                      <DescRow label="Price">
                        <span className="font-semibold">{money(data.selected?.bid_price)}</span>
                      </DescRow>
                      <DescRow label="Margin">{percentLabel(data.selected?.margin_pct)}</DescRow>
                      <DescRow label="Profit">{money(data.selected?.profit_amount)}</DescRow>
                      <DescRow label="True cost">{money(totals.true_cost)}</DescRow>
                      <DescRow label="Adjusted cost">{money(totals.adjusted_cost)}</DescRow>
                    </DescList>
                  </div>
                </Card>

                {data.justification_text ? (
                  <Card>
                    <CardHeading title="Why this price" />
                    <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-body">
                      {data.justification_text}
                    </p>
                  </Card>
                ) : null}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
