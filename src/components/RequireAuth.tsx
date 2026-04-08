// src/components/RequireAuth.tsx
import { Navigate } from "react-router-dom";
import { isAuthed } from "../lib/auth";

export default function RequireAuth({ children }: { children: JSX.Element }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return children;
}
