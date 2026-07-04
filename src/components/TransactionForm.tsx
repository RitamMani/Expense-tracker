import { useState, FormEvent } from "react";
import { Transaction } from "../types";
import { STANDARD_CATEGORIES } from "../utils";
import { Sparkles, Calendar, IndianRupee, FileText, Plus, Check } from "lucide-react";

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, "id" | "isAutoCategorized"> & { isAutoCategorized?: boolean }) => void;
}

export default function TransactionForm({ onAddTransaction }: TransactionFormProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState(STANDARD_CATEGORIES[0]);
  const [notes, setNotes] = useState("");
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [categorizationSuccess, setCategorizationSuccess] = useState(false);

  const handleAutoCategorize = async () => {
    if (!description.trim()) {
      alert("Please enter a description first to auto-categorize!");
      return;
    }

    setIsCategorizing(true);
    setCategorizationSuccess(false);

    try {
      const response = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          notes,
          amount: parseFloat(amount) || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to auto-categorize");
      }

      const data = await response.json();
      if (data && data.category && STANDARD_CATEGORIES.includes(data.category)) {
        setCategory(data.category);
        setCategorizationSuccess(true);
        setTimeout(() => setCategorizationSuccess(false), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount.trim()) return;

    onAddTransaction({
      description: description.trim(),
      amount: parseFloat(amount),
      date,
      category,
      notes: notes.trim() || undefined,
      isAutoCategorized: categorizationSuccess,
    });

    // Reset Form
    setDescription("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setCategory(STANDARD_CATEGORIES[0]);
    setNotes("");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          Add New Transaction
        </h3>
        <button
          type="button"
          onClick={handleAutoCategorize}
          disabled={isCategorizing || !description.trim()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            !description.trim()
              ? "bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200"
              : isCategorizing
              ? "bg-indigo-50 text-indigo-500 animate-pulse border border-indigo-200"
              : categorizationSuccess
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100"
          }`}
        >
          {isCategorizing ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              Categorizing...
            </>
          ) : categorizationSuccess ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Categorized!
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              AI Auto-Categorize
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Starbucks Coffee, Amazon prime"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              if (description.trim() && !isCategorizing && !categorizationSuccess) {
                handleAutoCategorize();
              }
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
          />
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <IndianRupee className="w-4 h-4" />
              </span>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Date
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Category select */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500 text-sm transition-colors bg-white"
          >
            {STANDARD_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Notes (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400">
              <FileText className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Add extra details here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors shadow-sm hover:shadow-md mt-2 flex items-center justify-center gap-2"
        >
          Add Transaction
        </button>
      </form>
    </div>
  );
}
