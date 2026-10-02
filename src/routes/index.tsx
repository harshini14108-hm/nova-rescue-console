import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Clock3, IndianRupee, RotateCcw, ShieldAlert, ChevronDown, Sparkles, Search, MapPin, ShoppingBasket, CheckCircle2, PackageCheck, Store, AlertTriangle, TrendingUp, Milk, Egg, Wheat, Apple, Cookie, CupSoda, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { AppHeader, type ViewTab } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import marketImage from "@/assets/grocery-market.jpg";
import {
  orders, riskLevel, ACTION_IMPACT, ACTION_LABELS, cohortData, failureBreakdown,
  savingsFromSliders, formatINR, stores, products, categories,
  type ActionType, type RiskLevel, type FailureReason,
} from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "NOVA PULSE | Local Commerce Reliability Engine" },
    { name: "description", content: "A simulated local commerce experience connecting stock confidence, partner stores, and delivery recovery." },
    { property: "og:title", content: "NOVA PULSE | Local Commerce Reliability Engine" },
    { property: "og:description", content: "Explore the simulated journey from inventory reliability to customer retention." },
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
const CONFIDENCE_STYLES: Record<RiskLevel, string> = {
  High: "border-risk-low/25 bg-risk-low-soft text-risk-low",
  Medium: "border-risk-medium/25 bg-risk-medium-soft text-risk-medium",
  Low: "border-risk-high/25 bg-risk-high-soft text-risk-high",
};
const PRODUCT_ICONS: Record<string, typeof Milk> = { milk: Milk, eggs: Egg, rice: Wheat, tomato: Apple, banana: Apple, chips: Cookie, juice: CupSoda };
const RISK_DOT: Record<RiskLevel, string> = { High: "bg-risk-high", Medium: "bg-risk-medium", Low: "bg-risk-low" };
const REASON_COLORS: Record<FailureReason, string> = { "Out of stock": "var(--chart-1)", "No riders": "var(--chart-2)", "Peak hour rush": "var(--chart-3)" };
const BEST_ACTION: Record<FailureReason, ActionType> = { "No riders": "reassign", "Out of stock": "substitute", "Peak hour rush": "priority" };
const monthlyRevenueAtRisk = savingsFromSliders(100, 100).total;
const opsTabs = ["Inventory-Risk Alerts", "At-Risk Customer Recovery", "Partner Reliability Matrix"] as const;
type OpsTab = typeof opsTabs[number];

type CartItem = { key: string; productId: string; storeId: string; quantity: number };

