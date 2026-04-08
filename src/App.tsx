// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import BidsPage from "./pages/BidsPage";
import NewBidPage from "./pages/NewBidPage";
import BidDetailsPage from "./pages/BidDetailsPage";
import ExportPage from "./pages/ExportPage";
import DiscoverPage from "./pages/DiscoverPage";
import OpportunityDetailPage from "./pages/OpportunityDetailPage";
import ProfilePage from "./pages/ProfilePage";
import SAMSearchPage from "./pages/SAMSearchPage";
import PipelinePage from "./pages/PipelinePage";
import WarRoomPage from "./pages/WarRoomPage";
import SubcontractScoutPage from "./pages/SubcontractScoutPage";
import AutopilotPage from "./pages/AutopilotPage";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Bids */}
      <Route path="/bids" element={<RequireAuth><BidsPage /></RequireAuth>} />
      <Route path="/bids/new" element={<RequireAuth><NewBidPage /></RequireAuth>} />
      <Route path="/bids/:bidId" element={<RequireAuth><BidDetailsPage /></RequireAuth>} />
      <Route path="/export/:versionId" element={<RequireAuth><ExportPage /></RequireAuth>} />

      {/* Discovery */}
      <Route path="/discover" element={<RequireAuth><DiscoverPage /></RequireAuth>} />
      <Route path="/opportunities/:oppId" element={<RequireAuth><OpportunityDetailPage /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />

      {/* SAM, Pipeline, War Room, Subcontract Scout */}
      <Route path="/sam-search" element={<RequireAuth><SAMSearchPage /></RequireAuth>} />
      <Route path="/pipeline" element={<RequireAuth><PipelinePage /></RequireAuth>} />
      <Route path="/war-room/:oppId" element={<RequireAuth><WarRoomPage /></RequireAuth>} />
      <Route path="/subcontract-scout" element={<RequireAuth><SubcontractScoutPage /></RequireAuth>} />
      <Route path="/autopilot" element={<RequireAuth><AutopilotPage /></RequireAuth>} />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/discover" replace />} />
      <Route path="*" element={<Navigate to="/discover" replace />} />
    </Routes>
  );
}
