import { useState } from "react";
import { Transaction } from "../types";
import { STANDARD_CATEGORIES, CATEGORY_COLORS, formatCurrency } from "../utils";
import { Search, Filter, Trash2, Sparkles, Calendar, Tag, CreditCard } from "lucide-react";

interface ExpenseListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

export default function ExpenseList({ transactions, onDeleteTransaction }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAiOnly, setShowAiOnly] = useState(false);

  // Filter logic
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || tx.category === selectedCategory;
    
    const matchesAi = !showAiOnly || tx.isAutoCategorized;

    return matchesSearch && matchesCategory && matchesAi;
  });

  // Sort descending by date
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            Transaction History
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {sortedTransactions.length} of {transactions.length} transactions
          </p>
        </div>

        {/* AI Filter Toggle */}
        <button
          onClick={() => setShowAiOnly(!showAiOnly)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            showAiOnly
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Categorized Only
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search description or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500 text-sm transition-colors bg-white"
          >
            <option value="All">All Categories</option>
            {STANDARD_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List items */}
      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
        {sortedTransactions.length > 0 ? (
          sortedTransactions.map((tx) => {
            const catColor = CATEGORY_COLORS[tx.category] || "#6b7280";
            return (
              <div
                key={tx.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-all shadow-none hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {/* Category bullet */}
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: catColor }}
                    title={tx.category}
                  />

                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                        {tx.description}
                      </h4>
                      {tx.isAutoCategorized && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                          <Sparkles className="w-2.5 h-2.5" />
                          AI
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <Tag className="w-3 h-3" />
                        {tx.category}
                      </span>
                    </div>

                    {tx.notes && (
                      <p className="text-xs text-slate-500 mt-1 italic font-light">
                        "{tx.notes}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-slate-400 text-[11px]">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        {tx.date}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-slate-50 sm:border-0 pt-2 sm:pt-0">
                  <span className="text-sm font-bold text-slate-800">
                    {formatCurrency(tx.amount)}
                  </span>
                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                    title="Delete transaction"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-400 font-medium">No transactions found matching the filter.</p>
            <p className="text-xs text-slate-300 mt-1">Try resetting the filters or adding a new expense.</p>
          </div>
        )}
      </div>
    </div>
  );
}
