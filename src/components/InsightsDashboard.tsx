import { useState, useEffect } from "react";
import { Transaction, Budget, FinancialInsight } from "../types";
import { STANDARD_CATEGORIES, CATEGORY_COLORS, formatCurrency } from "../utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Sparkles, RefreshCw, AlertTriangle, Lightbulb, TrendingUp, IndianRupee, Wallet, Percent } from "lucide-react";

interface InsightsDashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  insights: FinancialInsight | null;
  onUpdateInsights: (newInsight: FinancialInsight) => void;
}

export default function InsightsDashboard({ transactions, budgets, insights, onUpdateInsights }: InsightsDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMonthStr = "2026-07"; // Current month context

  // 1. Prepare Chart Data for Category Breakdown (Pie)
  const currentMonthTransactions = transactions.filter((t) => t.date.startsWith(currentMonthStr));
  const totalSpentThisMonth = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

  const pieData = STANDARD_CATEGORIES.map((cat) => {
    const value = currentMonthTransactions
      .filter((t) => t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: cat, value };
  }).filter((item) => item.value > 0);

  // 2. Prepare Chart Data for Budget vs Spend (Bar)
  const budgetVsSpendData = STANDARD_CATEGORIES.map((cat) => {
    const budget = budgets.find((b) => b.category === cat)?.limit || 0;
    const spent = currentMonthTransactions
      .filter((t) => t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      category: cat.substring(0, 14), // truncate for layout
      Budget: budget,
      Spent: Math.round(spent * 100) / 100,
    };
  }).filter(item => item.Budget > 0 || item.Spent > 0);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions, budgets }),
      });

      if (!response.ok) {
        throw new Error("Could not retrieve AI insights. Please check if your Gemini API key is configured.");
      }

      const data = await response.json();
      onUpdateInsights({
        ...data,
        lastUpdated: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Generate on first mount if not exists
  useEffect(() => {
    if (!insights && transactions.length > 0) {
      fetchInsights();
    }
  }, [transactions.length]);

  return (
    <div className="space-y-6">
      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Spent (July 2026)</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalSpentThisMonth)}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Budgets Limit</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">
                {formatCurrency(budgets.reduce((sum, b) => sum + b.limit, 0))}
              </h4>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget Utilization</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">
                {budgets.reduce((sum, b) => sum + b.limit, 0) > 0
                  ? `${((totalSpentThisMonth / budgets.reduce((sum, b) => sum + b.limit, 0)) * 100).toFixed(1)}%`
                  : "0.0%"}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Dashboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Spent Comparison (Bar) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Budget Limits vs Spent Amount (₹)</h3>
          <div className="h-64">
            {budgetVsSpendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetVsSpendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={14} name="Budget Limit" />
                  <Bar dataKey="Spent" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={14} name="Total Spent" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                Set some budgets or transactions to display details.
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown (Pie) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Spending Category Breakdown</h3>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-center">
            {pieData.length > 0 ? (
              <>
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || "#6b7280"} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), "Spent"]}
                        contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 flex flex-col gap-1.5 max-h-56 overflow-y-auto px-2 py-1">
                  {pieData.map((item, index) => {
                    const pct = ((item.value / totalSpentThisMonth) * 100).toFixed(1);
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: CATEGORY_COLORS[item.name] }}
                          />
                          <span className="text-slate-600 truncate">{item.name}</span>
                        </div>
                        <span className="font-semibold text-slate-800 shrink-0">
                          {pct}% ({formatCurrency(item.value)})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                No July spending recorded yet. Try adding expenses!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Personal Finance Insights */}
      <div className="bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/50 rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-indigo-50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
            <div>
              <h3 className="font-semibold text-slate-900">Personalized Financial AI Insights</h3>
              {insights && (
                <p className="text-[10px] text-slate-400">
                  Last updated: {insights.lastUpdated || "Just now"}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={fetchInsights}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Analyzing with GenAI...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh AI Insights
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Gemini is processing your transaction logs & budgets...</p>
            <p className="text-xs text-slate-400">Performing advanced trend analysis and extracting custom saving tips.</p>
          </div>
        ) : insights ? (
          <div className="space-y-6">
            {/* General Insight Card */}
            <div>
              <h4 className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Spending Summary & Trend Analysis
              </h4>
              <p className="text-slate-700 text-sm leading-relaxed bg-indigo-50/30 p-4 rounded-xl border border-indigo-50/50">
                {insights.generalInsight}
              </p>
            </div>

            {/* Monthly Trend & Category Analysis */}
            {insights.monthlyAnalysis && (
              <div>
                <h4 className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Monthly Spend Analysis
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed p-1">
                  {insights.monthlyAnalysis}
                </p>
              </div>
            )}

            {/* Saving Tips & Budget Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Savings Tips */}
              <div>
                <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Lightbulb className="w-4 h-4" />
                  AI Recommended Savings Plan
                </h4>
                <div className="space-y-2">
                  {insights.savingTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 bg-amber-50/30 border border-amber-50 rounded-xl">
                      <span className="p-1 bg-amber-100 rounded-lg text-amber-700 text-xs font-bold mt-0.5">{idx + 1}</span>
                      <p className="text-xs text-slate-700 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Budget Adjustments */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Suggested Smart Budgets
                </h4>
                <div className="space-y-2">
                  {insights.suggestedBudgets.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50/20 border border-emerald-50 rounded-xl text-xs">
                      <span className="font-semibold text-slate-700">{item.category}</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                        Target: {formatCurrency(item.limit)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500 font-medium">No insights generated yet.</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Click the button above to analyze your transactions with Gemini AI.</p>
            <button
              onClick={fetchInsights}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              Analyze Spending Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