function Dashboard() {
  const [tab, setTab] = useState<ViewTab>("customer");
  const [opsTab, setOpsTab] = useState<OpsTab>("At-Risk Customer Recovery");
  const [storeId, setStoreId] = useState<string>(stores[0].id);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [confidenceOverrides, setConfidenceOverrides] = useState<Record<string, number>>({});
  const [auditCounts, setAuditCounts] = useState<Record<string, number>>({});
  const [applied, setApplied] = useState<Record<string, Set<ActionType>>>({});
  const [filter, setFilter] = useState<RiskLevel | "All">("All");
  const [lateReduction, setLateReduction] = useState(30);
  const [cancelReduction, setCancelReduction] = useState(30);
  const [rescueResult, setRescueResult] = useState<{ count: number; total: number } | null>(null);
  const [displayedSaved, setDisplayedSaved] = useState(0);

  const resetDemo = () => {
    setTab("customer"); setOpsTab("At-Risk Customer Recovery"); setStoreId(stores[0].id);
    setSearch(""); setCategory("All"); setCart([]); setConfidenceOverrides({}); setAuditCounts({});
    setApplied({}); setFilter("All"); setLateReduction(30); setCancelReduction(30);
    setRescueResult(null); setDisplayedSaved(0);
  };

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setDisplayedSaved(end);
    else frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [rescueResult]);

  const addToCart = (productId: string, sourceStoreId: string) => {
    const key = `${sourceStoreId}:${productId}`;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const available = Math.max(0, product.units - (cart.find((item) => item.key === key)?.quantity ?? 0));
    if (!available) return;
    setCart((previous) => {
      const existing = previous.find((item) => item.key === key);
      return existing ? previous.map((item) => item.key === key ? { ...item, quantity: item.quantity + 1 } : item) : [...previous, { key, productId, storeId: sourceStoreId, quantity: 1 }];
    });
  };
  const removeFromCart = (key: string) => setCart((previous) => previous.flatMap((item) => item.key === key ? item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : [] : [item]));
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (products.find((p) => p.id === item.productId)?.price ?? 0) * item.quantity, 0);
  const assignedStore = stores[0];
  const selectedStore = stores.find((store) => store.id === storeId) ?? stores[0];
  const stockChecks = products.filter((product) => product.storeId === selectedStore.id && (confidenceOverrides[product.id] ?? product.confidence) < 80);
  const urgentAudits = stockChecks.filter((product) => (confidenceOverrides[product.id] ?? product.confidence) < 60).length;
  const catalog = products.filter((product) => product.storeId === assignedStore.id && (category === "All" || product.category === category) && `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase()));
  const applyAction = (id: string, action: ActionType) => setApplied((prev) => ({ ...prev, [id]: new Set([...(prev[id] ?? []), action]) }));
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
  const visible = useMemo(() => enriched.filter((order) => filter === "All" || riskLevel(order.score) === filter).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)), [enriched, filter]);
  const savings = savingsFromSliders(lateReduction, cancelReduction);
  const rescueCandidates = enriched.filter((order) => riskLevel(order.score) !== "Low" && !applied[order.id]?.has(BEST_ACTION[order.reason])).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 10);
  const rescueTopTen = () => {
    if (!rescueCandidates.length) return;
    const rescuedValue = rescueCandidates.reduce((total, order) => total + Math.round(order.value * Math.min(order.score - 2, ACTION_IMPACT[BEST_ACTION[order.reason]]) / 100), 0);
    setApplied((prev) => { const next = { ...prev }; rescueCandidates.forEach((order) => { next[order.id] = new Set([...(next[order.id] ?? []), BEST_ACTION[order.reason]]); }); return next; });
    setRescueResult((prev) => ({ count: rescueCandidates.length, total: (prev?.total ?? 0) + rescuedValue }));
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activeTab={tab} onTabChange={setTab} onReset={resetDemo} />
      <main className="mx-auto max-w-[1480px] px-5 pb-20 pt-8 sm:px-8 lg:px-10">
        {tab === "customer" && <>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase text-primary">01 / Customer experience</p><h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Your neighborhood, delivered.</h1></div><span className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">Simulated data</span></div>
          <section className="relative isolate min-h-64 overflow-hidden rounded-lg border border-border" aria-label="Assigned local store"><img src={marketImage} width={1536} height={768} alt="Fresh groceries in a local kirana store" className="absolute inset-0 h-full w-full object-cover" /><div className="relative flex min-h-64 flex-col justify-end p-6 text-header-foreground sm:p-9"><p className="text-xs font-bold uppercase text-header-accent">Your assigned local store</p><h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{assignedStore.name}</h2><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold"><span className="flex items-center gap-1"><MapPin size={15} /> {assignedStore.area} · {assignedStore.distance} away</span><span className="flex items-center gap-1"><Clock3 size={15} /> {assignedStore.eta} delivery</span></div></div></section>
          <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]"><div className="min-w-0">
            <div className="relative"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><input aria-label="Search products" placeholder="Search fresh groceries..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-12 w-full rounded-lg border border-border bg-card pl-12 pr-4 text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" /></div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">{["All", ...categories].map((item) => <Button key={item} variant={category === item ? "default" : "outline"} onClick={() => setCategory(item)} className="shrink-0 rounded-full px-4 text-xs">{item}</Button>)}</div>
            <div className="mb-4 mt-8 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase text-primary">Live shelf view</p><h2 className="mt-1 text-xl font-bold">Shop essentials</h2></div><p className="text-xs text-muted-foreground">{catalog.length} products</p></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{catalog.map((product) => { const confidence = confidenceOverrides[product.id] ?? product.confidence; const level = confidence >= 85 ? "High" : confidence >= 50 ? "Medium" : "Low"; const alternative = product.id === "eggs" ? products.find((p) => p.id === "eggs-verified") : product.id === "tomato" ? products.find((p) => p.id === "tomato-verified") : undefined; const inCart = cart.find((item) => item.key === `${product.storeId}:${product.id}`)?.quantity ?? 0; const ProductIcon = PRODUCT_ICONS[product.id] ?? Package; return <article key={product.id} className="flex min-h-64 flex-col rounded-lg border border-border bg-card p-5 shadow-panel"><div className="flex items-start justify-between"><span aria-hidden="true" className="flex size-14 items-center justify-center rounded-lg bg-secondary text-primary"><ProductIcon size={28} strokeWidth={1.7} /></span><span className={`rounded-md border px-2 py-1 text-[11px] font-bold ${CONFIDENCE_STYLES[level]}`}>{confidence}% {level} confidence</span></div><h3 className="mt-4 text-base font-bold">{product.name}</h3><p className="text-xs text-muted-foreground">{product.size} · {product.units} units on shelf</p><div className="mt-auto flex items-center justify-between pt-5"><span className="text-xl font-extrabold">₹{product.price}</span><Button size="sm" disabled={inCart >= product.units} onClick={() => addToCart(product.id, product.storeId)}>{inCart ? `Add more (${inCart})` : "Add to cart"}</Button></div>{alternative && confidence < 60 && <div className="mt-4 rounded-md border border-primary/30 bg-risk-low-soft p-3"><p className="text-xs font-bold text-primary">Reliable alternative recommended</p><p className="mt-1 text-xs text-muted-foreground">{alternative.name} · {stores.find((store) => store.id === alternative.storeId)?.name} · {alternative.confidence}% verified</p><Button variant="outline" size="sm" onClick={() => addToCart(alternative.id, alternative.storeId)} className="mt-3 h-auto min-h-9 w-full whitespace-normal border-primary/40 text-xs text-primary hover:text-primary">Switch & Add Verified Item</Button></div>}</article>; })}</div>
            {catalog.length === 0 && <p className="rounded-lg border border-border p-8 text-center text-muted-foreground">No products match your search.</p>}
          </div><aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-panel lg:sticky lg:top-5" aria-label="Shopping cart"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold"><ShoppingBasket className="size-5 text-primary" /> Your cart</h2><span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-bold">{cartCount}</span></div>{cart.length ? <div className="mt-5 space-y-4">{cart.map((item) => { const product = products.find((p) => p.id === item.productId); return product && <div key={item.key} className="flex items-start justify-between gap-2 border-t border-border pt-3"><div className="min-w-0"><p className="text-sm font-semibold">{product.name} <span className="text-muted-foreground">× {item.quantity}</span></p><p className="text-xs text-muted-foreground">{stores.find((store) => store.id === item.storeId)?.name}</p></div><Button variant="ghost" size="sm" onClick={() => removeFromCart(item.key)} aria-label={`Remove one ${product.name} from cart`} className="shrink-0 text-muted-foreground">−</Button></div>; })}<div className="flex items-center justify-between border-t border-border pt-4 text-sm font-bold"><span>Subtotal</span><span>₹{cartTotal}</span></div></div> : <p className="mt-5 text-sm text-muted-foreground">Your cart is empty.</p>}</aside></div>
        </>}
        {tab === "partner" && <>
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase text-primary">02 / Store operations</p><h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Partner Store Hub</h1><p className="mt-2 text-sm text-muted-foreground">Keep the digital shelf aligned with the physical shelf.</p></div><label className="text-xs font-bold uppercase text-muted-foreground">Partner store<select aria-label="Partner store" value={storeId} onChange={(e) => setStoreId(e.target.value)} className="mt-2 block h-11 min-w-60 rounded-md border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none focus:border-primary">{stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label></div>
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label="Reliability Score" value={`${Math.min(99, selectedStore.reliability + (auditCounts[selectedStore.id] ?? 0) * 2)}%`} detail="Verified shelf health" icon={<TrendingUp size={18} />} /><Metric label="Cancellation Risk" value={`${Math.max(3, 14 - (auditCounts[selectedStore.id] ?? 0) * 1.5).toFixed(1)}%`} detail="Industry average 14.5%" icon={<AlertTriangle size={18} />} /><Metric label="Last Physical Audit" value={(auditCounts[selectedStore.id] ?? 0) > 0 ? "Just now" : selectedStore.audit} detail="Most recent stock verification" icon={<Clock3 size={18} />} /><Metric label="Urgent Audits Needed" value={String(urgentAudits)} detail="Items with low confidence" icon={<PackageCheck size={18} />} /></div>
          <section className="mt-9"><div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase text-primary">Physical shelf checks</p><h2 className="mt-1 text-xl font-bold">Products needing a stock check</h2></div><span className="text-xs text-muted-foreground">{stockChecks.length} to review</span></div><div className="space-y-2">{stockChecks.length ? stockChecks.map((product) => { const confidence = confidenceOverrides[product.id] ?? product.confidence; return <div key={product.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-card p-4 sm:p-5"><div className="flex min-w-0 items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-secondary text-primary"><Package size={22} /></span><div className="min-w-0"><p className="truncate text-sm font-bold sm:text-base">{product.name}</p><p className="text-xs text-muted-foreground">{product.units} units on shelf · {confidence}% confidence</p></div></div><Button size="sm" onClick={() => { setConfidenceOverrides((prev) => ({ ...prev, [product.id]: 99 })); setAuditCounts((prev) => ({ ...prev, [selectedStore.id]: (prev[selectedStore.id] ?? 0) + 1 })); }} className="shrink-0">Confirm stock</Button></div>; }) : <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-primary"><CheckCircle2 className="mx-auto mb-2 size-6" /> All flagged stock checked for this store.</div>}</div></section>
          <section className="mt-9"><h2 className="text-xl font-bold">Partner network</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stores.map((store) => <Button key={store.id} variant="outline" onClick={() => setStoreId(store.id)} className={`h-auto min-h-24 justify-start whitespace-normal border-border bg-card p-4 text-left hover:bg-secondary ${storeId === store.id ? "ring-1 ring-primary" : ""}`}><div><Store className="mb-2 size-4 text-primary" /><span className="block font-bold">{store.name}</span><span className="text-xs text-muted-foreground">{store.area} · {store.reliability}% baseline</span></div></Button>)}</div></section>
        </>}
        {tab === "ops" && <>
          <div><p className="text-xs font-bold uppercase text-primary">03 / Network command</p><h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Nova Ops Control</h1><p className="mt-2 text-sm text-muted-foreground">From shelf uncertainty to recovered customers.</p></div>
          <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Network metrics"><Metric label="Network Cancellation Rate" value="9.0%" detail="Down from 14.5%" icon={<ArrowDownRight size={18} />} /><Metric label="On-Time Delivery" value="82%" detail="Across the simulated network" icon={<Clock3 size={18} />} /><Metric label="Active Support Tickets" value={String(counts.High)} detail="High-risk orders to recover" icon={<ShieldAlert size={18} />} /><Metric label="Monthly Revenue Saved" value={formatINR(savings.total + (rescueResult?.total ?? 0))} detail="Projected + rescue actions" icon={<IndianRupee size={18} />} /></section>
          <div role="tablist" aria-label="Ops views" className="mt-9 flex gap-2 overflow-x-auto border-b border-border pb-3 [scrollbar-width:none]">{opsTabs.map((item) => <Button key={item} role="tab" aria-selected={opsTab === item} variant={opsTab === item ? "default" : "ghost"} onClick={() => setOpsTab(item)} className="h-10 shrink-0 text-xs sm:text-sm">{item}</Button>)}</div>
          {opsTab === "Inventory-Risk Alerts" && <>
            <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_1fr]"><section className="rounded-lg border border-border bg-card p-6"><p className="text-xs font-bold uppercase text-primary">Inventory signals</p><h2 className="mt-1 text-xl font-bold">Unverified shelf items</h2><p className="mt-2 text-sm text-muted-foreground">Low stock confidence creates preventable substitutions and cancellations.</p><div className="mt-6 space-y-3">{products.filter((p) => p.storeId === assignedStore.id && (confidenceOverrides[p.id] ?? p.confidence) < 80).map((product) => <div key={product.id} className="flex items-center justify-between gap-3 border-t border-border pt-3"><span className="text-sm font-semibold">{product.name}</span><span className="text-sm font-bold text-risk-medium">{confidenceOverrides[product.id] ?? product.confidence}% confidence</span></div>)}{products.filter((p) => p.storeId === assignedStore.id && (confidenceOverrides[p.id] ?? p.confidence) < 80).length === 0 && <p className="text-sm text-primary">All assigned-store items verified.</p>}</div></section><section className="rounded-lg border border-border bg-card p-6"><p className="text-xs font-bold uppercase text-primary">Root causes</p><h2 className="mt-1 text-xl font-bold">Why orders fail</h2><div className="mt-5 space-y-4">{failureBreakdown.map((item) => <div key={item.reason}><div className="mb-1 flex justify-between text-sm"><span>{item.reason}</span><strong>{Math.round(item.count / failureBreakdown.reduce((sum, cause) => sum + cause.count, 0) * 100)}%</strong></div><div className="h-2 rounded-full bg-secondary"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.round(item.count / failureBreakdown.reduce((sum, cause) => sum + cause.count, 0) * 100)}%` }} /></div></div>)}</div><p className="mt-6 text-xs font-bold text-primary">No riders · biggest cause</p></section></div>
          </>}
          {opsTab === "At-Risk Customer Recovery" && <>
            <section className="mt-7 grid gap-4 border-y border-border py-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div><p className="text-xs font-bold uppercase text-primary">The delivery gap</p><h2 className="mt-1 text-2xl font-extrabold">Growth is hiding a delivery problem.</h2><p className="mt-2 text-sm text-muted-foreground">Repeat rate after an on-time first order: <strong className="text-risk-low">55%</strong> · After a late first order: <strong className="text-risk-high">20%</strong></p><p className="mt-1 text-sm text-muted-foreground">Late first orders lose 2 out of 3 repeat customers.</p></div><div className="md:text-right"><p className="text-xs font-bold uppercase text-muted-foreground">Revenue at risk / month</p><p className="mt-1 text-5xl font-extrabold">{formatINR(monthlyRevenueAtRisk)}</p></div></section>
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
          </>}
          {opsTab === "Partner Reliability Matrix" && <><div className="mt-7 grid gap-3 sm:grid-cols-2">{stores.map((store) => { const audits = auditCounts[store.id] ?? 0; const alerts = products.filter((product) => product.storeId === store.id && (confidenceOverrides[product.id] ?? product.confidence) < 60).length; return <div key={store.id} className="rounded-lg border border-border bg-card p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-primary">{store.area}</p><h2 className="mt-1 text-lg font-bold">{store.name}</h2></div><Store className="size-5 shrink-0 text-primary" /></div><div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4"><div><p className="text-2xl font-extrabold text-primary">{Math.min(99, store.reliability + audits * 2)}%</p><p className="text-xs text-muted-foreground">Reliability score</p></div><div><p className="text-2xl font-extrabold text-risk-medium">{alerts}</p><p className="text-xs text-muted-foreground">Urgent audits</p></div></div><p className="mt-4 text-xs text-muted-foreground">Last audit: {audits ? "Just now" : store.audit}</p><Button variant="outline" size="sm" className="mt-5" onClick={() => { setStoreId(store.id); setTab("partner"); }}>Open store</Button></div>; })}</div></>}
        </>}
      </main>
    </div>
  );
}

function Metric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
  return <div className="min-h-36 rounded-lg border border-border bg-card p-4 shadow-panel sm:p-5"><div className="flex items-start justify-between gap-2"><p className="text-xs font-bold uppercase leading-snug text-muted-foreground">{label}</p><span className="text-primary">{icon}</span></div><p className="mt-4 break-words text-2xl font-extrabold text-foreground sm:text-3xl">{value}</p><p className="mt-1 text-xs font-medium text-muted-foreground">{detail}</p></div>;
}
