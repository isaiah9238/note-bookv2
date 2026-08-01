import React, { useState } from "react";
import CodeInspectorModal from "./components/CodeInspectorModal";
import { SettingsModal } from "./components/SettingsModal";
import { AssistantDrawer } from "./components/AssistantDrawer";
import { InsertModal } from "./components/InsertModal";
import LogoIcon from "./components/LogoIcon";
import { useLibrarianAuth } from "./hooks/useLibrarianAuth";
import { useNotebookSync } from "./hooks/useNotebookSync";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");

  // Modal State
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isInsertOpen, setIsInsertOpen] = useState(false);

  // Hooks
  const { user, signInWithGoogle, signOutUser } = useLibrarianAuth();
  const { content, updateContent } = useNotebookSync();

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-white text-black"}`}>
      {/* Top Navbar */}
      <header className={`px-6 py-3 border-b flex items-center justify-between ${theme === "dark" ? "border-zinc-800 bg-zinc-900/40" : "border-black/10 bg-zinc-50"}`}>
        <div className="flex items-center gap-3">
          <LogoIcon theme={theme} className="w-6 h-6" />
          <h1 className="text-xs font-bold uppercase tracking-widest">Aetherial Notebook</h1>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIsInspectorOpen(true)} className="px-3 py-1 text-xs border rounded hover:opacity-80">
            Inspector
          </button>
          <button onClick={() => setIsInsertOpen(true)} className="px-3 py-1 text-xs border rounded hover:opacity-80">
            Insert
          </button>
          <button onClick={() => setIsAssistantOpen(true)} className="px-3 py-1 text-xs border rounded hover:opacity-80">
            AI Assistant
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="px-3 py-1 text-xs border rounded hover:opacity-80">
            Settings
          </button>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="px-2 py-1 text-xs border rounded">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <textarea
          value={content}
          onChange={(e) => updateContent(e.target.value)}
          placeholder="Start drafting your notes or documentation here..."
          className={`w-full h-[75vh] p-4 border rounded-lg focus:outline-none font-mono text-sm leading-relaxed resize-none ${
            theme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-200" : "bg-stone-50 border-black/10 text-black"
          }`}
        />
      </main>

      {/* Modals & Drawers */}
      <CodeInspectorModal isOpen={isInspectorOpen} onClose={() => setIsInspectorOpen(false)} theme={theme} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} apiKey={apiKey} onSaveApiKey={setApiKey} theme={theme} />
      <AssistantDrawer isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} apiKey={apiKey} notebookContext={content} theme={theme} />
      <InsertModal isOpen={isInsertOpen} onClose={() => setIsInsertOpen(false)} onInsertData={(type, val) => updateContent(`${content}\n\n![${type}](${val})`)} theme={theme} />
    </div>
  );
}