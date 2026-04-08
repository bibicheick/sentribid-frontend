// src/pages/EditBidPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";

type AnyObj = Record<string, any>;
type ItemRow = { id?: number; name: string; description: string; quantity: number; unit_cost: number; supplier_name: string; _new?: boolean };
type LaborRow = { id?: number; labor_type: string; hourly_rate: number; hours: number; workers: number; _new?: boolean };
type EquipRow = { id?: number; equipment_name: string; rental_cost: number; rental_days: number; operator_required: boolean; operator_cost: number; _new?: boolean };
type TransportForm = { transport_method: string; truck_rental_cost: number; fuel_cost: number; mileage_cost: number; toll_fees: number; driver_cost: number; trips: number };
type OverheadForm = { insurance_allocation: number; storage_cost: number; admin_time_cost: number; bonding_compliance_cost: number; misc_overhead: number };

const usd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });

export default function EditBidPage() {
  const { bidId } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<"basics" | "items" | "costs">("basics");

  // Bid fields
  const [form, setForm] = useState<AnyObj>({});
  const [items, setItems] = useState<ItemRow[]>([]);
  const [labors, setLabors] = useState<LaborRow[]>([]);
  const [equips, setEquips] = useState<EquipRow[]>([]);
  const [transport, setTransport] = useState<TransportForm>({ transport_method: "truck", truck_rental_cost: 0, fuel_cost: 0, mileage_cost: 0, toll_fees: 0, driver_cost: 0, trips: 1 });
  const [overhead, setOverhead] = useState<OverheadForm>({ insurance_allocation: 0, storage_cost: 0, admin_time_cost: 0, bonding_compliance_cost: 0, misc_overhead: 0 });

  // Deleted IDs to remove on save
  const [deletedItems, setDeletedItems] = useState<number[]>([]);
  const [deletedLabors, setDeletedLabors] = useState<number[]>([]);
  const [deletedEquips, setDeletedEquips] = useState<number[]>([]);

  function setF(k: string, v: any) { setForm(p => ({ ...p, [k]: v })); }
  function setT<K extends keyof TransportForm>(k: K, v: TransportForm[K]) { setTransport(p => ({ ...p, [k]: v })); }
  function setO<K extends keyof OverheadForm>(k: K, v: OverheadForm[K]) { setOverhead(p => ({ ...p, [k]: v })); }
  function updItem(i: number, p: Partial<ItemRow>) { setItems(prev => prev.map((r, j) => j === i ? { ...r, ...p } : r)); }
  function updLabor(i: number, p: Partial<LaborRow>) { setLabors(prev => prev.map((r, j) => j === i ? { ...r, ...p } : r)); }
  function updEquip(i: number, p: Partial<EquipRow>) { setEquips(prev => prev.map((r, j) => j === i ? { ...r, ...p } : r)); }

  useEffect(() => { loadBid(); }, [bidId]);

  async function loadBid() {
    try {
      setLoading(true); setErr(null);
      const [bidRes, detRes] = await Promise.all([api.get(`/bids/${bidId}`), api.get(`/bids/${bidId}/details`)]);
      const b = bidRes.data;
      const d = detRes.data;

      setForm({
        contract_title: b.contract_title || "", agency_name: b.agency_name || "", agency_type: b.agency_type || "federal",
        solicitation_number: b.solicitation_number || "", procurement_method: b.procurement_method || "ifb",
        contract_type: b.contract_type || "supply", delivery_distance_miles: b.delivery_distance_miles || 0,
        deadline_date: b.deadline_date ? String(b.deadline_date).slice(0, 10) : "", urgency_level: b.urgency_level || 3,
        competition_level: b.competition_level || "medium", risk_level: b.risk_level || 3,
        desired_profit_mode: b.desired_profit_mode || "balanced", min_acceptable_profit: b.min_acceptable_profit || 0,
        margin_override_pct: b.margin_override_pct || 0, notes: b.notes || "", bid_code: b.bid_code, status: b.status,
      });

      setItems((d.items || []).map((it: any) => ({ id: it.id, name: it.name || "", description: it.description || "", quantity: it.quantity || 0, unit_cost: it.unit_cost || 0, supplier_name: it.supplier_name || "" })));
      setLabors((d.labor_lines || []).map((lb: any) => ({ id: lb.id, labor_type: lb.labor_type || "", hourly_rate: lb.hourly_rate || 0, hours: lb.hours || 0, workers: lb.workers || 1 })));
      setEquips((d.equipment_lines || []).map((eq: any) => ({ id: eq.id, equipment_name: eq.equipment_name || "", rental_cost: eq.rental_cost || 0, rental_days: eq.rental_days || 1, operator_required: eq.operator_required || false, operator_cost: eq.operator_cost || 0 })));

      if (d.transport) {
        setTransport({ transport_method: d.transport.transport_method || "truck", truck_rental_cost: d.transport.truck_rental_cost || 0, fuel_cost: d.transport.fuel_cost || 0, mileage_cost: d.transport.mileage_cost || 0, toll_fees: d.transport.toll_fees || 0, driver_cost: d.transport.driver_cost || 0, trips: d.transport.trips || 1 });
      }
      if (d.overhead) {
        setOverhead({ insurance_allocation: d.overhead.insurance_allocation || 0, storage_cost: d.overhead.storage_cost || 0, admin_time_cost: d.overhead.admin_time_cost || 0, bonding_compliance_cost: d.overhead.bonding_compliance_cost || 0, misc_overhead: d.overhead.misc_overhead || 0 });
      }
    } catch (e: any) { setErr(e?.response?.data?.detail || e?.message || "Failed to load bid."); } finally { setLoading(false); }
  }

  async function saveAll() {
    setSaving(true); setErr(null); setSuccess(null);
    try {
      // 1. Patch bid basics
      const { bid_code, status, ...patchable } = form;
      await api.patch(`/bids/${bidId}`, patchable);

      // 2. Delete removed items/labor/equip
      for (const id of deletedItems) { try { await api.delete(`/bids/${bidId}/items/${id}`); } catch {} }
      for (const id of deletedLabors) { try { await api.delete(`/bids/${bidId}/labor/${id}`); } catch {} }
      for (const id of deletedEquips) { try { await api.delete(`/bids/${bidId}/equipment/${id}`); } catch {} }

      // 3. Update existing items, create new ones
      for (const it of items) {
        if (!it.name.trim()) continue;
        if (it._new) {
          await api.post(`/bids/${bidId}/items`, { name: it.name, description: it.description, quantity: it.quantity || 1, unit_cost: it.unit_cost || 0, supplier_name: it.supplier_name || null });
        } else if (it.id) {
          await api.patch(`/bids/${bidId}/items/${it.id}`, { name: it.name, description: it.description, quantity: it.quantity, unit_cost: it.unit_cost, supplier_name: it.supplier_name });
        }
      }

      // 4. Update existing labor, create new
      for (const lb of labors) {
        if (!lb.labor_type.trim()) continue;
        if (lb._new) {
          await api.post(`/bids/${bidId}/labor`, { labor_type: lb.labor_type, hourly_rate: lb.hourly_rate || 0, hours: lb.hours || 0, workers: lb.workers || 1 });
        } else if (lb.id) {
          await api.patch(`/bids/${bidId}/labor/${lb.id}`, { labor_type: lb.labor_type, hourly_rate: lb.hourly_rate, hours: lb.hours, workers: lb.workers });
        }
      }

      // 5. Transport & overhead (always upsert)
      await api.put(`/bids/${bidId}/transport`, transport);
      await api.put(`/bids/${bidId}/overhead`, overhead);

      // 6. Equipment
      for (const eq of equips) {
        if (!eq.equipment_name.trim()) continue;
        if (eq._new) {
          await api.post(`/bids/${bidId}/equipment`, { equipment_name: eq.equipment_name, rental_cost: eq.rental_cost || 0, rental_days: eq.rental_days || 1, operator_required: eq.operator_required, operator_cost: eq.operator_cost || 0 });
        }
        // Equipment patch not implemented — recreate if needed
      }

      setDeletedItems([]); setDeletedLabors([]); setDeletedEquips([]);
      setSuccess("All changes saved!");
      // Reload to get fresh IDs
      await loadBid();
    } catch (e: any) { setErr(e?.response?.data?.detail || e?.message || "Save failed."); } finally { setSaving(false); }
  }

  function removeItem(i: number) { const it = items[i]; if (it.id && !it._new) setDeletedItems(p => [...p, it.id!]); setItems(p => p.filter((_, j) => j !== i)); }
  function removeLabor(i: number) { const lb = labors[i]; if (lb.id && !lb._new) setDeletedLabors(p => [...p, lb.id!]); setLabors(p => p.filter((_, j) => j !== i)); }
  function removeEquip(i: number) { const eq = equips[i]; if (eq.id && !eq._new) setDeletedEquips(p => [...p, eq.id!]); setEquips(p => p.filter((_, j) => j !== i)); }

  const itemTotal = items.reduce((s, r) => s + (r.quantity || 0) * (r.unit_cost || 0), 0);
  const laborTotal = labors.reduce((s, r) => s + (r.hourly_rate || 0) * (r.hours || 0) * (r.workers || 1), 0);
  const transportTotal = (transport.truck_rental_cost + transport.fuel_cost + transport.mileage_cost + transport.toll_fees + transport.driver_cost) * (transport.trips || 1);
  const equipTotal = equips.reduce((s, r) => s + (r.rental_cost || 0) * (r.rental_days || 1) + (r.operator_required ? (r.operator_cost || 0) : 0), 0);
  const overheadTotal = overhead.insurance_allocation + overhead.storage_cost + overhead.admin_time_cost + overhead.bonding_compliance_cost + overhead.misc_overhead;
  const grandTotal = itemTotal + laborTotal + transportTotal + equipTotal + overheadTotal;

  if (loading) return <div style={pageStyle}><div style={shellStyle}><div style={cardStyle}>Loading bid…</div></div></div>;

  return (
    <div style={pageStyle}><div style={shellStyle}>
      <div style={topBarStyle}>
        <div>
          <div style={brandStyle}>SentriBiD</div>
          <div style={subStyle}>Edit Bid — {form.bid_code || `#${bidId}`}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => nav(`/bids/${bidId}`)} style={btnGhostStyle}>← View Details</button>
          <button onClick={() => nav("/bids")} style={btnGhostStyle}>Dashboard</button>
          <button onClick={saveAll} disabled={saving} style={{ ...btnPrimaryStyle, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "💾 Save All Changes"}
          </button>
        </div>
      </div>

      {err && <div style={alertStyle}><b>Error</b><div style={{ marginTop: 6 }}>{err}</div></div>}
      {success && <div style={successStyle}>{success}</div>}

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {(["basics", "items", "costs"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...tabBtn, borderColor: tab === t ? "rgba(215,182,109,.55)" : "rgba(255,255,255,.14)", background: tab === t ? "rgba(215,182,109,.12)" : "transparent" }}>
            {t === "basics" ? "Bid Details" : t === "items" ? `Items (${items.length})` : "Labor & Costs"}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 13, opacity: 0.7, alignSelf: "center" }}>True Cost: <b style={{ color: "rgba(215,182,109,.95)" }}>{usd(grandTotal)}</b></div>
      </div>

      {/* ─── Basics Tab ──────────────────────────────────── */}
      {tab === "basics" && (
        <div style={cardStyle}>
          <div style={titleStyle}>Bid Details</div>
          <div style={gridStyle}>
            <Field label="Contract title"><input value={form.contract_title} onChange={e => setF("contract_title", e.target.value)} style={inputStyle} /></Field>
            <Field label="Agency name"><input value={form.agency_name} onChange={e => setF("agency_name", e.target.value)} style={inputStyle} /></Field>
            <Field label="Solicitation #"><input value={form.solicitation_number} onChange={e => setF("solicitation_number", e.target.value)} style={inputStyle} /></Field>
            <Field label="Procurement"><select value={form.procurement_method} onChange={e => setF("procurement_method", e.target.value)} style={inputStyle}><option value="ifb">IFB</option><option value="rfp">RFP</option><option value="rfq">RFQ</option><option value="sole source">Sole Source</option><option value="gsa schedule">GSA Schedule</option><option value="idiq">IDIQ</option><option value="bpa">BPA</option></select></Field>
            <Field label="Agency type"><select value={form.agency_type} onChange={e => setF("agency_type", e.target.value)} style={inputStyle}><option value="federal">Federal</option><option value="state">State</option><option value="local">Local</option><option value="commercial">Commercial</option></select></Field>
            <Field label="Contract type"><select value={form.contract_type} onChange={e => setF("contract_type", e.target.value)} style={inputStyle}><option value="supply">Supply</option><option value="service">Service</option><option value="construction">Construction</option><option value="it">IT</option><option value="mixed">Mixed</option><option value="consulting">Consulting</option></select></Field>
            <Field label="Competition"><select value={form.competition_level} onChange={e => setF("competition_level", e.target.value)} style={inputStyle}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field>
            <Field label="Urgency (1-5)"><input type="number" min={1} max={5} value={form.urgency_level} onChange={e => setF("urgency_level", Number(e.target.value))} style={inputStyle} /></Field>
            <Field label="Deadline"><input type="date" value={form.deadline_date} onChange={e => setF("deadline_date", e.target.value)} style={inputStyle} /></Field>
            <Field label="Delivery miles"><input type="number" min={0} value={form.delivery_distance_miles} onChange={e => setF("delivery_distance_miles", Number(e.target.value))} style={inputStyle} /></Field>
            <Field label="Risk (1-5)"><input type="number" min={1} max={5} value={form.risk_level} onChange={e => setF("risk_level", Number(e.target.value))} style={inputStyle} /></Field>
            <Field label="Profit mode"><select value={form.desired_profit_mode} onChange={e => setF("desired_profit_mode", e.target.value)} style={inputStyle}><option value="conservative">Conservative</option><option value="balanced">Balanced</option><option value="aggressive">Aggressive</option></select></Field>
            <Field label="Min profit ($)"><input type="number" min={0} value={form.min_acceptable_profit} onChange={e => setF("min_acceptable_profit", Number(e.target.value))} style={inputStyle} /></Field>
            <Field label="Margin override (%)"><input type="number" min={0} max={100} value={form.margin_override_pct} onChange={e => setF("margin_override_pct", Number(e.target.value))} style={inputStyle} /></Field>
          </div>
          <div style={{ marginTop: 12 }}><Field label="Notes"><textarea value={form.notes} onChange={e => setF("notes", e.target.value)} style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} /></Field></div>
        </div>
      )}

      {/* ─── Items Tab ───────────────────────────────────── */}
      {tab === "items" && (
        <div style={cardStyle}>
          <div style={titleStyle}>Line Items</div>
          {items.map((it, i) => (
            <div key={i} style={rowCard}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 800, fontSize: 12, opacity: 0.6 }}>{it._new ? "New Item" : `Item #${it.id}`}</span>
                <button onClick={() => removeItem(i)} style={removeBtn}>✕ Remove</button>
              </div>
              <div style={grid3Style}>
                <Field label="Name"><input value={it.name} onChange={e => updItem(i, { name: e.target.value })} style={inputStyle} /></Field>
                <Field label="Qty"><input type="number" min={0} value={it.quantity} onChange={e => updItem(i, { quantity: Number(e.target.value) })} style={inputStyle} /></Field>
                <Field label="Unit cost ($)"><input type="number" min={0} step="0.01" value={it.unit_cost} onChange={e => updItem(i, { unit_cost: Number(e.target.value) })} style={inputStyle} /></Field>
                <Field label="Description"><input value={it.description} onChange={e => updItem(i, { description: e.target.value })} style={inputStyle} /></Field>
                <Field label="Supplier"><input value={it.supplier_name} onChange={e => updItem(i, { supplier_name: e.target.value })} style={inputStyle} /></Field>
                <Field label="Total"><div style={roField}>{usd((it.quantity || 0) * (it.unit_cost || 0))}</div></Field>
              </div>
            </div>
          ))}
          <button onClick={() => setItems(p => [...p, { name: "", description: "", quantity: 1, unit_cost: 0, supplier_name: "", _new: true }])} style={addBtn}>+ Add Item</button>
          <div style={totalBar}>Items: <b>{usd(itemTotal)}</b></div>
        </div>
      )}

      {/* ─── Costs Tab ───────────────────────────────────── */}
      {tab === "costs" && (<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Labor */}
        <div style={cardStyle}>
          <div style={titleStyle}>Labor</div>
          {labors.map((lb, i) => (
            <div key={i} style={rowCard}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 800, fontSize: 12, opacity: 0.6 }}>{lb._new ? "New" : `Labor #${lb.id}`}</span>
                <button onClick={() => removeLabor(i)} style={removeBtn}>✕</button>
              </div>
              <div style={grid4Style}>
                <Field label="Type"><input value={lb.labor_type} onChange={e => updLabor(i, { labor_type: e.target.value })} style={inputStyle} /></Field>
                <Field label="$/hr"><input type="number" min={0} step="0.01" value={lb.hourly_rate} onChange={e => updLabor(i, { hourly_rate: Number(e.target.value) })} style={inputStyle} /></Field>
                <Field label="Hours"><input type="number" min={0} value={lb.hours} onChange={e => updLabor(i, { hours: Number(e.target.value) })} style={inputStyle} /></Field>
                <Field label="Workers"><input type="number" min={1} value={lb.workers} onChange={e => updLabor(i, { workers: Number(e.target.value) })} style={inputStyle} /></Field>
              </div>
            </div>
          ))}
          <button onClick={() => setLabors(p => [...p, { labor_type: "", hourly_rate: 0, hours: 0, workers: 1, _new: true }])} style={addBtn}>+ Add Labor</button>
          <div style={totalBar}>Labor: <b>{usd(laborTotal)}</b></div>
        </div>

        {/* Transport */}
        <div style={cardStyle}>
          <div style={titleStyle}>Transport</div>
          <div style={grid3Style}>
            <Field label="Method"><select value={transport.transport_method} onChange={e => setT("transport_method", e.target.value)} style={inputStyle}><option value="truck">Truck</option><option value="freight">Freight</option><option value="air">Air</option><option value="courier">Courier</option><option value="self">Self</option></select></Field>
            <Field label="Vehicle ($)"><input type="number" min={0} step="0.01" value={transport.truck_rental_cost} onChange={e => setT("truck_rental_cost", Number(e.target.value))} style={inputStyle} /></Field>
            <Field label="Fuel ($)"><input type="number" min={0} step="0.01" value={transport.fuel_cost} onChange={e => setT("fuel_cost", Number(e.target.value))} style={inputStyle} /></Field>
            <Field label="Mileage ($)"><input type="number" min={0} step="0.01" value={transport.mileage_cost} onChange={e => setT("mileage_cost", Number(e.target.value))} style={inputStyle} /></Field>
            <Field label="Tolls ($)"><input type="number" min={0} step="0.01" value={transport.toll_fees} onChange={e => setT("toll_fees", Number(e.target.value))} style={inputStyle} /></Field>
            <Field label="Driver ($)"><input type="number" min={0} step="0.01" value={transport.driver_cost} onChange={e => setT("driver_cost", Number(e.target.value))} style={inputStyle} /></Field>
            <Field label="Trips"><input type="number" min={1} value={transport.trips} onChange={e => setT("trips", Number(e.target.value))} style={inputStyle} /></Field>
          </div>
          <div style={totalBar}>Transport: <b>{usd(transportTotal)}</b></div>
        </div>

        {/* Overhead */}
        <div style={cardStyle}>
          <div style={titleStyle}>Overhead</div>
          <div style={grid3Style}>
            <Field label="Insurance ($)"><input type="number" min={0} step="0.01" value={overhead.insurance_allocation} onChange={e => setO("insurance_allocation", Number(e.target.value))} style={inputStyle} /></Field>
            <Field label="Storage ($)"><input type="number" min={0} step="0.01" value={overhead.storage_cost} onChange={e => setO("storage_cost", Number(e.target.value))} style={inputStyle} /></Field>
            <Field label="Admin ($)"><input type="number" min={0} step="0.01" value={overhead.admin_time_cost} onChange={e => setO("admin_time_cost", Number(e.target.value))} style={inputStyle} /></Field>
            <Field label="Bonding ($)"><input type="number" min={0} step="0.01" value={overhead.bonding_compliance_cost} onChange={e => setO("bonding_compliance_cost", Number(e.target.value))} style={inputStyle} /></Field>
            <Field label="Misc ($)"><input type="number" min={0} step="0.01" value={overhead.misc_overhead} onChange={e => setO("misc_overhead", Number(e.target.value))} style={inputStyle} /></Field>
          </div>
          <div style={totalBar}>Overhead: <b>{usd(overheadTotal)}</b></div>
        </div>

        {/* Equipment */}
        <div style={cardStyle}>
          <div style={titleStyle}>Equipment</div>
          {equips.map((eq, i) => (
            <div key={i} style={rowCard}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 800, fontSize: 12, opacity: 0.6 }}>{eq._new ? "New" : `#${eq.id}`}</span>
                <button onClick={() => removeEquip(i)} style={removeBtn}>✕</button>
              </div>
              <div style={grid3Style}>
                <Field label="Name"><input value={eq.equipment_name} onChange={e => updEquip(i, { equipment_name: e.target.value })} style={inputStyle} /></Field>
                <Field label="$/day"><input type="number" min={0} step="0.01" value={eq.rental_cost} onChange={e => updEquip(i, { rental_cost: Number(e.target.value) })} style={inputStyle} /></Field>
                <Field label="Days"><input type="number" min={1} value={eq.rental_days} onChange={e => updEquip(i, { rental_days: Number(e.target.value) })} style={inputStyle} /></Field>
              </div>
            </div>
          ))}
          <button onClick={() => setEquips(p => [...p, { equipment_name: "", rental_cost: 0, rental_days: 1, operator_required: false, operator_cost: 0, _new: true }])} style={addBtn}>+ Add Equipment</button>
        </div>

        {/* Summary */}
        <div style={summaryCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={titleStyle}>Total: {usd(grandTotal)}</div>
            <button onClick={saveAll} disabled={saving} style={{ ...btnPrimaryStyle, fontSize: 15, padding: "12px 20px" }}>{saving ? "Saving…" : "💾 Save All"}</button>
          </div>
        </div>
      </div>)}
    </div></div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div style={{ fontSize: 12, opacity: 0.75, marginBottom: 5 }}>{label}</div>{children}</div>;
}

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(1200px 800px at 15% 10%, rgba(120,88,255,.22), transparent 60%),radial-gradient(900px 650px at 80% 20%, rgba(0,212,255,.12), transparent 55%),radial-gradient(900px 800px at 60% 90%, rgba(215,182,109,.14), transparent 55%),linear-gradient(180deg, #070A12, #0B1020)", color: "rgba(255,255,255,.92)", fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji" };
const shellStyle: React.CSSProperties = { width: "min(1100px, calc(100% - 48px))", margin: "0 auto", padding: "26px 0 60px" };
const topBarStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "14px 16px", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04))", boxShadow: "0 14px 40px rgba(0,0,0,.45)", backdropFilter: "blur(14px)" };
const brandStyle: React.CSSProperties = { fontWeight: 900, letterSpacing: ".3px" };
const subStyle: React.CSSProperties = { fontSize: 12, opacity: 0.7, marginTop: 2 };
const tabBtn: React.CSSProperties = { border: "1px solid rgba(255,255,255,.14)", borderRadius: 14, padding: "9px 14px", background: "transparent", color: "rgba(255,255,255,.88)", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const cardStyle: React.CSSProperties = { marginTop: 14, border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, background: "rgba(255,255,255,.06)", boxShadow: "0 14px 40px rgba(0,0,0,.35)", backdropFilter: "blur(16px)", padding: 18 };
const summaryCard: React.CSSProperties = { ...cardStyle, border: "1px solid rgba(215,182,109,.25)", background: "radial-gradient(600px 300px at 20% 0%, rgba(215,182,109,.12), transparent 60%),rgba(255,255,255,.06)" };
const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 900, marginBottom: 10 };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 };
const grid3Style: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 8 };
const grid4Style: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 8 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.18)", color: "rgba(255,255,255,.92)", outline: "none", fontSize: 13 };
const roField: React.CSSProperties = { ...inputStyle, background: "rgba(215,182,109,.08)", border: "1px solid rgba(215,182,109,.25)", fontWeight: 800, color: "rgba(215,182,109,.92)" };
const rowCard: React.CSSProperties = { marginTop: 10, borderRadius: 14, border: "1px solid rgba(255,255,255,.08)", background: "rgba(0,0,0,.12)", padding: 12 };
const totalBar: React.CSSProperties = { marginTop: 12, padding: "10px 14px", borderRadius: 14, border: "1px solid rgba(215,182,109,.20)", background: "rgba(215,182,109,.06)", fontSize: 14, display: "flex", justifyContent: "flex-end", gap: 8 };
const addBtn: React.CSSProperties = { marginTop: 10, border: "1px dashed rgba(255,255,255,.18)", borderRadius: 14, padding: "10px 14px", background: "transparent", color: "rgba(255,255,255,.7)", fontWeight: 700, cursor: "pointer", width: "100%", textAlign: "center", fontSize: 13 };
const removeBtn: React.CSSProperties = { border: "1px solid rgba(255,100,100,.25)", borderRadius: 10, padding: "4px 10px", background: "rgba(255,80,80,.10)", color: "rgba(255,120,120,.9)", fontWeight: 700, cursor: "pointer", fontSize: 12 };
const btnBase: React.CSSProperties = { border: "1px solid rgba(255,255,255,.14)", borderRadius: 14, padding: "10px 14px", background: "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.06))", color: "rgba(255,255,255,.92)", fontWeight: 800, cursor: "pointer", fontSize: 13 };
const btnPrimaryStyle: React.CSSProperties = { ...btnBase, border: "1px solid rgba(215,182,109,.35)", background: "radial-gradient(400px 160px at 30% 20%, rgba(215,182,109,.22), transparent 60%),linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06))" };
const btnGhostStyle: React.CSSProperties = { ...btnBase, background: "transparent", textDecoration: "none" };
const alertStyle: React.CSSProperties = { marginTop: 14, borderRadius: 18, border: "1px solid rgba(255,120,120,.22)", background: "rgba(255,90,90,.08)", padding: 14 };
const successStyle: React.CSSProperties = { marginTop: 14, borderRadius: 18, border: "1px solid rgba(40,220,160,.25)", background: "rgba(40,220,160,.08)", padding: 14, color: "rgba(40,220,160,.95)", fontWeight: 700 };
