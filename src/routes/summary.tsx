import { createFileRoute, Link } from "@tanstack/react-router";
import { orders, cohortData, failureBreakdown, MONTHLY_ORDERS, LATE_RATE, CANCEL_RATE, formatINR } from "@/lib/data";

export const Route = createFileRoute("/summary")({
  head: () => ({
    meta: [
      { title: "Summary — NOVA CART Rescue Console" },
      { name: "description", content: "Growth is hiding a delivery problem. Simulated executive summary for NOVA CART." },
      { property: "og:title", content: "Summary — NOVA CART Rescue Console" },
      { property: "og:description", content: "Growth is hiding a delivery problem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SummaryPage,
});

function SummaryPage() {
  const high = orders.filter((o) => o.baseScore >= 70).length;
  const medium = orders.filter((o) => o.baseScore >= 40 && o.baseScore < 70).length;
  const topReason = [...failureBreakdown].sort((a, b) => b.count - a.count)[0]!;
  const reorderGap = cohortData[0]!.reorderRate - cohortData[1]!.reorderRate;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Simulated data · Executive summary</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
        Growth is hiding a delivery problem.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Order volume is up, but late deliveries and cancellations are quietly eroding repeat purchases. The leak is in the last mile, not in demand.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-3xl font-bold text-risk-high">{high}</p>
          <p className="mt-1 text-sm text-muted-foreground">high-risk orders right now (+{medium} medium)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-3xl font-bold text-foreground">{reorderGap} pts</p>
          <p className="mt-1 text-sm text-muted-foreground">lower reorder rate after a late first order</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-3xl font-bold text-foreground">{topReason.reason}</p>
          <p className="mt-1 text-sm text-muted-foreground">top failure reason ({topReason.count} risky orders)</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">What the numbers say</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-risk-high" /> {Math.round(LATE_RATE * 100)}% of {MONTHLY_ORDERS.toLocaleString()} monthly orders arrive late; each late first order cuts the chance of a second order by more than half.</li>
          <li className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-risk-medium" /> {Math.round(CANCEL_RATE * 100)}% of orders are cancelled, mostly from stock-outs and rider shortages during peak hours.</li>
          <li className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-risk-low" /> Fixing the top failure reason alone protects an estimated {formatINR(topReason.count * 900)} in monthly repeat revenue.</li>
        </ul>
      </div>

      <div className="mt-8 rounded-xl border border-primary/30 bg-primary/10 p-6">
        <h2 className="text-lg font-semibold text-foreground">Recommendation</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Treat delivery reliability as a growth metric, not an ops metric. Staff riders for peak hours, auto-substitute out-of-stock items, and trigger apology coupons on every order predicted late — before the customer complains.
        </p>
      </div>

      <Link to="/" className="mt-10 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
        Back to Rescue Console
      </Link>
    </main>
  );
}
