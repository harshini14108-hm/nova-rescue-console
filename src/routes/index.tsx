import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Clock3, IndianRupee, RotateCcw, ShieldAlert } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  orders, riskLevel, ACTION_IMPACT, ACTION_LABELS, cohortData, failureBreakdown,
  savingsFromSliders, formatINR, CANCEL_RATE, type ActionType, type RiskLevel,
} from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "NOVA CART Rescue Console | Delivery Overview" },
    { name: "description", content: "Simulated operations dashboard for risky orders, delivery reliability, repeat rates, and rescue actions." },
    { property: "og:title", content: "NOVA CART Rescue Console | Delivery Overview" },
    { property: "og:description", content: "Growth is hiding a delivery problem. Explore simulated orders and their rescue actions." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Dashboard,
});

const RISK_STYLES: Record<RiskLevel, string> = {
  High: "border-risk-high/25 bg-risk-high-soft text-risk-high",
  Medium: "border-risk-medium/25 bg-risk-medium-soft text-risk-medium",
  Low: "border-risk-low/25 bg-risk-low-soft text-risk-low",
};
const RISK_DOT: Record<RiskLevel, string> = { High: "bg-risk-high", Medium: "bg-risk-medium", Low: "bg-risk-low" };
const REASON_COLORS: Record<string, string> = {
  "Out of stock": "var(--chart-1)",
  "No riders": "var(--chart-2)",
  "Peak hour rush": "var(--chart-3)",
};
const averageEta = Math.round(orders.reduce((sum, order) => sum + order.etaMinutes, 0) / orders.length);
const monthlyRevenueAtRisk = savingsFromSliders(100, 100).total;
const biggestCause = [...failureBreakdown].sort((a, b) => b.count - a.count)[0];

