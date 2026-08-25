import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import AuthLayout from "@/components/AuthLayout";
import { Alert, Button, Field, Icon, Input } from "@/ui/kit";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErr(null);
    setTempPassword("");
    try {
      const res = await api.post("/auth/reset-password", { email });
      setTempPassword(res.data?.temporary_password ?? "");
    } catch (e: any) {
      setErr(
        e?.response?.data?.detail ||
          "We couldn't reset that. Check the email address is the one you registered with."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* the user can select it manually */
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      summary="We'll issue a temporary password you can sign in with."
      footer={
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      }
    >
      {tempPassword ? (
        <div className="space-y-5">
          <Alert tone="good" title="Here's your temporary password">
            Sign in with it now, then change it from Settings.
          </Alert>

          <div className="flex items-center gap-2 rounded-control border border-line bg-raised px-4 py-3">
            <code className="flex-1 select-all font-mono text-base text-ink">{tempPassword}</code>
            <Button size="sm" icon={copied ? "check" : "content_copy"} onClick={copy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <Button
            tone="primary"
            size="lg"
            block
            onClick={() => (window.location.href = "/login")}
          >
            Go to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {err ? <Alert onDismiss={() => setErr(null)}>{err}</Alert> : null}

          <Field label="Email address">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              autoFocus
              required
            />
          </Field>

          <Button type="submit" tone="primary" size="lg" block loading={loading}>
            Reset password
          </Button>

          <p className="flex items-start gap-2 text-meta text-muted">
            <Icon name="info" className="mt-px text-[16px] text-faint" />
            The temporary password appears on this screen — it isn't emailed to you.
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
