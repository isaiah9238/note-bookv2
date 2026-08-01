import React, { useState } from "react";
import { Bot, Send, X, Key, Sparkles, MessageSquare } from "lucide-react";

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  notebookContext?: string;
  theme?: "light" | "dark";
}

export function AssistantDrawer({
  isOpen,
  onClose,
  apiKey,
  notebookContext = "",
  theme = "light"
}: AssistantDrawerProps) {
  const [messages, setMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Hello! I am your Notebook Chat AI. How can I help you design or structure your notes today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setLoading(true);

    try {
      const activeKey = apiKey || localStorage.getItem("gemini_api_key");
      if (!activeKey) {
        throw new Error("No Gemini API key configured.");
      }

      const payload = {
        contents: [
          {
            parts: [
              {
                text: `You are an AI assistant helping a user inside a notebook workspace.
Current Notebook Context:
${notebookContext}

User Request: ${userMsg}`
              }
            ]
          }
        ]
      };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${activeKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
      setMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { sender: "ai", text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <aside
      className={`fixed top-0 right-0 h-full w-80 sm:w-96 z-40 border-l shadow-2xl flex flex-col transition-colors ${
        isDark ? "bg-zinc-950 border-zinc-800 text-zinc-100" : "bg-white border-black/15 text-black"
      }`}
    >
      <header className={`p-4 border-b flex items-center justify-between ${isDark ? "border-zinc-800 bg-zinc-900/50" : "border-black/10 bg-zinc-50"}`}>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider">Notebook Assistant</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:opacity-75">
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg max-w-[85%] ${
              m.sender === "user"
                ? "ml-auto bg-purple-600 text-white"
                : isDark
                ? "bg-zinc-900 border border-zinc-800 text-zinc-200"
                : "bg-zinc-100 border border-black/10 text-black"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && <div className="text-zinc-500 italic text-[11px]">Assistant is thinking...</div>}
      </div>

      <footer className={`p-3 border-t flex gap-2 ${isDark ? "border-zinc-800" : "border-black/10"}`}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask AI assistant..."
          className={`flex-1 px-3 py-1.5 text-xs border rounded outline-none font-sans ${
            isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-black/20 text-black"
          }`}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs flex items-center gap-1 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </footer>
    </aside>
  );
}