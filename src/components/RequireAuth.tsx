import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthed } from "@/lib/auth";

export default function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation();
  if (!isAuthed()) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
}
