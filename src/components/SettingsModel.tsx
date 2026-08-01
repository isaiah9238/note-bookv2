import React, { useState, useEffect } from "react";
import { X, Key, Shield, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Trash2, RefreshCw } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  theme: "light" | "dark";
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  theme,
}) => {
  const [inputKey, setInputKey] = useState<string>(apiKey);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [testState, setTestState] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    setInputKey(apiKey);
    setTestState(null);
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    const keyToTest = inputKey.trim();
    if (!keyToTest) {
      setTestState({
        loading: false,
        success: false,
        error: "Please enter a Gemini API Key to test.",
      });
      return;
    }

    setTestState({ loading: true });

    try {
      const res = await fetch("/api/gemini/test-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": keyToTest,
        },
        body: JSON.stringify({ apiKey: keyToTest }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setTestState({
          loading: false,
          success: true,
          message: data.message || "API key verified successfully!",
        });
      } else {
        setTestState({
          loading: false,
          success: false,
          error: data.error || "Failed to authenticate with Gemini API key.",
        });
      }
    } catch (err: any) {
      setTestState({
        loading: false,
        success: false,
        error: err.message || "Network error testing key.",
      });
    }
  };

  const handleSave = () => {
    const trimmed = inputKey.trim();
    onSaveApiKey(trimmed);
    setTestState({
      loading: false,
      success: true,
      message: trimmed
        ? "Gemini API key saved to browser storage (localStorage)."
        : "API key cleared from browser storage. Using server default.",
    });
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setInputKey("");
    onSaveApiKey("");
    setTestState({
      loading: false,
      success: true,
      message: "API key removed from browser storage.",
    });
  };

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div
        className={`w-full max-w-lg border shadow-2xl rounded-sm p-6 relative transition-colors duration-200 ${
          isDark ? "bg-zinc-950 border-zinc-800 text-zinc-100" : "bg-white border-black/15 text-black"
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute right-4 top-4 p-1 rounded-xs transition-colors cursor-pointer ${
            isDark ? "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900" : "text-black/40 hover:text-black hover:bg-zinc-100"
          }`}
          title="Close Settings"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pr-6">
          <div
            className={`p-2.5 rounded-xs border ${
              isDark ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-[0.15em] uppercase">API Key & Authentication</h2>
            <p className={`text-xs ${isDark ? "text-zinc-400" : "text-black/60"}`}>
              Configure client-side Gemini credentials
            </p>
          </div>
        </div>

        {/* Memory Status Badge */}
        <div
          className={`mb-5 p-3 rounded-xs border text-xs flex items-center justify-between ${
            apiKey
              ? isDark
                ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-300"
                : "bg-emerald-50/80 border-emerald-200 text-emerald-800"
              : isDark
              ? "bg-zinc-900/60 border-zinc-800 text-zinc-400"
              : "bg-zinc-50 border-black/10 text-black/60"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                apiKey ? "bg-emerald-400 animate-pulse" : "bg-zinc-400"
              }`}
            />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
              {apiKey ? "Custom Key Active (Persisted)" : "Using Server Default Key"}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-widest opacity-80 font-mono">
            {apiKey ? "localStorage" : "Fallback Mode"}
          </span>
        </div>

        {/* Informational Box */}
        <p className={`text-xs leading-relaxed mb-4 ${isDark ? "text-zinc-400" : "text-black/70"}`}>
          Providing your Gemini API key resolves <code>unauthenticated request</code> errors or rate limits. Your key is stored securely in <strong>your browser&apos;s local storage</strong> (<code>localStorage</code>) so it persists across page refreshes, and is sent directly via <code>x-gemini-api-key</code> headers to API endpoints.
        </p>

        {/* Input Field */}
        <div className="space-y-2 mb-4">
          <label className={`block text-[10px] uppercase tracking-[0.15em] font-semibold ${isDark ? "text-zinc-400" : "text-black/60"}`}>
            Gemini API Key
          </label>
          <div className="relative flex items-center">
            <input
              type={showKey ? "text" : "password"}
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              className={`w-full border px-3 py-2 pr-10 text-xs font-mono outline-none rounded-xs transition-colors ${
                isDark
                  ? "bg-zinc-900 border-zinc-750 text-zinc-100 focus:border-emerald-500 placeholder:text-zinc-650"
                  : "bg-white border-black/20 text-black focus:border-emerald-600 placeholder:text-black/30"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className={`absolute right-2.5 p-1 transition-colors cursor-pointer ${
                isDark ? "text-zinc-500 hover:text-zinc-300" : "text-black/40 hover:text-black"
              }`}
              title={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Test Status Feedback */}
        {testState && (
          <div
            className={`mb-4 p-3 rounded-xs border text-xs flex items-start gap-2 animate-fade-in ${
              testState.loading
                ? isDark
                  ? "bg-zinc-900 border-zinc-800 text-zinc-300"
                  : "bg-zinc-100 border-black/10 text-black"
                : testState.success
                ? isDark
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  : "bg-emerald-50 border-emerald-300 text-emerald-900"
                : isDark
                ? "bg-red-950/40 border-red-800 text-red-300"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {testState.loading ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
            ) : testState.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="leading-snug">
              {testState.loading && <span>Testing key authentication with Gemini API...</span>}
              {testState.success && <span>{testState.message}</span>}
              {testState.error && <span>{testState.error}</span>}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-dashed border-zinc-800">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={testState?.loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border rounded-xs cursor-pointer transition-colors ${
                isDark
                  ? "border-zinc-750 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
                  : "border-black/15 bg-zinc-100 hover:bg-zinc-200 text-black"
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${testState?.loading ? "animate-spin" : ""}`} />
              Test Key
            </button>

            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border rounded-xs cursor-pointer transition-colors ${
                  isDark
                    ? "border-red-900/60 bg-red-950/20 hover:bg-red-900/40 text-red-400"
                    : "border-red-200 bg-red-50 hover:bg-red-100 text-red-700"
                }`}
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border rounded-xs cursor-pointer transition-colors ${
                isDark
                  ? "border-zinc-800 hover:bg-zinc-900 text-zinc-400"
                  : "border-black/10 hover:bg-zinc-100 text-black/60"
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-xs cursor-pointer transition-colors shadow-xs ${
                isDark
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-emerald-700 hover:bg-emerald-800 text-white"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
