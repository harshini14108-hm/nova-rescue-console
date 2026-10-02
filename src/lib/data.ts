// Simulated data for NOVA CART Rescue Console. All data is fake.

export type RiskLevel = "High" | "Medium" | "Low";
export type FailureReason = "Out of stock" | "No riders" | "Peak hour rush";
export type ActionType = "reassign" | "coupon" | "substitute";

export interface Order {
  id: string;
  customer: string;
  zone: string;
  items: number;
  value: number;
  etaMinutes: number;
  reason: FailureReason;
  baseScore: number;
}

const FIRST = ["Asha", "Ravi", "Meera", "Karan", "Priya", "Arjun", "Neha", "Vikram", "Sana", "Rohit", "Isha", "Dev", "Tara", "Nikhil", "Pooja", "Aditi", "Sameer", "Kavya", "Manav", "Riya"];
const LAST = ["Sharma", "Patel", "Iyer", "Khan", "Gupta", "Reddy", "Nair", "Mehta", "Das", "Singh", "Joshi", "Bose", "Verma", "Rao", "Chopra"];
const ZONES = ["Indiranagar", "Koramangala", "HSR Layout", "Whitefield", "JP Nagar", "Bellandur", "Hebbal", "Malleshwaram"];
const REASONS: FailureReason[] = ["Out of stock", "No riders", "Peak hour rush"];

// Deterministic pseudo-random so SSR and client agree.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scoreToLevel(score: number): RiskLevel {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

export function riskLevel(score: number): RiskLevel {
  return scoreToLevel(score);
}

export const orders: Order[] = (() => {
  const rand = mulberry32(42);
  const list: Order[] = [];
  for (let i = 0; i < 200; i++) {
    const reason = REASONS[Math.floor(rand() * REASONS.length)]!;
    const reasonBoost = reason === "No riders" ? 22 : reason === "Peak hour rush" ? 14 : 8;
    const baseScore = Math.min(98, Math.max(4, Math.round(rand() * 70 + reasonBoost + rand() * 20 - 10)));
    list.push({
      id: `NC-${10000 + i}`,
      customer: `${FIRST[Math.floor(rand() * FIRST.length)]!} ${LAST[Math.floor(rand() * LAST.length)]!}`,
      zone: ZONES[Math.floor(rand() * ZONES.length)]!,
      items: 1 + Math.floor(rand() * 9),
      value: Math.round(150 + rand() * 1800),
      etaMinutes: 8 + Math.floor(rand() * 55),
      reason,
      baseScore,
    });
  }
  return list;
})();

// Action impact on risk score
export const ACTION_IMPACT: Record<ActionType, number> = {
  reassign: 24,
  coupon: 14,
  substitute: 18,
};

export const ACTION_LABELS: Record<ActionType, string> = {
  reassign: "Reassign Rider",
  coupon: "Send Apology Coupon",
  substitute: "Substitute Item",
};

// Cohort: share of customers who reorder within 30 days, by first-order outcome
export const cohortData = [
  { label: "First order on time", reorderRate: 62 },
  { label: "First order late", reorderRate: 27 },
];

export const failureBreakdown = (() => {
  const counts: Record<FailureReason, number> = { "Out of stock": 0, "No riders": 0, "Peak hour rush": 0 };
  orders.forEach((o) => {
    if (o.baseScore >= 40) counts[o.reason]++;
  });
  return (Object.entries(counts) as [FailureReason, number][]).map(([reason, count]) => ({ reason, count }));
})();

// Money model (simulated): avg order value ₹650, margin 12%, churn cost per lost customer ₹900
export const AVG_ORDER_VALUE = 650;
export const MONTHLY_ORDERS = 42000;
export const LATE_RATE = 0.18; // 18% of orders late
export const CANCEL_RATE = 0.09; // 9% cancelled
export const CHURN_COST = 900;

export function savingsFromSliders(lateReductionPct: number, cancelReductionPct: number) {
  const lateSaved = MONTHLY_ORDERS * LATE_RATE * (lateReductionPct / 100) * CHURN_COST * 0.35;
  const cancelSaved = MONTHLY_ORDERS * CANCEL_RATE * (cancelReductionPct / 100) * AVG_ORDER_VALUE * 0.5;
  return { lateSaved: Math.round(lateSaved), cancelSaved: Math.round(cancelSaved), total: Math.round(lateSaved + cancelSaved) };
}

export function formatINR(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}
