import { SmartAlert } from "../types";
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";

interface SmartAlertsViewProps {
  alerts: SmartAlert[];
  onDismissAlert?: (id: string) => void;
}

export default function SmartAlertsView({ alerts, onDismissAlert }: SmartAlertsViewProps) {
  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
        <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-emerald-800">Excellent Spending Health!</h4>
          <p className="text-xs text-emerald-600">All of your monthly category expenses are well within their budget limits.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const isWarning = alert.type === "warning";
        return (
          <div
            key={alert.id}
            className={`p-4 rounded-2xl border transition-all flex items-start gap-3 relative ${
              isWarning
                ? "bg-rose-50/50 border-rose-100 text-rose-800"
                : "bg-amber-50/50 border-amber-100 text-amber-800"
            }`}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                isWarning ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>

            <div className="flex-1 pr-6">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                {isWarning ? "Budget Exceeded Alert" : "Budget Limit Approaching"}
                {alert.category && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isWarning ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {alert.category}
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.message}</p>
            </div>

            {onDismissAlert && (
              <button
                onClick={() => onDismissAlert(alert.id)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 rounded-full p-1"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
