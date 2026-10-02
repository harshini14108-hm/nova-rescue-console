import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Clock3, IndianRupee, RotateCcw, ShieldAlert, ChevronDown, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  orders, riskLevel, ACTION_IMPACT, ACTION_LABELS, cohortData, failureBreakdown,
  savingsFromSliders, formatINR, CANCEL_RATE, type ActionType, type RiskLevel, type FailureReason,
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
const REASON_COLORS: Record<FailureReason, string> = {
  "Out of stock": "var(--chart-1)",
  "No riders": "var(--chart-2)",
  "Peak hour rush": "var(--chart-3)",
};
const BEST_ACTION: Record<FailureReason, ActionType> = { "No riders": "reassign", "Out of stock": "substitute", "Peak hour rush": "priority" };
const averageEta = Math.round(orders.reduce((sum, order) => sum + order.etaMinutes, 0) / orders.length);
const monthlyRevenueAtRisk = savingsFromSliders(100, 100).total;
const biggestCause = [...failureBreakdown].sort((a, b) => b.count - a.count)[0];

function Dashboard() {
  const [applied, setApplied] = useState<Record<string, Set<ActionType>>>({});
  const [filter, setFilter] = useState<RiskLevel | "All">("All");
  const [lateReduction, setLateReduction] = useState(30);
  const [cancelReduction, setCancelReduction] = useState(30);
  const [rescueResult, setRescueResult] = useState<{ count: number; total: number } | null>(null);
  const [displayedSaved, setDisplayedSaved] = useState(0);

  useEffect(() => {
    if (!rescueResult) return;
    const end = rescueResult.total;
    const start = displayedSaved;
    const began = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - began) / 900, 1);
      setDisplayedSaved(Math.round(start + (end - start) * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayedSaved(end);
    } else {
      frame = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(frame);
  }, [rescueResult]);

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
  const rescueCandidates = enriched
    .filter((order) => riskLevel(order.score) !== "Low" && !applied[order.id]?.has(BEST_ACTION[order.reason]))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 10);

  const rescueTopTen = () => {
    if (!rescueCandidates.length) return;
    const rescuedValue = rescueCandidates.reduce((total, order) =>
      total + Math.round(order.value * Math.min(order.score - 2, ACTION_IMPACT[BEST_ACTION[order.reason]]) / 100), 0);
    setApplied((prev) => {
      const next = { ...prev };
      rescueCandidates.forEach((order) => {
        next[order.id] = new Set([...(next[order.id] ?? []), BEST_ACTION[order.reason]]);
      });
      return next;
    });
    setRescueResult((prev) => ({ count: rescueCandidates.length, total: (prev?.total ?? 0) + rescuedValue }));
  };

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
          <Metric label="Repeat rate" value={`${cohortData[0]?.reorderRate ?? 0}%`} detail="After an on-time first order" icon={<RotateCcw size={18} />} note="Late first order: 20%" />
          <Metric label="Cancel rate" value={`${Math.round(CANCEL_RATE * 100)}%`} detail="Of monthly orders" icon={<ArrowDownRight size={18} />} />
          <Metric label="Avg delivery time" value={`${averageEta} min`} detail="Across 200 sample orders" icon={<Clock3 size={18} />} />
          <Metric label="Revenue at risk / month" value={formatINR(monthlyRevenueAtRisk)} detail="Estimated recoverable value" icon={<IndianRupee size={18} />} />
        </section>

        <section className="mt-5 grid gap-4 border-y border-border py-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-center" aria-label="First-order impact">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">First-order experience</p>
            <h2 className="mt-1 text-lg font-bold text-foreground">Repeat rate after an on-time first order: <span className="text-risk-low">55%</span></h2>
            <p className="mt-1 text-lg font-bold text-foreground">After a late first order: <span className="text-risk-high">20%</span></p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">Late first orders lose 2 out of 3 repeat customers</p>
          </div>
          <div className="md:text-right">
            <p className="text-xs font-bold uppercase text-muted-foreground">Revenue at risk / month</p>
            <p className="mt-1 text-5xl font-extrabold text-foreground sm:text-6xl">{formatINR(monthlyRevenueAtRisk)}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Estimated · Simulated data</p>
          </div>
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

        <section className="mt-9 rounded-lg border border-border bg-card shadow-panel" aria-label="Live orders">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-5 sm:flex sm:justify-between sm:px-6">
            <div className="min-w-0"><p className="text-xs font-bold uppercase text-muted-foreground">Rescue queue</p><h2 className="mt-1 truncate text-xl font-bold text-foreground">Live Orders <span className="text-muted-foreground">({visible.length})</span></h2></div>
            <div className="flex shrink-0 items-center gap-2"><span className="hidden text-xs font-medium text-muted-foreground lg:inline">Highest risk first</span>{filter !== "All" && <Button variant="outline" size="sm" onClick={() => setFilter("All")}>Clear filter</Button>}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-secondary/50 px-4 py-4 sm:px-6">
            <Button onClick={rescueTopTen} disabled={!rescueCandidates.length} className="h-10 px-4 font-bold"><Sparkles size={16} /> Rescue top 10 orders</Button>
            {rescueResult && <p role="status" aria-live="polite" className="text-sm font-bold text-risk-low">{rescueResult.count} orders rescued, ₹{displayedSaved.toLocaleString("en-IN")} saved</p>}
          </div>
          <div className="max-h-[570px] overflow-y-auto overflow-x-hidden">
            <table className="w-full table-fixed text-left text-sm text-foreground">
              <colgroup><col className="w-[31%] sm:w-[18%]" /><col className="hidden w-[19%] sm:table-column" /><col className="hidden w-[18%] lg:table-column" /><col className="hidden w-[21%] md:table-column" /><col className="w-[36%] sm:w-[25%] md:w-[18%] lg:w-[14%]" /><col className="w-[33%] sm:w-[38%] md:w-[24%] lg:w-[10%]" /></colgroup>
              <thead className="sticky top-0 z-10 bg-secondary"><tr className="border-b border-border text-xs font-bold uppercase text-muted-foreground"><th className="px-3 py-4 sm:px-5">Order</th><th className="hidden px-2 py-4 sm:table-cell">Customer</th><th className="hidden px-2 py-4 lg:table-cell">Zone</th><th className="hidden px-2 py-4 md:table-cell">Issue</th><th className="px-1 py-4 sm:px-2">Risk</th><th className="px-2 py-4 sm:px-3">Actions</th></tr></thead>
              <tbody>{visible.map((order) => {
                const level = riskLevel(order.score);
                const acts = applied[order.id] ?? new Set<ActionType>();
                return <tr key={order.id} className="border-b border-border/70 last:border-0 hover:bg-secondary/50"><td className="truncate px-3 py-4 font-mono text-xs font-semibold sm:px-5 sm:text-sm" title={order.id}>{order.id}<span className="mt-1 block truncate font-sans text-xs text-muted-foreground sm:hidden">{order.customer}</span></td><td className="hidden truncate px-2 py-4 font-semibold sm:table-cell">{order.customer}</td><td className="hidden truncate px-2 py-4 font-medium lg:table-cell">{order.zone}</td><td className="hidden truncate px-2 py-4 font-medium md:table-cell">{order.reason}</td><td className="px-1 py-4 sm:px-2"><span className={`inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-1.5 text-xs font-extrabold sm:px-2.5 sm:text-sm ${RISK_STYLES[level]}`}><span className={`hidden size-2 shrink-0 rounded-full sm:inline-block ${RISK_DOT[level]}`} />{order.score} · {level}</span></td><td className="px-2 py-3 sm:px-3"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-9 w-full max-w-32 justify-between gap-1 px-2 text-xs font-bold sm:px-3 sm:text-sm" aria-label={`Rescue actions for ${order.id}`}>Actions <ChevronDown size={14} /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52">{(Object.keys(ACTION_LABELS) as ActionType[]).map((action) => <DropdownMenuItem key={action} disabled={acts.has(action)} onSelect={() => applyAction(order.id, action)} className="py-2.5 font-medium">{acts.has(action) ? "✓ " : ""}{action === "coupon" ? "Send Coupon" : ACTION_LABELS[action]}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></td></tr>;
              })}</tbody>
            </table>
          </div>
        </section>

        <section className="mt-9 grid gap-4 lg:grid-cols-2" aria-label="Delivery insights">
          <div className="rounded-lg border border-border bg-card p-5 shadow-panel sm:p-6"><p className="text-xs font-bold uppercase text-muted-foreground">Retention</p><h2 className="mt-1 text-xl font-bold text-foreground">Do customers come back?</h2><p className="mt-1 text-sm text-muted-foreground">30-day reorder rate by first-order experience</p><div className="mt-6 h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={cohortData.map((item) => ({ ...item, shortLabel: item.label === "First order on time" ? "On time" : "Late" }))} margin={{ left: 0, right: 8, top: 24, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="shortLabel" tick={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 70]} tickFormatter={(v) => `${v}%`} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [`${value}%`, "Reorder rate"]} contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: 8 }} /><Bar dataKey="reorderRate" radius={[6, 6, 0, 0]} barSize={56}><Cell fill="var(--chart-2)" /><Cell fill="var(--chart-1)" /><LabelList dataKey="reorderRate" position="top" formatter={(value: unknown) => `${value}%`} fill="var(--foreground)" fontSize={14} fontWeight={700} /></Bar></BarChart></ResponsiveContainer></div><p className="mt-4 rounded-md bg-risk-high-soft px-4 py-3 text-sm font-semibold text-risk-high"><ArrowDownRight className="mr-1 inline size-4" /> Late first orders lose 2 out of 3 repeat customers.</p></div>
          <div className="rounded-lg border border-border bg-card p-5 shadow-panel sm:p-6"><p className="text-xs font-bold uppercase text-muted-foreground">Root causes</p><h2 className="mt-1 text-xl font-bold text-foreground">Why orders fail</h2><p className="mt-1 text-sm text-muted-foreground">Share of risky orders by root cause</p><div className="mt-6 h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={failureBreakdown.map((item) => ({ ...item, percent: Math.round(item.count / failureBreakdown.reduce((sum, cause) => sum + cause.count, 0) * 100) }))} margin={{ left: 0, right: 10, top: 24, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" /><XAxis dataKey="reason" interval={0} tick={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 50]} tickFormatter={(v) => `${v}%`} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value, name) => [name === "percent" ? `${value}%` : value, name === "percent" ? "Share of risky orders" : "Risky orders"]} contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: 8 }} /><Bar dataKey="percent" radius={[6, 6, 0, 0]} barSize={48}>{failureBreakdown.map((item) => <Cell key={item.reason} fill={REASON_COLORS[item.reason]} />)}<LabelList dataKey="percent" position="top" formatter={(value: unknown) => `${value}%`} fill="var(--foreground)" fontSize={14} fontWeight={700} /></Bar></BarChart></ResponsiveContainer></div><p className="mt-4 inline-flex items-center gap-2 rounded-md bg-risk-low-soft px-3 py-2 text-sm font-semibold text-risk-low"><Activity size={15} /> No riders · biggest cause</p></div>
        </section>

        <section className="mt-9 rounded-lg border border-border bg-card p-5 shadow-panel sm:p-6"><p className="text-xs font-bold uppercase text-muted-foreground">Impact simulator</p><h2 className="mt-1 text-xl font-bold text-foreground">What is fixing this worth?</h2><p className="mt-1 text-sm text-muted-foreground">Model monthly savings from improved delivery performance</p><div className="mt-7 grid gap-8 md:grid-cols-2"><div><div className="flex items-center justify-between text-sm"><label htmlFor="late" className="font-semibold text-foreground">Reduce late orders</label><span className="font-bold text-foreground">{lateReduction}%</span></div><input id="late" type="range" min={0} max={100} value={lateReduction} onChange={(e) => setLateReduction(Number(e.target.value))} className="mt-4 w-full accent-risk-low" /><p className="mt-2 text-sm text-muted-foreground">Saves <strong className="text-foreground">{formatINR(savings.lateSaved)}/mo</strong> in retained customers</p></div><div><div className="flex items-center justify-between text-sm"><label htmlFor="cancel" className="font-semibold text-foreground">Reduce cancellations</label><span className="font-bold text-foreground">{cancelReduction}%</span></div><input id="cancel" type="range" min={0} max={100} value={cancelReduction} onChange={(e) => setCancelReduction(Number(e.target.value))} className="mt-4 w-full accent-risk-low" /><p className="mt-2 text-sm text-muted-foreground">Recovers <strong className="text-foreground">{formatINR(savings.cancelSaved)}/mo</strong> in lost order value</p></div></div><div className="mt-7 flex flex-wrap items-baseline justify-between gap-2 rounded-md bg-secondary px-5 py-4"><span className="text-sm font-semibold text-muted-foreground">Total projected monthly savings</span><span className="text-2xl font-extrabold text-foreground">{formatINR(savings.total)} <ArrowUpRight className="inline size-5 text-risk-low" /></span></div></section>
      </main>
    </div>
  );
}

function Metric({ label, value, detail, icon, note }: { label: string; value: string; detail: string; icon: ReactNode; note?: string }) {
  return <div className="min-h-36 rounded-lg border border-border bg-card p-4 shadow-panel sm:p-5"><div className="flex items-start justify-between gap-2"><p className="text-xs font-bold uppercase leading-snug text-muted-foreground">{label}</p><span className="text-risk-low">{icon}</span></div><p className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">{value}</p><p className="mt-1 text-xs font-medium text-muted-foreground">{detail}</p>{note && <p className="mt-2 text-xs font-semibold text-risk-high">{note}</p>}</div>;
}
