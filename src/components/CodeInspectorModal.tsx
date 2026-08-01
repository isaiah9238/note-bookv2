import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  FolderTree,
  FileCode,
  Sparkles,
  Cpu,
  Layers,
  Play,
  Key,
  Bot,
  Send,
  Wrench,
  ShieldAlert,
  Minimize2,
  RefreshCw,
  FilePlus,
  Trash2,
  Edit3,
  CheckCircle,
  Info,
  X,
  Terminal,
  Download,
  Upload,
  AlertTriangle
} from "lucide-react";
import { Pipeline, VirtualFile } from "../Pipeline";
import { Scanner, ScanIssue, Token } from "../Scanner";

interface CodeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "light" | "dark";
  initialCode?: string;
  initialLanguage?: string;
  customApiKey?: string;
}

const STORAGE_KEY = "code_inspector_workspace_v1";

const DEFAULT_FILES: VirtualFile[] = [
  {
    id: "app-js",
    name: "app.js",
    language: "javascript",
    content: `console.log("Sandbox initialized!");\n\ndocument.getElementById("btn")?.addEventListener("click", () => {\n  console.log("Button clicked!");\n});`
  },
  {
    id: "index-html",
    name: "index.html",
    language: "html",
    content: `<!DOCTYPE html>\n<html>\n<body>\n  <h3>Sandbox Live Workspace</h3>\n  <button id="btn">Click Me</button>\n</body>\n</html>`
  }
];

