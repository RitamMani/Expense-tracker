import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in your environment. Please add it via the Settings > Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Categorize transaction
app.post("/api/categorize", async (req, res) => {
  try {
    const { description, notes, amount } = req.body;
    if (!description) {
      return res.status(400).json({ error: "Description is required" });
    }

    const ai = getGeminiClient();
    const prompt = `Categorize the following transaction:
Description: "${description}"
Amount: ${amount !== undefined ? amount : 'unknown'}
Notes: "${notes || 'none'}"

Choose from the following standard categories:
- Food & Dining
- Transportation
- Utilities & Bills
- Entertainment & Leisure
- Shopping
- Healthcare & Fitness
- Housing & Rent
- Travel
- Education
- Miscellaneous

Respond ONLY with a JSON object containing the suggested category and a confidence value (0.0 to 1.0) according to the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "The selected category from the list"
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence rating for this categorization"
            }
          },
          required: ["category", "confidence"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    console.error("Categorize Error:", error);
    res.status(500).json({ error: error.message || "Failed to categorize transaction" });
  }
});

// 2. Generate overall financial insights
app.post("/api/insights", async (req, res) => {
  try {
    const { transactions, budgets } = req.body;
    
    const ai = getGeminiClient();
    const prompt = `Analyze the following financial transactions and budgets. Give personalized, actionable financial insights, practical saving tips, suggested budgets, and a monthly spend trend analysis.
All financial amounts are in Indian Rupees (INR, ₹). Please format recommended amounts and savings with the ₹ symbol.

Transactions:
${JSON.stringify(transactions || [], null, 2)}

Budgets:
${JSON.stringify(budgets || [], null, 2)}

Provide your response in JSON format matching the schema. Make the advice specific, highly engaging, and empowering for the user.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            generalInsight: {
              type: Type.STRING,
              description: "A summary of their overall financial standing and spending trends based on the current data."
            },
            savingTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 actionable, high-quality savings tips custom to this data."
            },
            suggestedBudgets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  limit: { type: Type.NUMBER }
                },
                required: ["category", "limit"]
              },
              description: "Recommended budget targets based on current spending behaviors."
            },
            monthlyAnalysis: {
              type: Type.STRING,
              description: "An analysis of the user's spending trends, category distribution, and how close they are to their limits."
            }
          },
          required: ["generalInsight", "savingTips", "suggestedBudgets", "monthlyAnalysis"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    console.error("Insights Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate insights" });
  }
});

// 3. Financial Advisor Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, transactions, budgets } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGeminiClient();
    
    const systemInstruction = `You are an expert, friendly personal financial advisor. Analyze the user's expenses and budget, and answer their query.
All values, budgets, and transactions are in Indian Rupees (INR, represented by ₹). Please ensure you always discuss monetary values using Indian Rupees (₹) and Indian currency conventions.
Be concise, practical, and highly helpful.
Do not hallucinate numbers or details that are not present. If the user doesn't have transactions yet, politely encourage them to add some.
Always format your response using clean Markdown. Feel free to use lists or simple bold text to emphasize savings suggestions.

User's Data Context:
- Budgets: ${JSON.stringify(budgets || [], null, 2)}
- Transactions: ${JSON.stringify(transactions || [], null, 2)}`;

    const contents: any[] = [];
    
    // Add history
    if (history && history.length > 0) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }
    
    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const text = response.text;
    res.json({ text });
  } catch (error: any) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: error.message || "Failed to process chat message" });
  }
});

// Setup Vite Dev server or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
