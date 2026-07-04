export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  notes?: string;
  isAutoCategorized: boolean;
}

export interface Budget {
  category: string;
  limit: number;
}

export interface SmartAlert {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  date: string;
  category?: string;
}

export interface FinancialInsight {
  generalInsight: string;
  savingTips: string[];
  suggestedBudgets: Budget[];
  monthlyAnalysis: string;
  lastUpdated: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
