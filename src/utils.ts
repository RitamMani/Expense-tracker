import { Transaction, Budget, SmartAlert } from "./types";

export const STANDARD_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Utilities & Bills",
  "Entertainment & Leisure",
  "Shopping",
  "Healthcare & Fitness",
  "Housing & Rent",
  "Travel",
  "Education",
  "Miscellaneous"
];

export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#f59e0b", // Amber
  "Transportation": "#3b82f6", // Blue
  "Utilities & Bills": "#10b981", // Emerald
  "Entertainment & Leisure": "#ec4899", // Pink
  "Shopping": "#8b5cf6", // Purple
  "Healthcare & Fitness": "#ef4444", // Red
  "Housing & Rent": "#14b8a6", // Teal
  "Travel": "#06b6d4", // Cyan
  "Education": "#f43f5e", // Rose
  "Miscellaneous": "#6b7280" // Gray
};

export const INITIAL_BUDGETS: Budget[] = [
  { category: "Food & Dining", limit: 450 },
  { category: "Transportation", limit: 200 },
  { category: "Utilities & Bills", limit: 300 },
  { category: "Entertainment & Leisure", limit: 250 },
  { category: "Shopping", limit: 350 },
  { category: "Healthcare & Fitness", limit: 150 },
  { category: "Housing & Rent", limit: 1200 },
  { category: "Travel", limit: 400 },
  { category: "Education", limit: 100 },
  { category: "Miscellaneous", limit: 150 }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    description: "Whole Foods Market",
    amount: 142.50,
    date: "2026-06-15",
    category: "Food & Dining",
    notes: "Weekly groceries, bought fresh salmon and organic vegetables.",
    isAutoCategorized: true
  },
  {
    id: "tx-2",
    description: "Chevron Fueling",
    amount: 45.00,
    date: "2026-06-18",
    category: "Transportation",
    notes: "Regular unleaded gas fill-up.",
    isAutoCategorized: true
  },
  {
    id: "tx-3",
    description: "Pacific Gas & Electric",
    amount: 112.40,
    date: "2026-06-20",
    category: "Utilities & Bills",
    notes: "Monthly electric and gas utility bill.",
    isAutoCategorized: true
  },
  {
    id: "tx-4",
    description: "Netflix Subscription",
    amount: 15.49,
    date: "2026-06-22",
    category: "Entertainment & Leisure",
    notes: "Premium UHD subscription plan.",
    isAutoCategorized: true
  },
  {
    id: "tx-5",
    description: "Target Store Shopping",
    amount: 84.20,
    date: "2026-06-24",
    category: "Shopping",
    notes: "Home essentials, laundry detergent, and towels.",
    isAutoCategorized: true
  },
  {
    id: "tx-6",
    description: "Apex Dental Cleaning",
    amount: 80.00,
    date: "2026-06-25",
    category: "Healthcare & Fitness",
    notes: "Routine clean-up copay.",
    isAutoCategorized: true
  },
  {
    id: "tx-7",
    description: "Apartment Monthly Rent",
    amount: 1200.00,
    date: "2026-07-01",
    category: "Housing & Rent",
    notes: "July rent payment.",
    isAutoCategorized: true
  },
  {
    id: "tx-8",
    description: "Trader Joe's",
    amount: 85.30,
    date: "2026-07-02",
    category: "Food & Dining",
    notes: "Groceries and snacks for weekend party.",
    isAutoCategorized: true
  },
  {
    id: "tx-9",
    description: "Uber Ride",
    amount: 28.50,
    date: "2026-07-03",
    category: "Transportation",
    notes: "Ride back home from the restaurant.",
    isAutoCategorized: true
  },
  {
    id: "tx-10",
    description: "Comcast Internet Services",
    amount: 79.99,
    date: "2026-07-03",
    category: "Utilities & Bills",
    notes: "Monthly gigabit internet access.",
    isAutoCategorized: true
  },
  {
    id: "tx-11",
    description: "AMC Movie Theater",
    amount: 34.00,
    date: "2026-07-03",
    category: "Entertainment & Leisure",
    notes: "Two tickets and popcorn.",
    isAutoCategorized: true
  },
  {
    id: "tx-12",
    description: "Amazon.com Purchase",
    amount: 210.50,
    date: "2026-07-04",
    category: "Shopping",
    notes: "Wireless headphones.",
    isAutoCategorized: true
  }
];

export function calculateAlerts(transactions: Transaction[], budgets: Budget[]): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const currentMonthStr = "2026-07"; // Hardcoded to current month context YYYY-MM
  
  // Calculate total spent per category in July 2026
  const spentMap: Record<string, number> = {};
  transactions
    .filter(t => t.date.startsWith(currentMonthStr))
    .forEach(t => {
      spentMap[t.category] = (spentMap[t.category] || 0) + t.amount;
    });

  budgets.forEach(b => {
    const spent = spentMap[b.category] || 0;
    const ratio = spent / b.limit;

    if (ratio >= 1.0) {
      alerts.push({
        id: `alert-${b.category}-over`,
        type: 'warning',
        message: `Oops! You've exceeded your budget for ${b.category} by ₹${(spent - b.limit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (₹${spent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent of ₹${b.limit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} limit).`,
        date: new Date().toISOString().split('T')[0],
        category: b.category
      });
    } else if (ratio >= 0.85) {
      alerts.push({
        id: `alert-${b.category}-warning`,
        type: 'info',
        message: `Heads up! You've used ${(ratio * 100).toFixed(0)}% of your ${b.category} budget (₹${spent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent of ₹${b.limit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} limit).`,
        date: new Date().toISOString().split('T')[0],
        category: b.category
      });
    }
  });

  return alerts;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}
