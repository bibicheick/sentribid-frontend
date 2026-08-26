import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import AuthLayout, { AUTH_BACKDROPS } from "@/components/AuthLayout";
import { Alert, Button, Field, Input } from "@/ui/kit";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tooShort = password.length > 0 && password.length < 8;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (tooShort) return;
    setErr(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        email,
        password,
        full_name: fullName,
        company_name: companyName,
      });
      const token = res.data?.access_token;
      if (token) {
        setToken(token);
        localStorage.removeItem("onboarding_complete");
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    } catch (e: any) {
      const detail = e?.response?.data?.detail ?? e?.message;
      setErr(typeof detail === "string" ? detail : "We couldn't create that account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      summary="Two minutes to set up. No card needed."
      backdrop={AUTH_BACKDROPS.street}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        {err ? <Alert onDismiss={() => setErr(null)}>{err}</Alert> : null}

        <Field label="Your name">
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            autoFocus
            required
          />
        </Field>

        <Field label="Company name">
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            autoComplete="organization"
            required
          />
        </Field>

        <Field label="Work email">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </Field>

        <Field
          label="Password"
          hint={tooShort ? undefined : "At least 8 characters."}
          error={tooShort ? "Use at least 8 characters." : undefined}
        >
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </Field>

        <Button type="submit" tone="primary" size="lg" block loading={loading}>
          Create account
        </Button>

        <p className="text-center text-meta leading-relaxed text-muted">
          By creating an account you agree to our{" "}
          <Link to="/terms" className="underline hover:text-body">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline hover:text-body">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AuthLayout>
  );
}
