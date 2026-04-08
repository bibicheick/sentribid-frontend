import { api } from "./api";
import type { Bid } from "../types/bid";

export async function fetchBids(params?: {
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const res = await api.get<Bid[]>("/bids", { params });
  return res.data;
}