function Dashboard() {
  const [applied, setApplied] = useState<Record<string, Set<ActionType>>>({});
  const [filter, setFilter] = useState<RiskLevel | "All">("All");
  const [lateReduction, setLateReduction] = useState(30);
  const [cancelReduction, setCancelReduction] = useState(30);

  const applyAction = (id: string, action: ActionType) => {
    setApplied((prev) => ({ ...prev, [id]: new Set([...(prev[id] ?? []), action]) }));
  };

  const enriched = useMemo(() => orders.map((order) => {
    let score = order.baseScore;
    applied[order.id]?.forEach((action) => { score -= ACTION_IMPACT[action]; });
    return { ...order, score: Math.max(2, score) };
  }), [applied]);

  const counts = useMemo(() => {
    const result: Record<RiskLevel, number> = { High: 0, Medium: 0, Low: 0 };
    enriched.forEach((order) => { result[riskLevel(order.score)]++; });
    return result;
  }, [enriched]);

  const visible = useMemo(() => enriched
    .filter((order) => filter === "All" || riskLevel(order.score) === filter)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)), [enriched, filter]);
  const savings = savingsFromSliders(lateReduction, cancelReduction);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-[1480px] px-5 pb-16 pt-7 sm:px-8 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase text-risk-low">Operations overview / today</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Delivery health</h1>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-panel"><span className="size-1.5 rounded-full bg-risk-low" /> Simulated data</span>
        </div>

        <section className="rounded-lg bg-header px-6 py-7 text-header-foreground shadow-panel sm:px-8 sm:py-8" aria-label="Key insight">
          <div className="flex items-start gap-3"><span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-header-accent text-header-accent-foreground"><ShieldAlert size={19} /></span><div><p className="text-xs font-bold uppercase text-header-accent">The delivery gap</p><h2 className="mt-2 max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl">Growth is hiding a delivery problem.</h2><p className="mt-2 text-base font-medium text-header-muted sm:text-lg">Late first orders cut repeat purchases by more than half.</p></div></div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-label="Key metrics">
          <Metric label="Repeat rate" value={`${cohortData[0]?.reorderRate ?? 0}%`} detail="After an on-time first order" icon={<RotateCcw size={18} />} note="Late first order: 27%" />
          <Metric label="Cancel rate" value={`${Math.round(CANCEL_RATE * 100)}%`} detail="Of monthly orders" icon={<ArrowDownRight size={18} />} />
          <Metric label="Avg delivery time" value={`${averageEta} min`} detail="Across 200 sample orders" icon={<Clock3 size={18} />} />
          <Metric label="Revenue at risk / month" value={formatINR(monthlyRevenueAtRisk)} detail="Estimated recoverable value" icon={<IndianRupee size={18} />} />
        </section>

        <section className="mt-9" aria-label="Risk overview">
          <div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase text-muted-foreground">Risk distribution</p><h2 className="mt-1 text-xl font-bold text-foreground">Orders needing attention</h2></div><p className="text-sm font-semibold text-muted-foreground">200 total orders</p></div>
          <div className="grid gap-3 sm:grid-cols-3 lg:gap-4">
            {(["High", "Medium", "Low"] as RiskLevel[]).map((level) => (
              <Button key={level} variant="outline" onClick={() => setFilter(filter === level ? "All" : level)} aria-pressed={filter === level} className={`h-auto min-h-32 justify-start rounded-lg border p-5 text-left shadow-panel transition-transform hover:-translate-y-0.5 hover:bg-card sm:p-6 ${RISK_STYLES[level]} ${filter === level ? "ring-2 ring-ring" : ""}`}>
                <div className="w-full"><div className="flex items-center gap-2 text-sm font-bold"><span className={`size-2.5 rounded-full ${RISK_DOT[level]}`} /> {level} risk</div><p className="mt-3 text-4xl font-extrabold leading-none">{counts[level]}</p><p className="mt-2 text-xs font-semibold opacity-80">{Math.round(counts[level] / orders.length * 100)}% of live orders</p></div>
              </Button>
            ))}
          </div>
        </section>

        <section className="mt-9 overflow-hidden rounded-lg border border-border bg-card shadow-panel" aria-label="Live orders">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-5 sm:px-6"><div><p className="text-xs font-bold uppercase text-muted-foreground">Rescue queue</p><h2 className="mt-1 text-xl font-bold text-foreground">Live Orders <span className="text-muted-foreground">({visible.length})</span></h2></div><div className="flex items-center gap-3"><span className="text-xs font-medium text-muted-foreground">Highest risk first</span>{filter !== "All" && <Button variant="outline" size="sm" onClick={() => setFilter("All")}>Clear filter</Button>}</div></div>
          <div className="max-h-[570px] overflow-auto">
            <table className="w-full min-w-[1120px] text-left text-sm text-foreground">
              <thead className="sticky top-0 z-10 bg-secondary"><tr className="border-b border-border text-xs font-bold uppercase text-muted-foreground"><th className="px-6 py-4">Order</th><th className="px-3 py-4">Customer</th><th className="px-3 py-4">Zone</th><th className="px-3 py-4">Issue</th><th className="px-3 py-4">Risk score</th><th className="px-5 py-4">Rescue actions</th></tr></thead>
              <tbody>{visible.map((order) => {
                const level = riskLevel(order.score);
                const acts = applied[order.id] ?? new Set<ActionType>();
                return <tr key={order.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/50"><td className="whitespace-nowrap px-6 py-4 font-mono text-sm font-semibold">{order.id}</td><td className="whitespace-nowrap px-3 py-4 font-semibold">{order.customer}</td><td className="px-3 py-4 font-medium">{order.zone}</td><td className="px-3 py-4 font-medium">{order.reason}</td><td className="px-3 py-4"><span className={`inline-flex min-w-26 items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-extrabold ${RISK_STYLES[level]}`}><span className={`size-2 rounded-full ${RISK_DOT[level]}`} />{order.score} · {level}</span></td><td className="px-5 py-3">{level !== "Low" ? <div className="grid max-w-[370px] grid-cols-2 gap-2">{(Object.keys(ACTION_LABELS) as ActionType[]).map((action) => <Button key={action} variant="outline" size="sm" disabled={acts.has(action)} onClick={() => applyAction(order.id, action)} className="h-9 justify-start rounded-md px-3 text-xs font-bold">{acts.has(action) ? "✓ " : ""}{ACTION_LABELS[action]}</Button>)}</div> : <span className="inline-flex items-center gap-1 text-sm font-bold text-risk-low">✓ {acts.size ? "Rescued" : "Low risk"}</span>}</td></tr>;
              })}</tbody>
            </table>
          </div>
        </section>

        <section className="mt-9 grid gap-4 lg:grid-cols-2" aria-label="Delivery insights">
          <div className="rounded-lg border border-border bg-card p-5 shadow-panel sm:p-6"><p className="text-xs font-bold uppercase text-muted-foreground">Retention</p><h2 className="mt-1 text-xl font-bold text-foreground">Do customers come back?</h2><p className="mt-1 text-sm text-muted-foreground">30-day reorder rate by first-order experience</p><div className="mt-6 h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={cohortData} layout="vertical" margin={{ left: 0, right: 46, top: 10, bottom: 6 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" /><XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="label" width={118} tick={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [`${value}%`, "Reorder rate"]} contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: 8 }} /><Bar dataKey="reorderRate" radius={[0, 4, 4, 0]} barSize={38}><Cell fill="var(--risk-low)" /><Cell fill="var(--risk-high)" /><LabelList dataKey="reorderRate" position="right" formatter={(value: unknown) => `${value}%`} fill="var(--foreground)" fontSize={14} fontWeight={700} /></Bar></BarChart></ResponsiveContainer></div><p className="mt-4 rounded-md bg-risk-high-soft px-4 py-3 text-sm font-semibold text-risk-high"><ArrowDownRight className="mr-1 inline size-4" /> A late first order cuts repeat purchases by more than half.</p></div>
          <div className="rounded-lg border border-border bg-card p-5 shadow-panel sm:p-6"><p className="text-xs font-bold uppercase text-muted-foreground">Root causes</p><h2 className="mt-1 text-xl font-bold text-foreground">Why orders fail</h2><p className="mt-1 text-sm text-muted-foreground">Risky orders by root cause</p><div className="mt-6 h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={failureBreakdown} margin={{ left: 0, right: 10, top: 24, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="reason" interval={0} tick={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [value, "Risky orders"]} contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: 8 }} /><Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={48}>{failureBreakdown.map((item) => <Cell key={item.reason} fill={REASON_COLORS[item.reason]} />)}<LabelList dataKey="count" position="top" fill="var(--foreground)" fontSize={14} fontWeight={700} /></Bar></BarChart></ResponsiveContainer></div><p className="mt-4 rounded-md bg-secondary px-4 py-3 text-sm font-semibold text-foreground"><Activity className="mr-1 inline size-4 text-risk-low" /> {biggestCause?.reason ?? "Rider availability"} is the biggest cause.</p></div>
        </section>

        <section className="mt-9 rounded-lg border border-border bg-card p-5 shadow-panel sm:p-6"><p className="text-xs font-bold uppercase text-muted-foreground">Impact simulator</p><h2 className="mt-1 text-xl font-bold text-foreground">What is fixing this worth?</h2><p className="mt-1 text-sm text-muted-foreground">Model monthly savings from improved delivery performance</p><div className="mt-7 grid gap-8 md:grid-cols-2"><div><div className="flex items-center justify-between text-sm"><label htmlFor="late" className="font-semibold text-foreground">Reduce late orders</label><span className="font-bold text-foreground">{lateReduction}%</span></div><input id="late" type="range" min={0} max={100} value={lateReduction} onChange={(e) => setLateReduction(Number(e.target.value))} className="mt-4 w-full accent-risk-low" /><p className="mt-2 text-sm text-muted-foreground">Saves <strong className="text-foreground">{formatINR(savings.lateSaved)}/mo</strong> in retained customers</p></div><div><div className="flex items-center justify-between text-sm"><label htmlFor="cancel" className="font-semibold text-foreground">Reduce cancellations</label><span className="font-bold text-foreground">{cancelReduction}%</span></div><input id="cancel" type="range" min={0} max={100} value={cancelReduction} onChange={(e) => setCancelReduction(Number(e.target.value))} className="mt-4 w-full accent-risk-low" /><p className="mt-2 text-sm text-muted-foreground">Recovers <strong className="text-foreground">{formatINR(savings.cancelSaved)}/mo</strong> in lost order value</p></div></div><div className="mt-7 flex flex-wrap items-baseline justify-between gap-2 rounded-md bg-secondary px-5 py-4"><span className="text-sm font-semibold text-muted-foreground">Total projected monthly savings</span><span className="text-2xl font-extrabold text-foreground">{formatINR(savings.total)} <ArrowUpRight className="inline size-5 text-risk-low" /></span></div></section>
      </main>
    </div>
  );
}

function Metric({ label, value, detail, icon, note }: { label: string; value: string; detail: string; icon: ReactNode; note?: string }) {
  return <div className="min-h-36 rounded-lg border border-border bg-card p-4 shadow-panel sm:p-5"><div className="flex items-start justify-between gap-2"><p className="text-xs font-bold uppercase leading-snug text-muted-foreground">{label}</p><span className="text-risk-low">{icon}</span></div><p className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">{value}</p><p className="mt-1 text-xs font-medium text-muted-foreground">{detail}</p>{note && <p className="mt-2 text-xs font-semibold text-risk-high">{note}</p>}</div>;
}
