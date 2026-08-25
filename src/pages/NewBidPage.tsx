import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import Page from "@/components/Page";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Icon,
  Input,
  LinkButton,
  Select,
  Spinner,
  cx,
} from "@/ui/kit";
import { fileSize, percentLabel, toPercent } from "@/lib/format";

type Step = 1 | 2 | 3;
type Result = Record<string, any> | null;

/** What the backend works through while the upload request is open. */
const WORK = [
  "Reading your documents",
  "Pulling out the requirements",
  "Checking what the agency asks for",
  "Sizing up the competition",
  "Building the pricing",
  "Drafting the proposal",
];

const STEP_LABELS: Record<Step, string> = {
  1: "Upload",
  2: "Review",
  3: "Price & send",
};

export default function NewBidPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [agency, setAgency] = useState("");
  const [format, setFormat] = useState("pdf");
  const [dragOver, setDragOver] = useState(false);

  const [running, setRunning] = useState(false);
  const [workIndex, setWorkIndex] = useState(0);
  const [result, setResult] = useState<Result>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setWorkIndex((i) => Math.min(i + 1, WORK.length - 1)), 9000);
    return () => clearInterval(t);
  }, [running]);

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const added = Array.from(list);
    setFiles((prev) => [...prev, ...added]);
    if (!title) setTitle(added[0].name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  }

  async function run() {
    if (files.length === 0) return;
    setRunning(true);
    setWorkIndex(0);
    setErr(null);
    setStep(2);

    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      fd.append("title", title || files[0].name);
      fd.append("agency_name", agency || "Unknown Agency");
      fd.append("format_type", format);

      const res = await api.post("/opportunities/autopilot-upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300_000,
      });
      setResult(res.data);
    } catch (e: any) {
      setErr(
        e?.response?.data?.detail ||
          "We couldn't finish reading those documents. Check the files and try again."
      );
      setStep(1);
    } finally {
      setRunning(false);
    }
  }

  return (
    <Page
      title="New Bid"
      summary="Upload the solicitation and we'll read it, pull out what the agency is asking for, and build the pricing around it."
      back={{ to: "/bids", label: "Back to My Bids" }}
    >
      <StepBar step={step} />

      {err ? (
        <Alert className="mx-auto mb-gap max-w-prose" onDismiss={() => setErr(null)}>
          {err}
        </Alert>
      ) : null}

      {step === 1 ? (
        <UploadStep
          files={files}
          setFiles={setFiles}
          title={title}
          setTitle={setTitle}
          agency={agency}
          setAgency={setAgency}
          format={format}
          setFormat={setFormat}
          dragOver={dragOver}
          setDragOver={setDragOver}
          fileRef={fileRef}
          addFiles={addFiles}
          onContinue={run}
        />
      ) : running ? (
        <WorkingStep index={workIndex} fileCount={files.length} />
      ) : result ? (
        <ReviewStep
          result={result}
          title={title}
          agency={agency}
          format={format}
          onBack={() => {
            setResult(null);
            setStep(1);
          }}
          onContinue={() => {
            setStep(3);
            if (result.bid_id) navigate(`/bids/${result.bid_id}`);
            else if (result.opp_id) navigate(`/opportunities/${result.opp_id}`);
          }}
        />
      ) : null}
    </Page>
  );
}

/* ── Step indicator ───────────────────────────────────────────────────── */

