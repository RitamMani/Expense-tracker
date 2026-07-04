import { useState, useEffect } from "react";
import { Transaction, Budget, SmartAlert, FinancialInsight } from "./types";
import {
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  calculateAlerts
} from "./utils";

import TransactionForm from "./components/TransactionForm";
import BudgetSettings from "./components/BudgetSettings";
import ExpenseList from "./components/ExpenseList";
import InsightsDashboard from "./components/InsightsDashboard";
import ChatAdvisor from "./components/ChatAdvisor";
import SmartAlertsView from "./components/SmartAlertsView";

import { Sparkles, Wallet, ShieldCheck, HelpCircle, BarChart3, MessageSquare, ListTodo, AlertCircle } from "lucide-react";

export default function App() {
  // 1. Core Persistent State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const cached = localStorage.getItem("expense_tracker_transactions");
    return cached ? JSON.parse(cached) : INITIAL_TRANSACTIONS;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const cached = localStorage.getItem("expense_tracker_budgets");
    return cached ? JSON.parse(cached) : INITIAL_BUDGETS;
  });

  const [insights, setInsights] = useState<FinancialInsight | null>(() => {
    const cached = localStorage.getItem("expense_tracker_insights");
    return cached ? JSON.parse(cached) : null;
  });

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => {
    const cached = localStorage.getItem("expense_tracker_dismissed_alerts");
    return cached ? JSON.parse(cached) : [];
  });

  // Active view tab in the right pane
  const [activeTab, setActiveTab] = useState<"dashboard" | "chat" | "ledger">("dashboard");

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("expense_tracker_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("expense_tracker_budgets", JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem("expense_tracker_insights", JSON.stringify(insights));
  }, [insights]);

  useEffect(() => {
    localStorage.setItem("expense_tracker_dismissed_alerts", JSON.stringify(dismissedAlerts));
  }, [dismissedAlerts]);

  // 2. Calculated State
  const allAlerts = calculateAlerts(transactions, budgets);
  const activeAlerts = allAlerts.filter((a) => !dismissedAlerts.includes(a.id));

  // 3. Actions
  const handleAddTransaction = (newTx: Omit<Transaction, "id" | "isAutoCategorized"> & { isAutoCategorized?: boolean }) => {
    const transactionWithId: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}`,
      isAutoCategorized: newTx.isAutoCategorized || false,
    };
    setTransactions((prev) => [transactionWithId, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateBudget = (category: string, limit: number) => {
    setBudgets((prev) => {
      const idx = prev.findIndex((b) => b.category === category);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { category, limit };
        return copy;
      } else {
        return [...prev, { category, limit }];
      }
    });
  };

  const handleDismissAlert = (id: string) => {
    setDismissedAlerts((prev) => [...prev, id]);
  };

  const handleResetData = () => {
    if (confirm("Are you sure you want to reset all transactions, budgets, and AI insights back to default data?")) {
      setTransactions(INITIAL_TRANSACTIONS);
      setBudgets(INITIAL_BUDGETS);
      setInsights(null);
      setDismissedAlerts([]);
      localStorage.clear();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-indigo-100 selection:text-indigo-900 pb-12 font-sans">
      {/* Upper Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-100 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase block">GenAI Personal Workspace</span>
              <h1 className="text-base font-bold text-slate-900 leading-none">Smart Expense Tracker</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetData}
              className="text-xs text-slate-500 hover:text-rose-600 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white transition-all shadow-none hover:shadow-sm"
            >
              Reset to Seed Data
            </button>
            <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Security Active</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (Input & Settings) - takes 4 columns */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Dynamic Smart Alert Banner */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-slate-400" />
                Live Budget Alerts
              </h3>
              <SmartAlertsView alerts={activeAlerts} onDismissAlert={handleDismissAlert} />
            </div>

            {/* Quick transaction add */}
            <TransactionForm onAddTransaction={handleAddTransaction} />

            {/* Monthly budgets */}
            <BudgetSettings
              budgets={budgets}
              transactions={transactions}
              onUpdateBudget={handleUpdateBudget}
            />
          </div>

          {/* Right Column (Dynamic Tabs) - takes 8 columns */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tab switch control */}
            <div className="bg-white p-1 rounded-xl border border-slate-150 flex gap-1 shadow-sm">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "dashboard"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboards & AI Insights
              </button>

              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "chat"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                AI Financial Chat
              </button>

              <button
                onClick={() => setActiveTab("ledger")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "ledger"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <ListTodo className="w-4 h-4" />
                Transaction Ledger
              </button>
            </div>

            {/* Dynamic Active Tab Content */}
            <div className="transition-all duration-300">
              {activeTab === "dashboard" && (
                <InsightsDashboard
                  transactions={transactions}
                  budgets={budgets}
                  insights={insights}
                  onUpdateInsights={setInsights}
                />
              )}

              {activeTab === "chat" && (
                <ChatAdvisor
                  transactions={transactions}
                  budgets={budgets}
                />
              )}

              {activeTab === "ledger" && (
                <ExpenseList
                  transactions={transactions}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
