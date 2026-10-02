import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  orders,
  riskLevel,
  ACTION_IMPACT,
  ACTION_LABELS,
  cohortData,
  failureBreakdown,
  savingsFromSliders,
  formatINR,
  type ActionType,
  type RiskLevel,
} from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NOVA CART Rescue Console" },
      { name: "description", content: "Simulated ops console: spot risky orders, rescue them, and see how delivery reliability drives repeat revenue." },
      { property: "og:title", content: "NOVA CART Rescue Console" },
      { property: "og:description", content: "Growth is hiding a delivery problem. Simulated data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const RISK_STYLES: Record<RiskLevel, string> = {
  High: "bg-risk-high/15 text-risk-high border-risk-high/40",
  Medium: "bg-risk-medium/15 text-risk-medium border-risk-medium/40",
  Low: "bg-risk-low/15 text-risk-low border-risk-low/40",
};

const RISK_DOT: Record<RiskLevel, string> = {
  High: "bg-risk-high",
  Medium: "bg-risk-medium",
  Low: "bg-risk-low",
};

function Dashboard() {
  // score reductions per order id, keyed by action
  const [applied, setApplied] = useState<Record<string, Set<ActionType>>>({});
  const [filter, setFilter] = useState<RiskLevel | "All">("All");
  const [lateReduction, setLateReduction] = useState(30);
  const [cancelReduction, setCancelReduction] = useState(30);

  const scoreFor = (id: string, base: number) => {
    const acts = applied[id];
    if (!acts) return base;
    let s = base;
    acts.forEach((a) => (s -= ACTION_IMPACT[a]));
    return Math.max(2, s);
  };

  const applyAction = (id: string, action: ActionType) => {
    setApplied((prev) => {
      const next = { ...prev };
      const set = new Set(next[id] ?? []);
      set.add(action);
      next[id] = set;
      return next;
    });
  };

  const enriched = useMemo(
    () => orders.map((o) => ({ ...o, score: scoreFor(o.id, o.baseScore) })),
    [applied]
  );

  const counts = useMemo(() => {
    const c: Record<RiskLevel, number> = { High: 0, Medium: 0, Low: 0 };
    enriched.forEach((o) => c[riskLevel(o.score)]++);
    return c;
  }, [enriched]);

  const visible = filter === "All" ? enriched : enriched.filter((o) => riskLevel(o.score) === filter);
  const savings = savingsFromSliders(lateReduction, cancelReduction);
  const maxFailure = Math.max(...failureBreakdown.map((f) => f.count));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Simulated data · Ops demo</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">NOVA CART Rescue Console</h1>
          <p className="mt-1 text-sm text-muted-foreground">Spot risky orders, rescue them, and see what reliability is worth.</p>
        </div>
        <Link to="/summary" className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
          View summary →
        </Link>
      </header>

      {/* Risk overview */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {(["High", "Medium", "Low"] as RiskLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => setFilter(filter === level ? "All" : level)}
            className={`rounded-xl border bg-card p-5 text-left transition-colors hover:bg-accent ${filter === level ? "border-primary" : "border-border"}`}
          >
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${RISK_DOT[level]}`} />
              <span className="text-sm font-medium text-muted-foreground">{level} risk</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{counts[level]}</p>
          </button>
        ))}
      </section>

      {/* Orders table */}
      <section className="mt-8 rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Live orders ({visible.length})</h2>
          {filter !== "All" && (
            <button onClick={() => setFilter("All")} className="text-sm text-primary hover:underline">
              Clear filter
            </button>
          )}
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3">Order</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Zone</th>
                <th className="px-3 py-3">Issue</th>
                <th className="px-3 py-3">Risk</th>
                <th className="px-5 py-3">Rescue actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => {
                const level = riskLevel(o.score);
                const acts = applied[o.id] ?? new Set<ActionType>();
                const risky = level !== "Low";
                return (
                  <tr key={o.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{o.id}</td>
                    <td className="px-3 py-3 text-foreground">{o.customer}</td>
                    <td className="px-3 py-3 text-muted-foreground">{o.zone}</td>
                    <td className="px-3 py-3 text-muted-foreground">{o.reason}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${RISK_STYLES[level]}`}>
                        {o.score} · {level}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {risky ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(Object.keys(ACTION_LABELS) as ActionType[]).map((a) => (
                            <button
                              key={a}
                              disabled={acts.has(a)}
                              onClick={() => applyAction(o.id, a)}
                              className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {acts.has(a) ? "✓ " : ""}{ACTION_LABELS[a]}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-risk-low">Rescued ✓</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cohort chart + failure reasons */}
      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Do customers come back?</h2>
          <p className="mt-1 text-sm text-muted-foreground">30-day reorder rate by first-order experience</p>
          <div className="mt-6 space-y-5">
            {cohortData.map((c, i) => (
              <div key={c.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{c.label}</span>
                  <span className="font-semibold text-foreground">{c.reorderRate}%</span>
                </div>
                <div className="mt-2 h-4 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${i === 0 ? "bg-risk-low" : "bg-risk-high"}`}
                    style={{ width: `${c.reorderRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            A late first order cuts repeat purchases by more than half.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Why orders fail</h2>
          <p className="mt-1 text-sm text-muted-foreground">Risky orders by root cause</p>
          <div className="mt-6 space-y-5">
            {failureBreakdown.map((f) => (
              <div key={f.reason}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{f.reason}</span>
                  <span className="font-semibold text-foreground">{f.count}</span>
                </div>
                <div className="mt-2 h-4 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(f.count / maxFailure) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Savings sliders */}
      <section className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground">What is fixing this worth?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Drag the sliders to model monthly savings (simulated)</p>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="late" className="text-foreground">Reduce late orders</label>
              <span className="font-semibold text-foreground">{lateReduction}%</span>
            </div>
            <input
              id="late"
              type="range"
              min={0}
              max={100}
              value={lateReduction}
              onChange={(e) => setLateReduction(Number(e.target.value))}
              className="mt-3 w-full accent-primary"
            />
            <p className="mt-2 text-sm text-muted-foreground">Saves {formatINR(savings.lateSaved)}/mo in retained customers</p>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm">
              <label htmlFor="cancel" className="text-foreground">Reduce cancellations</label>
              <span className="font-semibold text-foreground">{cancelReduction}%</span>
            </div>
            <input
              id="cancel"
              type="range"
              min={0}
              max={100}
              value={cancelReduction}
              onChange={(e) => setCancelReduction(Number(e.target.value))}
              className="mt-3 w-full accent-primary"
            />
            <p className="mt-2 text-sm text-muted-foreground">Recovers {formatINR(savings.cancelSaved)}/mo in lost order value</p>
          </div>
        </div>
        <div className="mt-6 rounded-lg bg-primary/10 px-4 py-3 text-center">
          <span className="text-sm text-muted-foreground">Total projected monthly savings: </span>
          <span className="text-xl font-bold text-foreground">{formatINR(savings.total)}</span>
        </div>
      </section>
    </main>
  );
}
