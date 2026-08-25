import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import Page from "@/components/Page";
import {
  Alert,
  Button,
  Card,
  CardHeading,
  Checkbox,
  EmptyState,
  Field,
  Icon,
  Input,
  Select,
  SkeletonRows,
  Tabs,
  Textarea,
} from "@/ui/kit";
import { money } from "@/lib/format";

type AnyObj = Record<string, any>;
type ItemRow = {
  id?: number;
  name: string;
  description: string;
  quantity: number;
  unit_cost: number;
  supplier_name: string;
  _new?: boolean;
};
type LaborRow = {
  id?: number;
  labor_type: string;
  hourly_rate: number;
  hours: number;
  workers: number;
  _new?: boolean;
};
type EquipRow = {
  id?: number;
  equipment_name: string;
  rental_cost: number;
  rental_days: number;
  operator_required: boolean;
  operator_cost: number;
  _new?: boolean;
};
type TransportForm = {
  transport_method: string;
  truck_rental_cost: number;
  fuel_cost: number;
  mileage_cost: number;
  toll_fees: number;
  driver_cost: number;
  trips: number;
};
type OverheadForm = {
  insurance_allocation: number;
  storage_cost: number;
  admin_time_cost: number;
  bonding_compliance_cost: number;
  misc_overhead: number;
};
type TabKey = "basics" | "materials" | "people" | "other";

