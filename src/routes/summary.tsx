import { createFileRoute, Link } from "@tanstack/react-router";
import { orders, cohortData, failureBreakdown, MONTHLY_ORDERS, LATE_RATE, CANCEL_RATE, formatINR } from "@/lib/data";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight, CircleAlert } from "lucide-react";

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
  const topReason = [...failureBreakdown].sort((a, b) => b.count - a.count)[0];
  const reorderGap = (cohortData[0]?.reorderRate ?? 0) - (cohortData[1]?.reorderRate ?? 0);

  return (
    <div className="min-h-screen bg-background">
    <AppHeader />
    <main className="mx-auto max-w-5xl px-5 pb-16 pt-9 sm:px-8 lg:px-10">
      <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase text-risk-low">Executive summary</p><span className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-panel">Simulated data</span></div>
      <h1 className="mt-7 max-w-3xl text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
        Growth is hiding a delivery problem.
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Order volume is up, but late deliveries and cancellations are quietly eroding repeat purchases. The leak is in the last mile, not in demand.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <p className="text-3xl font-bold text-risk-high">{high}</p>
          <p className="mt-1 text-sm text-muted-foreground">high-risk orders right now (+{medium} medium)</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <p className="text-3xl font-bold text-foreground">{reorderGap} pts</p>
          <p className="mt-1 text-sm text-muted-foreground">lower reorder rate after a late first order</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-panel">
          <p className="text-2xl font-bold text-foreground">{topReason?.reason ?? "—"}</p>
          <p className="mt-1 text-sm text-muted-foreground">top failure reason ({topReason?.count ?? 0} risky orders)</p>
        </div>
      </div>

      <section className="mt-8 border-t border-border pt-8">
        <h2 className="text-lg font-semibold text-foreground">What the numbers say</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-risk-high" /> {Math.round(LATE_RATE * 100)}% of {MONTHLY_ORDERS.toLocaleString()} monthly orders arrive late; each late first order cuts the chance of a second order by more than half.</li>
          <li className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-risk-medium" /> {Math.round(CANCEL_RATE * 100)}% of orders are cancelled, mostly from stock-outs and rider shortages during peak hours.</li>
          <li className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-risk-low" /> Fixing the top failure reason alone protects an estimated {formatINR((topReason?.count ?? 0) * 900)} in monthly repeat revenue.</li>
        </ul>
      </section>

      <section className="mt-8 rounded-lg bg-header p-6 text-header-foreground shadow-panel sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-bold"><CircleAlert size={21} className="text-header-accent" /> Recommendation</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-header-muted">
          Treat delivery reliability as a growth metric, not an ops metric. Staff riders for peak hours, auto-substitute out-of-stock items, and trigger apology coupons on every order predicted late — before the customer complains.
        </p>
      </section>

      <Button asChild className="mt-9 h-11 px-5"><Link to="/"><ArrowLeft size={16} /> Back to Rescue Console <ArrowUpRight size={15} /></Link></Button>
    </main>
    </div>
  );
}
