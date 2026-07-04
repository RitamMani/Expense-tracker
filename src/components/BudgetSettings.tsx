import { useState } from "react";
import { Budget, Transaction } from "../types";
import { STANDARD_CATEGORIES, formatCurrency } from "../utils";
import { Target, Save, Edit2, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

interface BudgetSettingsProps {
  budgets: Budget[];
  transactions: Transaction[];
  onUpdateBudget: (category: string, limit: number) => void;
}

export default function BudgetSettings({ budgets, transactions, onUpdateBudget }: BudgetSettingsProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState("");

  const currentMonthStr = "2026-07"; // Current context month

  // Calculate current spend for each category
  const spendByCategory = STANDARD_CATEGORIES.reduce((acc, cat) => {
    const total = transactions
      .filter((t) => t.category === cat && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + t.amount, 0);
    acc[cat] = total;
    return acc;
  }, {} as Record<string, number>);

  const handleEdit = (category: string, currentLimit: number) => {
    setEditingCategory(category);
    setTempLimit(currentLimit.toString());
  };

  const handleSave = (category: string) => {
    const val = parseFloat(tempLimit);
    if (!isNaN(val) && val >= 0) {
      onUpdateBudget(category, val);
    }
    setEditingCategory(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-slate-900">Monthly Budgets & Spend Tracker</h3>
      </div>
      <p className="text-xs text-slate-500 mb-6">
        Set limits for each spending category. The indicators below track spending progress for the current month (<span className="font-semibold text-indigo-600">July 2026</span>).
      </p>

      <div className="space-y-5 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
        {STANDARD_CATEGORIES.map((cat) => {
          const budget = budgets.find((b) => b.category === cat) || { category: cat, limit: 0 };
          const limit = budget.limit;
          const spent = spendByCategory[cat] || 0;
          const percentage = limit > 0 ? (spent / limit) * 100 : 0;
          const isOver = spent > limit && limit > 0;
          const isWarning = percentage >= 85 && percentage < 100 && limit > 0;

          const isEditing = editingCategory === cat;

          // Color calculation
          let progressColor = "bg-emerald-500";
          let textColor = "text-emerald-600";
          if (isOver) {
            progressColor = "bg-rose-500";
            textColor = "text-rose-600 font-semibold";
          } else if (isWarning) {
            progressColor = "bg-amber-500";
            textColor = "text-amber-600 font-semibold";
          }

          return (
            <div key={cat} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{cat}</h4>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <span>Spent: <span className="font-medium text-slate-700">{formatCurrency(spent)}</span></span>
                    {limit > 0 && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{percentage.toFixed(0)}% of limit</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <div className="relative">
                        <span className="absolute left-1.5 top-1.5 text-xs text-slate-400">₹</span>
                        <input
                          type="number"
                          value={tempLimit}
                          onChange={(e) => setTempLimit(e.target.value)}
                          className="w-20 pl-4 pr-1 py-1 text-xs rounded border border-slate-300 text-slate-800 focus:outline-none focus:border-indigo-500"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={() => handleSave(cat)}
                        className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                        title="Save budget"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-700">
                        {limit > 0 ? formatCurrency(limit) : "No limit"}
                      </span>
                      <button
                        onClick={() => handleEdit(cat, limit)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Edit limit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {limit > 0 ? (
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 italic">No spending limit set for this category. Click edit to define one.</div>
              )}

              {/* Budget Alerts in card */}
              {limit > 0 && (
                <div className="flex items-center justify-between mt-2 text-[11px]">
                  {isOver ? (
                    <span className="flex items-center gap-1 text-rose-600 font-medium">
                      <AlertTriangle className="w-3 h-3" /> Overspent by {formatCurrency(spent - limit)}
                    </span>
                  ) : isWarning ? (
                    <span className="flex items-center gap-1 text-amber-600 font-medium">
                      <AlertTriangle className="w-3 h-3" /> Near limit: {formatCurrency(limit - spent)} left
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle className="w-3 h-3" /> Safe: {formatCurrency(limit - spent)} remaining
                    </span>
                  )}
                  {limit > 0 && spent > 0 && (
                    <span className="text-slate-400 text-[10px] flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> Progress: {percentage.toFixed(0)}%
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
