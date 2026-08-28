import { Navigate, Route, Routes } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import AppLayout from "./components/AppLayout";
import { isAuthed } from "./lib/auth";

import LandingPage from "./pages/LandingPage";
import LegalPage from "./pages/LegalPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import OnboardingPage from "./pages/OnboardingPage";

import DashboardPage from "./pages/DashboardPage";
import FindWorkPage from "./pages/FindWorkPage";
import PipelinePage from "./pages/PipelinePage";
import BidsPage from "./pages/BidsPage";
import NewBidPage from "./pages/NewBidPage";
import BidDetailsPage from "./pages/BidDetailsPage";
import EditBidPage from "./pages/EditBidPage";
import OpportunityDetailPage from "./pages/OpportunityDetailPage";
import WarRoomPage from "./pages/WarRoomPage";
import SettingsPage from "./pages/SettingsPage";
import ExportPage from "./pages/ExportPage";

export default function App() {
  return (
    <Routes>
      {/* The marketing site for visitors; the app for people who are signed in.
          The check has to live INSIDE a component, not in this element prop:
          App doesn't re-render on navigation, so an inline isAuthed() call is
          frozen at whatever it returned on first paint — which sent people
          straight back to the landing page the moment they signed in. */}
      <Route path="/" element={<Home />} />

      {/* Signed out */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/privacy" element={<LegalPage page="privacy" />} />
      <Route path="/terms" element={<LegalPage page="terms" />} />

      {/* Signed in, but shown without the app shell */}
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/export/:versionId"
        element={
          <RequireAuth>
            <ExportPage />
          </RequireAuth>
        }
      />

      {/* The app itself */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/find-work" element={<FindWorkPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/bids" element={<BidsPage />} />
        <Route path="/bids/new" element={<NewBidPage />} />
        <Route path="/bids/:bidId" element={<BidDetailsPage />} />
        <Route path="/bids/:bidId/edit" element={<EditBidPage />} />
        <Route path="/opportunities/:oppId" element={<OpportunityDetailPage />} />
        <Route path="/war-room/:oppId" element={<WarRoomPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Old links keep working */}
      <Route path="/discover" element={<Navigate to="/find-work" replace />} />
      <Route path="/sam-search" element={<Navigate to="/find-work" replace />} />
      <Route path="/subcontract-scout" element={<Navigate to="/find-work?tab=partners" replace />} />
      <Route path="/autopilot" element={<Navigate to="/bids/new" replace />} />
      <Route path="/profile" element={<Navigate to="/settings" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** Signed in and asking for "/" — send them to the app, not the sales page.
 *  Read fresh on every render, so it follows the token instead of lagging it. */
function Home() {
  return isAuthed() ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}
