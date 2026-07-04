import { useState, useRef, useEffect, FormEvent } from "react";
import { Transaction, Budget, ChatMessage } from "../types";
import { Sparkles, Send, Bot, User, RefreshCw, AlertTriangle } from "lucide-react";

interface ChatAdvisorProps {
  transactions: Transaction[];
  budgets: Budget[];
}

export default function ChatAdvisor({ transactions, budgets }: ChatAdvisorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hi there! I'm your GenAI Personal Financial Advisor. I can analyze your transactions, tell you where you are overspending, suggest optimal budget goals, or calculate custom averages. Ask me anything about your current expenses!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);
    setError(null);

    try {
      // Map history to server spec
      const historyToSend = messages.slice(1).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyToSend,
          transactions,
          budgets,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to receive a response from your AI financial advisor. Please check if your Gemini API key is configured.");
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: "model",
        text: data.text || "I was unable to analyze that. Let's try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const quickPrompts = [
    "Where did I spend the most money this month?",
    "Do you think my budgets are realistic based on June spent?",
    "How can I save $200 next month?",
    "Are there any warning flags in my utilities budget?",
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-[560px]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-semibold text-slate-900">Conversational Financial Analytics</h3>
            <p className="text-[10px] text-slate-400">Ask your personal AI advisor about your budget and spend habits</p>
          </div>
        </div>
        <button
          onClick={() => {
            setMessages([
              {
                id: "welcome",
                role: "model",
                text: "Hi there! I'm your GenAI Personal Financial Advisor. I can analyze your transactions, tell you where you are overspending, suggest optimal budget goals, or calculate custom averages. Ask me anything about your current expenses!",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
            setError(null);
          }}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          Reset Chat
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 mb-4 text-sm">
        {messages.map((msg) => {
          const isAi = msg.role === "model";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                isAi ? "mr-auto" : "ml-auto flex-row-reverse"
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  isAi ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"
                } h-8 w-8 flex items-center justify-center`}
              >
                {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl ${
                  isAi
                    ? "bg-indigo-50/40 text-slate-700 border border-indigo-50/50"
                    : "bg-indigo-600 text-white"
                }`}
              >
                {/* Format paragraphs / bullet list */}
                <div className="space-y-2 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                  {msg.text}
                </div>
                <span
                  className={`block text-[9px] mt-1.5 ${
                    isAi ? "text-slate-400" : "text-indigo-200"
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 mr-auto max-w-[85%] items-center">
            <div className="p-2 rounded-xl shrink-0 bg-indigo-50 text-indigo-600 h-8 w-8 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-indigo-50/30 text-slate-500 border border-indigo-50/50 p-3.5 rounded-2xl flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
              <span className="text-xs">Analyzing financial records...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length === 1 && (
        <div className="mb-4 shrink-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                className="text-xs bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-xl transition-all text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleFormSubmit} className="flex gap-2 mt-auto shrink-0">
        <input
          type="text"
          placeholder="Ask about spending details, averages, or budget tips..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl transition-colors flex items-center justify-center shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
