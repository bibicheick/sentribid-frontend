import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import AuthLayout from "@/components/AuthLayout";
import { Alert, Button, Field, Icon, Input } from "@/ui/kit";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      const token = res.data?.access_token;
      if (!token) throw new Error("The server didn't send back a session. Try again.");
      setToken(token);
      navigate(from, { replace: true });
    } catch (e: any) {
      const detail = e?.response?.data?.detail ?? e?.message;
      setErr(
        e?.response?.status === 401
          ? "That username and password don't match. Check both and try again."
          : typeof detail === "string"
          ? detail
          : "We couldn't sign you in. Try again in a moment."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      summary="Pick up where you left off."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        {err ? <Alert onDismiss={() => setErr(null)}>{err}</Alert> : null}

        <Field label="Username or email">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </Field>

        <Field label="Password">
          <div className="relative">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-faint transition-colors hover:text-body"
            >
              <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-[18px]" />
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-meta font-medium text-brand-600 hover:text-brand-700"
          >
            Forgot your password?
          </Link>
        </div>

        <Button type="submit" tone="primary" size="lg" block loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