export default function CodeInspectorModal({
  isOpen,
  onClose,
  initialCode,
  initialLanguage,
  customApiKey
}: CodeInspectorModalProps) {
  // Load workspace using the unified storage key
  const [virtualFiles, setVirtualFiles] = useState<VirtualFile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_FILES;
  });

  const [currentFileIdx, setCurrentFileIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"dashboard" | "compiler" | "issues" | "tokens" | "ai">("dashboard");
  const [terminalLogs, setTerminalLogs] = useState<{ level: string; msg: string }[]>([]);
  const [bundleUrl, setBundleUrl] = useState<string | null>(null);
  const [pipelineMetrics, setPipelineMetrics] = useState<any>(null);
  const [pipelineIssues, setPipelineIssues] = useState<ScanIssue[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  const [apiKey, setApiKey] = useState(() => customApiKey || localStorage.getItem("gemini_api_key") || "");
  const [promptInput, setPromptInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Synchronize initial code snippets when opened
  useEffect(() => {
    if (isOpen && initialCode) {
      const lang = (initialLanguage || "javascript").toLowerCase();
      const filename = lang === "html" ? "snippet.html" : "app.js";
      setVirtualFiles((prev) => {
        const existingIdx = prev.findIndex((f) => f.name === filename);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], content: initialCode };
          return updated;
        }
        return [{ name: filename, language: lang, content: initialCode }, ...prev];
      });
      setCurrentFileIdx(0);
    }
  }, [isOpen, initialCode, initialLanguage]);

  // Persist files to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(virtualFiles));
      setIsSaved(true);
      const timer = setTimeout(() => setIsSaved(false), 1200);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error("Failed to save workspace state:", e);
    }
  }, [virtualFiles]);

  // Handle postMessage logs from Sandbox iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "LOG") {
        setTerminalLogs((prev) => [...prev, { level: e.data.level || "info", msg: e.data.msg }]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const activeFile = virtualFiles[currentFileIdx] || virtualFiles[0];

  const updateFileContent = (newContent: string) => {
    setVirtualFiles((prev) => {
      const next = [...prev];
      if (next[currentFileIdx]) {
        next[currentFileIdx] = { ...next[currentFileIdx], content: newContent };
      }
      return next;
    });
  };

  // Run the Volume 3 Pipeline execution engine
  const runPipeline = () => {
    const pipeline = new Pipeline(virtualFiles);
    const output = pipeline.execute();

    setPipelineMetrics(output.metrics);
    setPipelineIssues(output.issues);
    setTokens(output.tokens);

    if (output.bundleUrl) {
      setBundleUrl(output.bundleUrl);
    }
  };

  // Trigger pipeline scan when switching to compiler or dashboard
  useEffect(() => {
    if (isOpen) {
      runPipeline();
    }
  }, [isOpen, virtualFiles]);

  const handleAddFile = () => {
    const filename = prompt("Enter new file name:", "utils.js");
    if (!filename?.trim()) return;
    const cleanName = filename.trim();
    const ext = cleanName.split(".").pop()?.toLowerCase();
    const lang = ext === "html" ? "html" : ext === "css" ? "css" : "javascript";

    setVirtualFiles((prev) => [
      ...prev,
      { id: `file-${Date.now()}`, name: cleanName, language: lang, content: "// New file content" }
    ]);
    setCurrentFileIdx(virtualFiles.length);
  };

  const handleDeleteFile = (idx: number) => {
    if (virtualFiles.length <= 1) return alert("Keep at least one file in workspace.");
    setVirtualFiles((prev) => prev.filter((_, i) => i !== idx));
    setCurrentFileIdx((prev) => Math.max(0, prev - 1));
  };

  const exportWorkspace = () => {
    const blob = new Blob([JSON.stringify(virtualFiles, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `code-inspector-workspace-${Date.now()}.json`;
    a.click();
  };

  const importWorkspace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setVirtualFiles(parsed);
          setCurrentFileIdx(0);
        }
      } catch (err) {
        alert("Invalid workspace JSON.");
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-6 animate-fade-in font-sans">
      <div className="w-full max-w-7xl h-[92vh] bg-[#181825] border border-[#313244] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#cdd6f4]">
        
        {/* Header */}
        <header className="bg-[#11111b] border-b border-[#313244] px-6 py-3 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-[#cba6f7] to-[#89b4fa] p-2 rounded-lg text-[#11111b]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-white uppercase flex items-center gap-2">
                Code Inspector Pro{" "}
                <span className="text-[9px] bg-[#a6e3a1] text-[#11111b] px-1.5 py-0.5 rounded font-black font-mono">
                  V3.6 Modular
                </span>
              </h1>
              <p className="text-[10px] text-[#a6adc8]">
                AST Parser, Static Linter, In-Memory Bundler & Live Console Capture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isSaved && (
              <div className="flex items-center gap-1 text-xs text-[#a6e3a1] font-mono">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Saved</span>
              </div>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg bg-[#313244] hover:bg-[#45475a] text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Workspace Shell */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* File Drawer */}
          <aside className="w-56 bg-[#11111b] border-r border-[#313244] flex flex-col shrink-0">
            <div className="p-3 border-b border-[#313244] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#a6adc8] flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-[#89b4fa]" /> Workspace
              </span>
              <div className="flex items-center gap-1">
                <button onClick={handleAddFile} className="p-1 text-[#a6adc8] hover:text-white" title="New File">
                  <FilePlus className="w-4 h-4" />
                </button>
                <button onClick={exportWorkspace} className="p-1 text-[#a6adc8] hover:text-[#a6e3a1]" title="Export JSON">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="p-1 text-[#a6adc8] hover:text-[#f9e2af]" title="Import JSON">
                  <Upload className="w-4 h-4" />
                </button>
                <input ref={fileInputRef} type="file" accept=".json" onChange={importWorkspace} className="hidden" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {virtualFiles.map((file, idx) => (
                <div
                  key={file.id || idx}
                  className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer text-xs font-mono ${
                    idx === currentFileIdx ? "bg-[#313244] text-white font-medium" : "text-[#a6adc8] hover:text-white"
                  }`}
                  onClick={() => setCurrentFileIdx(idx)}
                >
                  <span className="truncate flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-[#89b4fa]" />
                    {file.name}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(idx); }} className="hover:text-[#f38ba8]">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </aside>

          {/* Editor */}
          <main className="flex-1 flex flex-col bg-[#1e1e2e] relative">
            <div className="bg-[#11111b] border-b border-[#313244] px-4 py-2 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#cba6f7]" />
                <span className="font-medium text-white">{activeFile?.name}</span>
                <span className="text-[#585b70]">|</span>
                <span className="text-[#a6adc8] bg-[#313244] px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                  {activeFile?.language}
                </span>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
              <div ref={lineNumbersRef} className="w-12 bg-[#11111b] text-[#585b70] text-right pr-3 pt-4 select-none font-mono text-xs leading-6 overflow-hidden">
                {activeFile?.content.split("\n").map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                ref={editorRef}
                value={activeFile?.content || ""}
                onChange={(e) => updateFileContent(e.target.value)}
                onScroll={() => {
                  if (lineNumbersRef.current && editorRef.current) {
                    lineNumbersRef.current.scrollTop = editorRef.current.scrollTop;
                  }
                }}
                className="flex-1 bg-transparent text-[#cdd6f4] p-4 focus:outline-none resize-none font-mono text-xs leading-6 overflow-y-auto whitespace-pre block"
                spellCheck={false}
              />
            </div>
          </main>

          {/* Sidebar Panels */}
          <section className="w-80 sm:w-96 bg-[#11111b] border-l border-[#313244] flex flex-col shrink-0">
            <div className="flex border-b border-[#313244] text-[11px] font-mono shrink-0 select-none">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex-1 py-3 px-1 text-center border-b-2 font-semibold ${
                  activeTab === "dashboard" ? "border-[#cba6f7] text-white" : "border-transparent text-[#a6adc8]"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => { setActiveTab("compiler"); runPipeline(); }}
                className={`flex-1 py-3 px-1 text-center border-b-2 font-semibold ${
                  activeTab === "compiler" ? "border-[#a6e3a1] text-[#a6e3a1]" : "border-transparent text-[#a6adc8]"
                }`}
              >
                Compiler
              </button>
              <button
                onClick={() => setActiveTab("issues")}
                className={`flex-1 py-3 px-1 text-center border-b-2 font-semibold ${
                  activeTab === "issues" ? "border-[#f38ba8] text-[#f38ba8]" : "border-transparent text-[#a6adc8]"
                }`}
              >
                Issues ({pipelineIssues.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === "dashboard" && (
                <div className="space-y-4">
                  <div className="bg-[#181825] border border-[#313244] rounded-lg p-3 space-y-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Health Index</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#a6adc8]">Maintainability</span>
                        <span className="font-bold text-[#a6e3a1] font-mono">
                          {pipelineMetrics?.maintainabilityIndex || 100}/100
                        </span>
                      </div>
                      <div className="w-full bg-[#313244] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#a6e3a1] h-full transition-all duration-300"
                          style={{ width: `${pipelineMetrics?.maintainabilityIndex || 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#181825] border border-[#313244] rounded-lg p-3 space-y-2 font-mono text-[11px]">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Metrics</h4>
                    <div>Total Lines: <span className="text-white">{pipelineMetrics?.totalLines || 0}</span></div>
                    <div>Complexity Score: <span className="text-white">{pipelineMetrics?.complexityScore || 1}</span></div>
                    <div>Comment Ratio: <span className="text-white">{pipelineMetrics?.commentRatio || 0}%</span></div>
                  </div>
                </div>
              )}

              {activeTab === "compiler" && (
                <div className="space-y-3 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                      <Play className="w-4 h-4 text-[#a6e3a1]" /> Sandbox Frame
                    </h3>
                    <button
                      onClick={runPipeline}
                      className="bg-[#a6e3a1] text-[#11111b] text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 hover:bg-[#89b4fa]"
                    >
                      <RefreshCw className="w-3 h-3" /> Rebuild
                    </button>
                  </div>

                  <div className="h-48 bg-white rounded-lg border border-[#45475a] overflow-hidden">
                    {bundleUrl && <iframe src={bundleUrl} className="w-full h-full bg-white border-none" />}
                  </div>

                  <div className="flex-1 bg-[#11111b] border border-[#313244] rounded-lg p-2 flex flex-col overflow-hidden min-h-[120px]">
                    <div className="flex items-center justify-between pb-1 border-b border-[#313244] text-[10px] font-bold text-[#a6adc8] uppercase font-mono">
                      <span>Live Terminal</span>
                      <button onClick={() => setTerminalLogs([])} className="hover:text-white">Clear</button>
                    </div>
                    <div className="flex-1 font-mono text-[11px] overflow-y-auto space-y-1">
                      {terminalLogs.map((log, i) => (
                        <div key={i} className={log.level === "error" ? "text-[#f38ba8]" : log.level === "warn" ? "text-[#f9e2af]" : "text-[#a6e3a1]"}>
                          &gt; {log.msg}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "issues" && (
                <div className="space-y-2 font-mono text-xs">
                  {pipelineIssues.length === 0 ? (
                    <div className="text-[#a6e3a1] p-2 bg-[#a6e3a1]/10 rounded border border-[#a6e3a1]/30">
                      ✓ No linting issues found!
                    </div>
                  ) : (
                    pipelineIssues.map((iss, i) => (
                      <div key={i} className={`p-2 rounded border ${iss.severity === "error" ? "bg-[#f38ba8]/10 text-[#f38ba8] border-[#f38ba8]/30" : "bg-[#f9e2af]/10 text-[#f9e2af] border-[#f9e2af]/30"}`}>
                        <div className="font-bold uppercase text-[9px]">[Ln {iss.line}, Col {iss.column}]</div>
                        <div>{iss.message}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}