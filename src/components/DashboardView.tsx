import React, { useEffect, useState } from "react";
import { Database, ShieldCheck, Terminal, HardDrive } from "lucide-react";

interface DashboardViewProps {
  theme?: "light" | "dark";
}

export function DashboardView({ theme = "light" }: DashboardViewProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const isDark = theme === "dark";

  useEffect(() => {
    // Fetch logs or metrics from Vault / Librarian backend
    setLogs([
      "[SYSTEM] Vault service connected.",
      "[SYNC] Notebook buffer persisted locally.",
      "[AUTH] Client session verified."
    ]);
  }, []);

  return (
    <div className={`p-6 border rounded-lg space-y-4 ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-stone-50 border-black/10 text-black"}`}>
      <div className="flex items-center gap-2">
        <Database className="w-5 h-5 text-emerald-500" />
        <h2 className="text-xs font-bold uppercase tracking-wider">Librarian Vault Logs</h2>
      </div>

      <div className={`p-3 border rounded font-mono text-xs space-y-1 ${isDark ? "bg-zinc-950 border-zinc-800 text-emerald-400" : "bg-white border-black/10 text-emerald-700"}`}>
        {logs.map((log, idx) => (
          <div key={idx}>{log}</div>
        ))}
      </div>
    </div>
  );
}