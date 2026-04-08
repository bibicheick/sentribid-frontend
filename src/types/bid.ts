export type Bid = {
  id: number;
  bid_code: string;
  contract_title: string;
  agency_name: string;
  agency_type: string;
  solicitation_number?: string | null;
  procurement_method?: string | null;
  contract_type: string;
  delivery_distance_miles?: number | null;
  deadline_date?: string | null; // ISO date
  urgency_level?: number | null;
  competition_level?: string | null;
  risk_level?: number | null;
  desired_profit_mode?: "conservative" | "balanced" | "aggressive" | string;
  min_acceptable_profit?: number | null;
  margin_override_pct?: number | null;
  status?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  notes?: string | null;
};
