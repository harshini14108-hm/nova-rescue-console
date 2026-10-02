import { Link, useLocation } from "@tanstack/react-router";
import { Activity, ArrowUpRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewTab = "customer" | "partner" | "ops";
const tabs: { id: ViewTab; label: string; number: string }[] = [
  { id: "customer", label: "Customer App", number: "01" },
  { id: "partner", label: "Partner Store Hub", number: "02" },
  { id: "ops", label: "Nova Ops Control", number: "03" },
];
const story = ["Inventory Problem", "Product Unavailability", "Failed Orders", "Customer Frustration", "Lower Retention"];

export function AppHeader({ activeTab, onTabChange, onReset }: { activeTab?: ViewTab; onTabChange?: (tab: ViewTab) => void; onReset?: () => void }) {
  const path = useLocation().pathname;
  return (
    <header className="border-b border-border bg-background text-foreground">
      <div className="mx-auto max-w-[1480px] px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-4 sm:flex sm:justify-between">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="NOVA PULSE home">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Activity size={23} strokeWidth={2.5} /></span>
            <span className="min-w-0"><span className="block truncate text-lg font-extrabold text-foreground">NOVA<span className="text-primary"> PULSE</span></span><span className="block truncate text-[11px] font-medium text-muted-foreground">Local Commerce Reliability Engine</span></span>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4"><span className="hidden rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-primary sm:inline-flex">● Simulated data</span>{path === "/summary" ? <Link to="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">Console</Link> : <Link to="/summary" className="hidden items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground sm:inline-flex">Summary <ArrowUpRight size={14} /></Link>}{onReset && <Button variant="outline" size="sm" onClick={onReset} className="h-9 border-border bg-card text-foreground hover:bg-secondary"><RotateCcw size={14} /> <span className="hidden sm:inline">Reset Demo</span><span className="sm:hidden">Reset</span></Button>}</div>
        </div>
        <div className="border-b border-border py-3"><div className="flex items-center gap-2 overflow-x-auto text-xs text-muted-foreground [scrollbar-width:none]"><span className="shrink-0 font-bold uppercase text-primary">Story Chain</span><span className="mx-1 text-border">|</span>{story.map((item, index) => <span key={item} className="flex shrink-0 items-center gap-2"><span className="font-bold text-primary">0{index + 1}</span> {item}{index < story.length - 1 && <span className="ml-1 text-primary/70">→</span>}</span>)}</div></div>
        {onTabChange && <nav aria-label="Main views" className="flex gap-1 overflow-x-auto pt-2 [scrollbar-width:none]">{tabs.map((tab) => <Button key={tab.id} variant="ghost" onClick={() => onTabChange(tab.id)} aria-current={activeTab === tab.id ? "page" : undefined} className={`h-12 shrink-0 rounded-b-none rounded-t-lg border-b-2 px-4 text-xs font-bold uppercase sm:px-6 sm:text-sm ${activeTab === tab.id ? "border-primary bg-card text-primary hover:bg-card hover:text-primary" : "border-transparent text-muted-foreground hover:bg-card hover:text-foreground"}`}><span className="text-[10px] opacity-60">{tab.number}</span> {tab.label}</Button>)}</nav>}
      </div>
    </header>
  );
}
