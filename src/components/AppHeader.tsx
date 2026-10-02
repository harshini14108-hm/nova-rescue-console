import { Link, useLocation } from "@tanstack/react-router";
import { Activity, ArrowUpRight } from "lucide-react";

export function AppHeader() {
  const path = useLocation().pathname;

  return (
    <header className="border-b border-header-border bg-header text-header-foreground">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-3" aria-label="NOVA CART Rescue Console home">
          <span className="flex size-10 items-center justify-center rounded-md bg-header-accent text-header-accent-foreground"><Activity size={22} strokeWidth={2.5} /></span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-extrabold">NOVA CART <span className="font-medium text-header-muted">/ Rescue Console</span></span>
            <span className="text-[11px] font-medium text-header-muted">Delivery operations intelligence</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-5" aria-label="Main navigation">
          <span className="hidden items-center gap-1.5 rounded-md border border-header-border px-2.5 py-1 text-[11px] font-semibold text-header-muted sm:inline-flex"><span className="size-1.5 rounded-full bg-risk-low" /> Simulated data</span>
          <Link to="/" className={`px-2 py-2 text-sm font-semibold transition-colors hover:text-header-foreground ${path === "/" ? "text-header-foreground" : "text-header-muted"}`}>Overview</Link>
          <Link to="/summary" className={`inline-flex items-center gap-1 px-2 py-2 text-sm font-semibold transition-colors hover:text-header-foreground ${path === "/summary" ? "text-header-foreground" : "text-header-muted"}`}>Summary <ArrowUpRight size={14} /></Link>
        </nav>
      </div>
    </header>
  );
}