function StepBar({ step }: { step: Step }) {
  return (
    <div className="mx-auto mb-10 flex max-w-md items-start">
      {([1, 2, 3] as Step[]).map((n, i) => {
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} className="flex flex-1 items-start">
            <div className="flex flex-1 flex-col items-center">
              <span
                className={cx(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-meta font-semibold transition-colors",
                  done
                    ? "border-brand-600 bg-brand-600 text-white"
                    : active
                    ? "border-brand-600 bg-white text-brand-700"
                    : "border-line bg-sunken text-faint"
                )}
              >
                {done ? <Icon name="check" className="text-[16px]" /> : n}
              </span>
              <span
                className={cx(
                  "mt-2 text-meta font-medium",
                  done || active ? "text-brand-700" : "text-faint"
                )}
              >
                {STEP_LABELS[n]}
              </span>
            </div>
            {i < 2 ? (
              <span
                className={cx(
                  "mt-4 h-0.5 flex-1 rounded-full",
                  step > n ? "bg-brand-600" : "bg-line"
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* ── Step 1 ───────────────────────────────────────────────────────────── */

function UploadStep(props: {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  title: string;
  setTitle: (v: string) => void;
  agency: string;
  setAgency: (v: string) => void;
  format: string;
  setFormat: (v: string) => void;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  fileRef: React.RefObject<HTMLInputElement>;
  addFiles: (l: FileList | null) => void;
  onContinue: () => void;
}) {
  const {
    files,
    setFiles,
    title,
    setTitle,
    agency,
    setAgency,
    format,
    setFormat,
    dragOver,
    setDragOver,
    fileRef,
    addFiles,
    onContinue,
  } = props;

  return (
    <Card className="mx-auto max-w-prose">
      <h2 className="text-h2">Upload your RFP</h2>
      <p className="mt-1.5 text-base text-muted">
        Add the solicitation and anything that came with it — amendments, attachments, pricing
        sheets. We read all of them.
      </p>

      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
        }}
        className={cx(
          "mt-6 flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragOver ? "border-brand-600 bg-brand-50" : "border-line bg-raised hover:border-brand-300"
        )}
      >
        <Icon name="upload_file" className="text-[28px] text-faint" />
        <p className="mt-3 text-h3 text-ink">Drag files here</p>
        <p className="mt-1 text-meta text-muted">
          or click to browse — PDF, Word, Excel, CSV or text
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.rtf"
        onChange={(e) => {
          addFiles(e.target.files);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />

      {files.length > 0 ? (
        <ul className="mt-4 divide-y divide-line-soft rounded-control border border-line">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-4 py-3">
              <Icon name="draft" className="text-[20px] text-faint" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base text-ink">{f.name}</span>
                <span className="block text-meta text-muted">{fileSize(f.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                aria-label={`Remove ${f.name}`}
                className="text-faint transition-colors hover:text-bad-ink"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Contract title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="We'll fill this in from the filename"
          />
        </Field>
        <Field label="Agency">
          <Input
            value={agency}
            onChange={(e) => setAgency(e.target.value)}
            placeholder="Leave blank and we'll detect it"
          />
        </Field>
      </div>

      <Field label="Proposal format" className="mt-4 sm:max-w-[200px]">
        <Select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="pdf">PDF</option>
          <option value="docx">Word (.docx)</option>
        </Select>
      </Field>

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-line-soft pt-5">
        <LinkButton to="/bids" tone="ghost">
          Cancel
        </LinkButton>
        <Button tone="primary" size="lg" disabled={files.length === 0} onClick={onContinue}>
          Continue
        </Button>
      </div>

      {files.length === 0 ? (
        <p className="mt-3 text-right text-meta text-muted">Add at least one document to continue.</p>
      ) : null}
    </Card>
  );
}

/* ── Step 2, running ──────────────────────────────────────────────────── */

function WorkingStep({ index, fileCount }: { index: number; fileCount: number }) {
  return (
    <Card className="mx-auto max-w-prose">
      <div className="flex items-center gap-3">
        <Spinner className="text-brand-600" />
        <h2 className="text-h2">Reading your {fileCount === 1 ? "document" : "documents"}</h2>
      </div>
      <p className="mt-1.5 text-base text-muted">
        This usually takes a minute or two. You can leave this page open — we'll keep working.
      </p>

      <ol className="mt-6 space-y-3">
        {WORK.map((label, i) => {
          const done = i < index;
          const active = i === index;
          return (
            <li key={label} className="flex items-center gap-3">
              <span
                className={cx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                  done
                    ? "border-good-line bg-good-bg text-good-ink"
                    : active
                    ? "border-brand-200 bg-brand-50 text-brand-700"
                    : "border-line bg-sunken text-faint"
                )}
              >
                {done ? (
                  <Icon name="check" className="text-[14px]" />
                ) : active ? (
                  <Spinner className="h-3 w-3" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span
                className={cx(
                  "text-base",
                  done ? "text-muted" : active ? "font-medium text-ink" : "text-faint"
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/* ── Step 2, results ──────────────────────────────────────────────────── */

function ReviewStep({
  result,
  title,
  agency,
  format,
  onBack,
  onContinue,
}: {
  result: Record<string, any>;
  title: string;
  agency: string;
  format: string;
  onBack: () => void;
  onContinue: () => void;
}) {
  const analysis = result.analysis ?? {};
  const warRoom = result.war_room ?? {};
  const compliance = result.compliance ?? {};
  const errors: string[] = Array.isArray(result.errors) ? result.errors : [];

  const confidence = toPercent(analysis.confidence);
  const winProb = toPercent(warRoom.win_probability);
  const complianceScore = toPercent(compliance.score);
  const recommendsBid = String(analysis.recommendation ?? "").toLowerCase().includes("bid");

  const summaryText =
    analysis.summary ?? analysis.scope_summary ?? warRoom.bottom_line ?? null;

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-8 text-center">
        <h2 className="text-h1">Here's what we found</h2>
        <p className="mt-1.5 text-base text-muted">
          Have a read before we build your pricing. You can change any of it later.
        </p>
      </div>

      <div className="space-y-gap">
        <Card>
          <h3 className="text-h2">Contract summary</h3>
          <dl className="mt-5 divide-y divide-line-soft">
            <ReviewRow label="Agency">{analysis.agency ?? agency ?? "Not stated"}</ReviewRow>
            <ReviewRow label="Contract">{analysis.title ?? title ?? "Untitled"}</ReviewRow>
            {summaryText ? (
              <ReviewRow label="What they need">{summaryText}</ReviewRow>
            ) : null}
            {analysis.contract_type ? (
              <ReviewRow label="Contract type">{analysis.contract_type}</ReviewRow>
            ) : null}
            {analysis.due_date ? <ReviewRow label="Proposal due">{analysis.due_date}</ReviewRow> : null}
            {analysis.estimated_value ? (
              <ReviewRow label="Estimated value">{analysis.estimated_value}</ReviewRow>
            ) : null}
          </dl>
        </Card>

        <div className="grid grid-cols-1 gap-gap sm:grid-cols-3">
          <Card>
            <div className="text-meta text-muted">Our recommendation</div>
            <div
              className={cx(
                "mt-2 text-h2",
                recommendsBid ? "text-good-solid" : "text-warn-ink"
              )}
            >
              {recommendsBid ? "Worth bidding" : "Think carefully"}
            </div>
            {confidence !== null ? (
              <div className="mt-1 text-meta text-muted">
                {percentLabel(confidence)} confident
              </div>
            ) : null}
          </Card>
          <Card>
            <div className="text-meta text-muted">Win chance</div>
            <div className="mt-2 text-stat tnum text-ink">
              {winProb !== null ? percentLabel(winProb) : "—"}
            </div>
            <div className="mt-1 text-meta text-muted">Against likely competition</div>
          </Card>
          <Card>
            <div className="text-meta text-muted">Requirements covered</div>
            <div className="mt-2 text-stat tnum text-ink">
              {complianceScore !== null ? percentLabel(complianceScore) : "—"}
            </div>
            <div className="mt-1 text-meta text-muted">
              {compliance.gaps ? `${compliance.gaps} gaps to close` : "No gaps flagged"}
            </div>
          </Card>
        </div>

        {warRoom.bottom_line ? (
          <Card>
            <h3 className="text-h2">The short version</h3>
            <p className="mt-3 text-base leading-relaxed text-body">{warRoom.bottom_line}</p>
          </Card>
        ) : null}

        {errors.length > 0 ? (
          <Alert tone="warn" title="Some steps didn't finish">
            <ul className="mt-1 space-y-0.5">
              {errors.map((e, i) => (
                <li key={i}>· {e}</li>
              ))}
            </ul>
          </Alert>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-5">
        <Button tone="ghost" icon="arrow_back" onClick={onBack}>
          Start over
        </Button>
        <div className="flex flex-wrap gap-2.5">
          {result.has_proposal && result.proposal_download ? (
            <a
              href={`${api.defaults.baseURL ?? ""}${result.proposal_download}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-control border border-line bg-white px-5 text-base font-medium text-body shadow-card transition-colors hover:bg-raised"
            >
              <Icon name="download" className="text-[18px]" />
              Download proposal ({format.toUpperCase()})
            </a>
          ) : null}
          {result.opp_id ? (
            <LinkButton to={`/opportunities/${result.opp_id}`} size="lg">
              View opportunity
            </LinkButton>
          ) : null}
          <Button tone="primary" size="lg" onClick={onContinue}>
            Continue to pricing
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 first:pt-0 last:pb-0 md:grid-cols-3 md:gap-6">
      <dt className="text-meta text-muted">{label}</dt>
      <dd className="text-base text-ink md:col-span-2">{children}</dd>
    </div>
  );
}