export default function EditBidPage() {
  const { bidId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("basics");

  const [form, setForm] = useState<AnyObj>({});
  const [items, setItems] = useState<ItemRow[]>([]);
  const [labors, setLabors] = useState<LaborRow[]>([]);
  const [equips, setEquips] = useState<EquipRow[]>([]);
  const [transport, setTransport] = useState<TransportForm>({
    transport_method: "truck",
    truck_rental_cost: 0,
    fuel_cost: 0,
    mileage_cost: 0,
    toll_fees: 0,
    driver_cost: 0,
    trips: 1,
  });
  const [overhead, setOverhead] = useState<OverheadForm>({
    insurance_allocation: 0,
    storage_cost: 0,
    admin_time_cost: 0,
    bonding_compliance_cost: 0,
    misc_overhead: 0,
  });

  const [deletedItems, setDeletedItems] = useState<number[]>([]);
  const [deletedLabors, setDeletedLabors] = useState<number[]>([]);
  const [deletedEquips, setDeletedEquips] = useState<number[]>([]);

  const setF = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const setT = <K extends keyof TransportForm>(k: K, v: TransportForm[K]) =>
    setTransport((p) => ({ ...p, [k]: v }));
  const setO = <K extends keyof OverheadForm>(k: K, v: OverheadForm[K]) =>
    setOverhead((p) => ({ ...p, [k]: v }));

  const updItem = (i: number, p: Partial<ItemRow>) =>
    setItems((prev) => prev.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const updLabor = (i: number, p: Partial<LaborRow>) =>
    setLabors((prev) => prev.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const updEquip = (i: number, p: Partial<EquipRow>) =>
    setEquips((prev) => prev.map((r, j) => (j === i ? { ...r, ...p } : r)));

  async function loadBid() {
    try {
      setLoading(true);
      setErr(null);
      const [bidRes, detRes] = await Promise.all([
        api.get(`/bids/${bidId}`),
        api.get(`/bids/${bidId}/details`),
      ]);
      const b = bidRes.data;
      const d = detRes.data;

      setForm({
        contract_title: b.contract_title || "",
        agency_name: b.agency_name || "",
        agency_type: b.agency_type || "federal",
        solicitation_number: b.solicitation_number || "",
        procurement_method: b.procurement_method || "ifb",
        contract_type: b.contract_type || "supply",
        delivery_distance_miles: b.delivery_distance_miles || 0,
        deadline_date: b.deadline_date ? String(b.deadline_date).slice(0, 10) : "",
        urgency_level: b.urgency_level || 3,
        competition_level: b.competition_level || "medium",
        risk_level: b.risk_level || 3,
        desired_profit_mode: b.desired_profit_mode || "balanced",
        min_acceptable_profit: b.min_acceptable_profit || 0,
        margin_override_pct: b.margin_override_pct || 0,
        notes: b.notes || "",
        bid_code: b.bid_code,
        status: b.status,
      });

      setItems(
        (d.items || []).map((it: any) => ({
          id: it.id,
          name: it.name || "",
          description: it.description || "",
          quantity: it.quantity || 0,
          unit_cost: it.unit_cost || 0,
          supplier_name: it.supplier_name || "",
        }))
      );
      setLabors(
        (d.labor_lines || []).map((lb: any) => ({
          id: lb.id,
          labor_type: lb.labor_type || "",
          hourly_rate: lb.hourly_rate || 0,
          hours: lb.hours || 0,
          workers: lb.workers || 1,
        }))
      );
      setEquips(
        (d.equipment_lines || []).map((eq: any) => ({
          id: eq.id,
          equipment_name: eq.equipment_name || "",
          rental_cost: eq.rental_cost || 0,
          rental_days: eq.rental_days || 1,
          operator_required: eq.operator_required || false,
          operator_cost: eq.operator_cost || 0,
        }))
      );

      if (d.transport) {
        setTransport({
          transport_method: d.transport.transport_method || "truck",
          truck_rental_cost: d.transport.truck_rental_cost || 0,
          fuel_cost: d.transport.fuel_cost || 0,
          mileage_cost: d.transport.mileage_cost || 0,
          toll_fees: d.transport.toll_fees || 0,
          driver_cost: d.transport.driver_cost || 0,
          trips: d.transport.trips || 1,
        });
      }
      if (d.overhead) {
        setOverhead({
          insurance_allocation: d.overhead.insurance_allocation || 0,
          storage_cost: d.overhead.storage_cost || 0,
          admin_time_cost: d.overhead.admin_time_cost || 0,
          bonding_compliance_cost: d.overhead.bonding_compliance_cost || 0,
          misc_overhead: d.overhead.misc_overhead || 0,
        });
      }
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "We couldn't load this bid.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bidId]);

  async function saveAll() {
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      const { bid_code: _code, status: _status, ...patchable } = form;
      await api.patch(`/bids/${bidId}`, patchable);

      for (const id of deletedItems) {
        try {
          await api.delete(`/bids/${bidId}/items/${id}`);
        } catch {
          /* already gone */
        }
      }
      for (const id of deletedLabors) {
        try {
          await api.delete(`/bids/${bidId}/labor/${id}`);
        } catch {
          /* already gone */
        }
      }
      for (const id of deletedEquips) {
        try {
          await api.delete(`/bids/${bidId}/equipment/${id}`);
        } catch {
          /* already gone */
        }
      }

      for (const it of items) {
        if (!it.name.trim()) continue;
        if (it._new) {
          await api.post(`/bids/${bidId}/items`, {
            name: it.name,
            description: it.description,
            quantity: it.quantity || 1,
            unit_cost: it.unit_cost || 0,
            supplier_name: it.supplier_name || null,
          });
        } else if (it.id) {
          await api.patch(`/bids/${bidId}/items/${it.id}`, {
            name: it.name,
            description: it.description,
            quantity: it.quantity,
            unit_cost: it.unit_cost,
            supplier_name: it.supplier_name,
          });
        }
      }

      for (const lb of labors) {
        if (!lb.labor_type.trim()) continue;
        if (lb._new) {
          await api.post(`/bids/${bidId}/labor`, {
            labor_type: lb.labor_type,
            hourly_rate: lb.hourly_rate || 0,
            hours: lb.hours || 0,
            workers: lb.workers || 1,
          });
        } else if (lb.id) {
          await api.patch(`/bids/${bidId}/labor/${lb.id}`, {
            labor_type: lb.labor_type,
            hourly_rate: lb.hourly_rate,
            hours: lb.hours,
            workers: lb.workers,
          });
        }
      }

      await api.put(`/bids/${bidId}/transport`, transport);
      await api.put(`/bids/${bidId}/overhead`, overhead);

      for (const eq of equips) {
        if (!eq.equipment_name.trim()) continue;
        if (eq._new) {
          await api.post(`/bids/${bidId}/equipment`, {
            equipment_name: eq.equipment_name,
            rental_cost: eq.rental_cost || 0,
            rental_days: eq.rental_days || 1,
            operator_required: eq.operator_required,
            operator_cost: eq.operator_cost || 0,
          });
        }
      }

      setDeletedItems([]);
      setDeletedLabors([]);
      setDeletedEquips([]);
      setOk("Saved.");
      await loadBid();
      setTimeout(() => setOk(null), 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Save failed. Nothing was lost — try again.");
    } finally {
      setSaving(false);
    }
  }

  function removeItem(i: number) {
    const it = items[i];
    if (it.id && !it._new) setDeletedItems((p) => [...p, it.id!]);
    setItems((p) => p.filter((_, j) => j !== i));
  }
  function removeLabor(i: number) {
    const lb = labors[i];
    if (lb.id && !lb._new) setDeletedLabors((p) => [...p, lb.id!]);
    setLabors((p) => p.filter((_, j) => j !== i));
  }
  function removeEquip(i: number) {
    const eq = equips[i];
    if (eq.id && !eq._new) setDeletedEquips((p) => [...p, eq.id!]);
    setEquips((p) => p.filter((_, j) => j !== i));
  }

  const runningTotal = useMemo(() => {
    const mat = items.reduce((s, it) => s + (it.quantity || 0) * (it.unit_cost || 0), 0);
    const lab = labors.reduce(
      (s, lb) => s + (lb.hourly_rate || 0) * (lb.hours || 0) * (lb.workers || 1),
      0
    );
    const eq = equips.reduce(
      (s, e) =>
        s +
        (e.rental_cost || 0) * (e.rental_days || 1) +
        (e.operator_required ? e.operator_cost || 0 : 0),
      0
    );
    const trn =
      ((transport.truck_rental_cost || 0) +
        (transport.fuel_cost || 0) +
        (transport.mileage_cost || 0) +
        (transport.toll_fees || 0) +
        (transport.driver_cost || 0)) *
      (transport.trips || 1);
    const ovh = Object.values(overhead).reduce((s, n) => s + (Number(n) || 0), 0);
    return { mat, lab, eq, trn, ovh, total: mat + lab + eq + trn + ovh };
  }, [items, labors, equips, transport, overhead]);

  if (loading) {
    return (
      <Page
        title="Loading"
        summary="Fetching the costs for this bid."
        back={{ to: `/bids/${bidId}`, label: "Back to the bid" }}
      >
        <Card>
          <SkeletonRows rows={6} />
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Edit costs"
      summary="What it actually costs you to do this job. Get these right and the pricing takes care of itself."
      back={{ to: `/bids/${bidId}`, label: "Back to the bid" }}
      eyebrow={
        form.bid_code ? (
          <span className="font-mono text-[11px] text-faint">{form.bid_code}</span>
        ) : undefined
      }
      actions={
        <>
          <Button onClick={() => navigate(`/bids/${bidId}`)}>Cancel</Button>
          <Button tone="primary" loading={saving} onClick={saveAll}>
            Save changes
          </Button>
        </>
      }
    >
      {err ? (
        <Alert className="mb-gap" onDismiss={() => setErr(null)}>
          {err}
        </Alert>
      ) : null}
      {ok ? (
        <Alert tone="good" className="mb-gap" onDismiss={() => setOk(null)}>
          {ok}
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-gap lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs<TabKey>
            value={tab}
            onChange={setTab}
            options={[
              { value: "basics", label: "The contract" },
              { value: "materials", label: "Materials", count: items.length },
              { value: "people", label: "People", count: labors.length },
              { value: "other", label: "Everything else" },
            ]}
            className="mb-gap"
          />

          {tab === "basics" ? (
            <Card>
              <CardHeading title="About the contract" />
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Contract title" className="sm:col-span-2">
                  <Input
                    value={form.contract_title ?? ""}
                    onChange={(e) => setF("contract_title", e.target.value)}
                  />
                </Field>
                <Field label="Agency">
                  <Input
                    value={form.agency_name ?? ""}
                    onChange={(e) => setF("agency_name", e.target.value)}
                  />
                </Field>
                <Field label="Level of government">
                  <Select
                    value={form.agency_type ?? "federal"}
                    onChange={(e) => setF("agency_type", e.target.value)}
                  >
                    <option value="federal">Federal</option>
                    <option value="state">State</option>
                    <option value="local">Local / county</option>
                    <option value="tribal">Tribal</option>
                  </Select>
                </Field>
                <Field label="Solicitation number">
                  <Input
                    value={form.solicitation_number ?? ""}
                    onChange={(e) => setF("solicitation_number", e.target.value)}
                    className="font-mono"
                  />
                </Field>
                <Field label="What kind of work">
                  <Select
                    value={form.contract_type ?? "supply"}
                    onChange={(e) => setF("contract_type", e.target.value)}
                  >
                    <option value="supply">Supplying goods</option>
                    <option value="service">Providing a service</option>
                    <option value="construction">Construction</option>
                    <option value="mixed">A bit of both</option>
                  </Select>
                </Field>
                <Field label="Proposal due">
                  <Input
                    type="date"
                    value={form.deadline_date ?? ""}
                    onChange={(e) => setF("deadline_date", e.target.value)}
                  />
                </Field>
                <Field label="Distance to site" hint="Miles. Feeds the transport cost.">
                  <Input
                    type="number"
                    min={0}
                    value={form.delivery_distance_miles ?? 0}
                    onChange={(e) => setF("delivery_distance_miles", Number(e.target.value))}
                  />
                </Field>
                <Field label="How much competition">
                  <Select
                    value={form.competition_level ?? "medium"}
                    onChange={(e) => setF("competition_level", e.target.value)}
                  >
                    <option value="low">Not much</option>
                    <option value="medium">Some</option>
                    <option value="high">A lot</option>
                  </Select>
                </Field>
                <Field label="How risky is it" hint="1 is safe, 5 is risky.">
                  <Select
                    value={form.risk_level ?? 3}
                    onChange={(e) => setF("risk_level", Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Notes" className="sm:col-span-2">
                  <Textarea
                    rows={4}
                    value={form.notes ?? ""}
                    onChange={(e) => setF("notes", e.target.value)}
                  />
                </Field>
              </div>
            </Card>
          ) : null}

          {tab === "materials" ? (
            <Card>
              <CardHeading
                title="Materials and goods"
                hint="Anything you have to buy to deliver this job."
                action={
                  <Button
                    size="sm"
                    icon="add"
                    onClick={() =>
                      setItems((p) => [
                        ...p,
                        {
                          name: "",
                          description: "",
                          quantity: 1,
                          unit_cost: 0,
                          supplier_name: "",
                          _new: true,
                        },
                      ])
                    }
                  >
                    Add item
                  </Button>
                }
              />
              {items.length === 0 ? (
                <EmptyState
                  icon="inbox"
                  title="No materials yet"
                  body="If this job is all labour, you can leave this empty."
                  className="py-10"
                />
              ) : (
                <ul className="mt-5 space-y-4">
                  {items.map((it, i) => (
                    <li key={i} className="rounded-control border border-line bg-raised p-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                        <Field label="Item" className="sm:col-span-5">
                          <Input
                            value={it.name}
                            onChange={(e) => updItem(i, { name: e.target.value })}
                            placeholder="What is it?"
                          />
                        </Field>
                        <Field label="Quantity" className="sm:col-span-2">
                          <Input
                            type="number"
                            min={0}
                            value={it.quantity}
                            onChange={(e) => updItem(i, { quantity: Number(e.target.value) })}
                          />
                        </Field>
                        <Field label="Cost each" className="sm:col-span-2">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={it.unit_cost}
                            onChange={(e) => updItem(i, { unit_cost: Number(e.target.value) })}
                          />
                        </Field>
                        <Field label="Supplier" className="sm:col-span-2">
                          <Input
                            value={it.supplier_name}
                            onChange={(e) => updItem(i, { supplier_name: e.target.value })}
                          />
                        </Field>
                        <div className="flex items-end justify-end sm:col-span-1">
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            aria-label="Remove item"
                            className="mb-1 flex h-9 w-9 items-center justify-center rounded-control text-faint transition-colors hover:bg-bad-bg hover:text-bad-ink"
                          >
                            <Icon name="delete" className="text-[18px]" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-meta text-muted">
                        Line total {money((it.quantity || 0) * (it.unit_cost || 0))}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : null}

          {tab === "people" ? (
            <div className="space-y-gap">
              <Card>
                <CardHeading
                  title="Labour"
                  hint="Who does the work, for how long, at what rate."
                  action={
                    <Button
                      size="sm"
                      icon="add"
                      onClick={() =>
                        setLabors((p) => [
                          ...p,
                          { labor_type: "", hourly_rate: 0, hours: 0, workers: 1, _new: true },
                        ])
                      }
                    >
                      Add role
                    </Button>
                  }
                />
                {labors.length === 0 ? (
                  <EmptyState
                    icon="inbox"
                    title="No labour costs yet"
                    body="Add each role you'll put on this job."
                    className="py-10"
                  />
                ) : (
                  <ul className="mt-5 space-y-4">
                    {labors.map((lb, i) => (
                      <li key={i} className="rounded-control border border-line bg-raised p-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                          <Field label="Role" className="sm:col-span-5">
                            <Input
                              value={lb.labor_type}
                              onChange={(e) => updLabor(i, { labor_type: e.target.value })}
                              placeholder="e.g. Technician"
                            />
                          </Field>
                          <Field label="Rate / hour" className="sm:col-span-2">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={lb.hourly_rate}
                              onChange={(e) => updLabor(i, { hourly_rate: Number(e.target.value) })}
                            />
                          </Field>
                          <Field label="Hours" className="sm:col-span-2">
                            <Input
                              type="number"
                              min={0}
                              value={lb.hours}
                              onChange={(e) => updLabor(i, { hours: Number(e.target.value) })}
                            />
                          </Field>
                          <Field label="People" className="sm:col-span-2">
                            <Input
                              type="number"
                              min={1}
                              value={lb.workers}
                              onChange={(e) => updLabor(i, { workers: Number(e.target.value) })}
                            />
                          </Field>
                          <div className="flex items-end justify-end sm:col-span-1">
                            <button
                              type="button"
                              onClick={() => removeLabor(i)}
                              aria-label="Remove role"
                              className="mb-1 flex h-9 w-9 items-center justify-center rounded-control text-faint transition-colors hover:bg-bad-bg hover:text-bad-ink"
                            >
                              <Icon name="delete" className="text-[18px]" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-meta text-muted">
                          Line total{" "}
                          {money((lb.hourly_rate || 0) * (lb.hours || 0) * (lb.workers || 1))}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card>
                <CardHeading
                  title="Equipment"
                  hint="Anything you rent or hire in."
                  action={
                    <Button
                      size="sm"
                      icon="add"
                      onClick={() =>
                        setEquips((p) => [
                          ...p,
                          {
                            equipment_name: "",
                            rental_cost: 0,
                            rental_days: 1,
                            operator_required: false,
                            operator_cost: 0,
                            _new: true,
                          },
                        ])
                      }
                    >
                      Add equipment
                    </Button>
                  }
                />
                {equips.length === 0 ? (
                  <EmptyState
                    icon="inbox"
                    title="No equipment"
                    body="Leave this empty if you're using your own."
                    className="py-10"
                  />
                ) : (
                  <ul className="mt-5 space-y-4">
                    {equips.map((eq, i) => (
                      <li key={i} className="rounded-control border border-line bg-raised p-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                          <Field label="Equipment" className="sm:col-span-5">
                            <Input
                              value={eq.equipment_name}
                              onChange={(e) => updEquip(i, { equipment_name: e.target.value })}
                            />
                          </Field>
                          <Field label="Cost / day" className="sm:col-span-3">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={eq.rental_cost}
                              onChange={(e) => updEquip(i, { rental_cost: Number(e.target.value) })}
                            />
                          </Field>
                          <Field label="Days" className="sm:col-span-3">
                            <Input
                              type="number"
                              min={1}
                              value={eq.rental_days}
                              onChange={(e) => updEquip(i, { rental_days: Number(e.target.value) })}
                            />
                          </Field>
                          <div className="flex items-end justify-end sm:col-span-1">
                            <button
                              type="button"
                              onClick={() => removeEquip(i)}
                              aria-label="Remove equipment"
                              className="mb-1 flex h-9 w-9 items-center justify-center rounded-control text-faint transition-colors hover:bg-bad-bg hover:text-bad-ink"
                            >
                              <Icon name="delete" className="text-[18px]" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-end gap-4">
                          <Checkbox
                            label="Needs an operator"
                            checked={eq.operator_required}
                            onChange={(e) => updEquip(i, { operator_required: e.target.checked })}
                          />
                          {eq.operator_required ? (
                            <Field label="Operator cost" className="w-40">
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={eq.operator_cost}
                                onChange={(e) =>
                                  updEquip(i, { operator_cost: Number(e.target.value) })
                                }
                              />
                            </Field>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          ) : null}

          {tab === "other" ? (
            <div className="space-y-gap">
              <Card>
                <CardHeading title="Getting there" hint="Moving people and goods to the site." />
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <Field label="How you're travelling">
                    <Select
                      value={transport.transport_method}
                      onChange={(e) => setT("transport_method", e.target.value)}
                    >
                      <option value="truck">Truck</option>
                      <option value="van">Van</option>
                      <option value="courier">Courier</option>
                      <option value="freight">Freight</option>
                      <option value="none">Not needed</option>
                    </Select>
                  </Field>
                  <Field label="Vehicle hire">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={transport.truck_rental_cost}
                      onChange={(e) => setT("truck_rental_cost", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Fuel">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={transport.fuel_cost}
                      onChange={(e) => setT("fuel_cost", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Mileage">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={transport.mileage_cost}
                      onChange={(e) => setT("mileage_cost", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Tolls">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={transport.toll_fees}
                      onChange={(e) => setT("toll_fees", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Driver">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={transport.driver_cost}
                      onChange={(e) => setT("driver_cost", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Number of trips" hint="Everything above is multiplied by this.">
                    <Input
                      type="number"
                      min={1}
                      value={transport.trips}
                      onChange={(e) => setT("trips", Number(e.target.value))}
                    />
                  </Field>
                </div>
              </Card>

              <Card>
                <CardHeading
                  title="Overheads"
                  hint="The costs that aren't tied to one line, but still come out of this job."
                />
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Insurance">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={overhead.insurance_allocation}
                      onChange={(e) => setO("insurance_allocation", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Storage">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={overhead.storage_cost}
                      onChange={(e) => setO("storage_cost", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Admin time">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={overhead.admin_time_cost}
                      onChange={(e) => setO("admin_time_cost", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Bonding and compliance">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={overhead.bonding_compliance_cost}
                      onChange={(e) => setO("bonding_compliance_cost", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Anything else">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={overhead.misc_overhead}
                      onChange={(e) => setO("misc_overhead", Number(e.target.value))}
                    />
                  </Field>
                </div>
              </Card>
            </div>
          ) : null}
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeading title="Running total" hint="Updates as you type. Nothing is saved yet." />
          <div className="mt-5 space-y-2.5">
            <Line label="Materials" value={runningTotal.mat} />
            <Line label="Labour" value={runningTotal.lab} />
            <Line label="Equipment" value={runningTotal.eq} />
            <Line label="Transport" value={runningTotal.trn} />
            <Line label="Overheads" value={runningTotal.ovh} />
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-base font-medium text-body">Your cost</span>
            <span className="text-h1 tnum text-ink">{money(runningTotal.total)}</span>
          </div>
          <p className="mt-3 text-meta text-muted">
            This is cost, not price. Profit gets added when you pick a pricing strategy.
          </p>
          <Button className="mt-5" tone="primary" block loading={saving} onClick={saveAll}>
            Save changes
          </Button>
        </Card>
      </div>
    </Page>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-meta text-muted">{label}</span>
      <span className="text-base tnum text-body">{money(value)}</span>
    </div>
  );
}
