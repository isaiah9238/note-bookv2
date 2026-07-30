import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  FolderTree,
  FileCode,
  Sparkles,
  Cpu,
  Layers,
  PlayCircle,
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
  Package,
  Terminal,
  Globe,
  Brush,
  AlertTriangle,
  Play
} from "lucide-react";

interface VirtualFile {
  id: string;
  name: string;
  language: "javascript" | "html" | "css" | string;
  content: string;
}

interface CodeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "light" | "dark";
  initialCode?: string;
  initialLanguage?: string;
}

const DEFAULT_FILES: VirtualFile[] = [
  {
    id: "app-js",
    name: "app.js",
    language: "javascript",
    content: `// Workspace JavaScript Entry Point

function runHeavyMath(payload) {
  let result = 0;
  if (payload) {
    for (let i = 1; i <= 10; i++) {
      result += (i * i);
    }
  }
  return result;
}

function renderHtml(userInput) {
  const outputContainer = document.getElementById("output");
  if (outputContainer) {
    outputContainer.textContent = userInput;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const calcBtn = document.getElementById("calcBtn");
  if (calcBtn) {
    calcBtn.addEventListener("click", () => {
      const mathValue = runHeavyMath(true);
      renderHtml("Computation Result Success: " + mathValue);
    });
  }
});`
  },
  {
    id: "index-html",
    name: "index.html",
    language: "html",
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Security Check Sandbox</title>
</head>
<body>
  <div id="output">Rendering incoming data...</div>
  <button id="calcBtn">Activate</button>
</body>
</html>`
  },
  {
    id: "styles-css",
    name: "styles.css",
    language: "css",
    content: `/* Architecture Baseline Styling */
:root {
  --primary: #cba6f7;
  --secondary: #89b4fa;
}

body {
  background-color: #11111b;
  color: #cdd6f4;
  margin: 0;
  padding: 24px;
  font-family: sans-serif;
}

button {
  background: var(--primary);
  color: #11111b;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}`
  }
];

export default function CodeInspectorModal({
  isOpen,
  onClose,
  initialCode,
  initialLanguage
}: CodeInspectorModalProps) {
  const [virtualFiles, setVirtualFiles] = useState<VirtualFile[]>(() => {
    try {
      const saved = localStorage.getItem("code_inspector_files_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return DEFAULT_FILES;
  });

  const [currentFileIdx, setCurrentFileIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"ai" | "dashboard" | "issues" | "ast" | "compiler">("dashboard");
  const [bgDaemonEnabled, setBgDaemonEnabled] = useState(true);
  const [daemonStatus, setDaemonStatus] = useState<{ mode: "idle" | "typing" | "scanning" | "disabled"; text: string }>({
    mode: "idle",
    text: "Daemon: Watching"
  });

  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [apiInput, setApiInput] = useState("");
  const [promptInput, setPromptInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [compilerLogs, setCompilerLogs] = useState("Ready to bundle project components.");
  const [compiledBlobUrl, setCompiledBlobUrl] = useState<string | null>(null);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // If initialCode is provided, inject it as snippet.js or snippet.html
  useEffect(() => {
    if (isOpen && initialCode) {
      const lang = (initialLanguage || "javascript").toLowerCase();
      const filename = lang === "html" ? "notebook-snippet.html" : lang === "css" ? "notebook-snippet.css" : "notebook-snippet.js";
      setVirtualFiles((prev) => {
        const existingIdx = prev.findIndex((f) => f.name === filename);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], content: initialCode };
          return updated;
        } else {
          const newFile: VirtualFile = {
            id: `snippet-${Date.now()}`,
            name: filename,
            language: lang,
            content: initialCode
          };
          return [newFile, ...prev];
        }
      });
      setCurrentFileIdx(0);
    }
  }, [isOpen, initialCode, initialLanguage]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem("code_inspector_files_v3", JSON.stringify(virtualFiles));
    } catch {
      // Ignore
    }
  }, [virtualFiles]);

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

  // Static Analysis computation
  const computeAnalysis = () => {
    if (!activeFile) {
      return {
        lineCount: 0,
        charCount: 0,
        estTokens: 0,
        sizeBytes: 0,
        complexity: 1,
        deadVariables: [],
        issues: [],
        astNodes: [],
        maintainability: 100,
        securityHealth: 100
      };
    }

    const code = activeFile.content;
    const lang = activeFile.language;
    const lineCount = code.split("\n").length;
    const charCount = code.length;
    const estTokens = Math.ceil(charCount / 4.2);
    const sizeBytes = new Blob([code]).size;

    const issues: { severity: "error" | "warning"; text: string; category: string }[] = [];
    const astNodes: { type: string; name: string; line: number }[] = [];
    let complexity = 1;
    const deadVariables: { name: string; line: number }[] = [];

    const getLineFromIdx = (str: string, index: number) => str.substring(0, index).split("\n").length;

    if (lang === "javascript") {
      const branches = code.match(/(if\s*\(|for\s*\(|while\s*\(|catch\s*\(|(?:&&|\|\|)|\bcase\s+)/g);
      complexity = branches ? branches.length + 1 : 1;

      const variableDeclarations = [...code.matchAll(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=/g)];
      variableDeclarations.forEach((match) => {
        const varName = match[1];
        const escapedVarName = varName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const varRegex = new RegExp(`\\b${escapedVarName}\\b`, "g");
        const occurrences = (code.match(varRegex) || []).length;
        if (occurrences === 1) {
          deadVariables.push({ name: varName, line: getLineFromIdx(code, match.index || 0) });
        }
      });

      const secretRegex = /(?:api_key|token|secret|password|passwd|auth)\s*=\s*['"]([a-zA-Z0-9_\-]{8,})['"]/gi;
      let secMatch;
      while ((secMatch = secretRegex.exec(code)) !== null) {
        issues.push({
          severity: "error",
          text: `Security Vulnerability: Hardcoded secrets detection near '${secMatch[1].substring(0, 4)}***'`,
          category: "security"
        });
      }

      if (code.includes(".innerHTML")) {
        issues.push({
          severity: "warning",
          text: "Dangerous DOM manipulation Path: '.innerHTML' write path identified. Prefer using 'textContent' to avoid DOM XSS.",
          category: "security"
        });
      }

      if (code.match(/\beval\s*\(/)) {
        issues.push({
          severity: "error",
          text: "Severe Security Threat: Evaluation instruction 'eval()' located.",
          category: "security"
        });
      }

      const classRegex = /class\s+(\w+)/g;
      let cls;
      while ((cls = classRegex.exec(code)) !== null) {
        astNodes.push({ type: "ClassNode", name: cls[1], line: getLineFromIdx(code, cls.index) });
      }

      const funcRegex = /function\s+(\w+)|(\w+)\s*=\s*\([^)]*\)\s*=>/g;
      let fn;
      while ((fn = funcRegex.exec(code)) !== null) {
        const name = fn[1] || fn[2];
        if (name) astNodes.push({ type: "FunctionNode", name, line: getLineFromIdx(code, fn.index) });
      }

      variableDeclarations.forEach((match) => {
        astNodes.push({ type: "VariableScope", name: match[1], line: getLineFromIdx(code, match.index || 0) });
      });
    } else if (lang === "html") {
      const inlineOnRegex = /\bon[a-z]+\s*=\s*['"]/gi;
      if (inlineOnRegex.test(code)) {
        issues.push({
          severity: "warning",
          text: "Insecure Handler Strategy: Inline 'onEvent' detected. Migrate event tracking rules to script listeners.",
          category: "security"
        });
      }

      const tagRegex = /<([a-zA-Z0-9\-]+)(?:\s+[^>]*)*>/g;
      let tags;
      while ((tags = tagRegex.exec(code)) !== null) {
        if (!["html", "head", "body", "meta", "link"].includes(tags[1])) {
          astNodes.push({ type: "HtmlElement", name: `<${tags[1]}>`, line: getLineFromIdx(code, tags.index) });
        }
      }
    } else if (lang === "css") {
      const cssRegex = /([.#\w\-\s,:+>*]+)\s*\{/g;
      let sel;
      while ((sel = cssRegex.exec(code)) !== null) {
        const name = sel[1].trim();
        if (name && !name.startsWith("@")) {
          astNodes.push({ type: "StyleRule", name, line: getLineFromIdx(code, sel.index) });
        }
      }
    }

    deadVariables.forEach((v) => {
      issues.push({
        severity: "warning",
        text: `Static Linter Warning: "${v.name}" is declared but never referenced.`,
        category: "static"
      });
    });

    let maintainability = Math.max(
      20,
      Math.round(100 - complexity * 4.5 - deadVariables.length * 5 - issues.length * 10)
    );
    if (lineCount > 150) maintainability -= 10;
    maintainability = Math.max(10, Math.min(100, maintainability));

    const securityIssuesCount = issues.filter((i) => i.category === "security").length;
    let securityHealth = Math.max(10, Math.min(100, 100 - securityIssuesCount * 35));

    return {
      lineCount,
      charCount,
      estTokens,
      sizeBytes,
      complexity,
      deadVariables,
      issues,
      astNodes,
      maintainability,
      securityHealth
    };
  };

  const analysis = computeAnalysis();

  const handleCompileProject = () => {
    setCompilerLogs("Bundling workspace file tree...");
    const htmlFile = virtualFiles.find((f) => f.name.endsWith(".html"));
    const cssFile = virtualFiles.find((f) => f.name.endsWith(".css"));
    const jsFile = virtualFiles.find((f) => f.name.endsWith(".js"));

    if (!htmlFile) {
      setCompilerLogs("ERROR: Compilation failed. No HTML file found in workspace.");
      return;
    }

    setTimeout(() => {
      try {
        let rawHtml = htmlFile.content;
        const cssContent = cssFile ? cssFile.content : "";
        const jsContent = jsFile ? jsFile.content : "";

        const compiledStyles = `<style>\n${cssContent}\n</style>`;
        if (/<\/head>/i.test(rawHtml)) {
          rawHtml = rawHtml.replace(/(<\/head>)/i, `${compiledStyles}\n$1`);
        } else {
          rawHtml = compiledStyles + rawHtml;
        }

        const compiledScript = `<script>\n${jsContent}\n</script>`;
        if (/<\/body>/i.test(rawHtml)) {
          rawHtml = rawHtml.replace(/(<\/body>)/i, `${compiledScript}\n$1`);
        } else {
          rawHtml = rawHtml + compiledScript;
        }

        const blob = new Blob([rawHtml], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        setCompiledBlobUrl(url);
        setCompilerLogs(`⚡ Build Compiled Successfully! Bundled HTML (${htmlFile.content.length} B), CSS (${cssContent.length} B), JS (${jsContent.length} B)`);
      } catch (err: any) {
        setCompilerLogs(`COMPILER EXCEPTION: ${err.message}`);
      }
    }, 300);
  };

  const handleFormat = () => {
    if (!activeFile) return;
    const code = activeFile.content;
    const lang = activeFile.language;
    let formatted = code;

    if (lang === "javascript") {
      formatted = code
        .replace(/;\s*$/gm, ";")
        .replace(/{\s*$/gm, " {\n")
        .split("\n")
        .map((line) => line.trim())
        .filter((line, idx, arr) => !(line === "" && arr[idx - 1] === ""))
        .join("\n");

      let depth = 0;
      formatted = formatted
        .split("\n")
        .map((line) => {
          if (line.includes("}")) depth = Math.max(0, depth - 1);
          const lineOut = "  ".repeat(depth) + line;
          if (line.includes("{")) depth++;
          return lineOut;
        })
        .join("\n");
    } else {
      formatted = code
        .split("\n")
        .map((line) => line.trim())
        .join("\n");
    }

    updateFileContent(formatted);
  };

  const handleMinify = () => {
    if (!activeFile) return;
    const code = activeFile.content;
    const minified = code
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(?:^|[^:])\/\/.*/gm, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\s*([{}()\[\];,=+\-*/%&|<>:])\s*/g, "$1")
      .trim();

    updateFileContent(minified);
  };

  const handleAddFile = () => {
    const filename = prompt("Enter new filename:", "utils.js");
    if (!filename) return;
    const cleanName = filename.trim();
    if (!cleanName) return;

    if (virtualFiles.some((f) => f.name.toLowerCase() === cleanName.toLowerCase())) {
      alert("A file with that name already exists in the workspace.");
      return;
    }

    const ext = cleanName.split(".").pop()?.toLowerCase();
    let language = "javascript";
    let template = `// Workspace script: ${cleanName}\nfunction initialize() {\n  return true;\n}\ninitialize();`;

    if (ext === "html" || ext === "htm") {
      language = "html";
      template = `<!DOCTYPE html>\n<html>\n<head><title>${cleanName}</title></head>\n<body>\n  <div id="app"></div>\n</body>\n</html>`;
    } else if (ext === "css") {
      language = "css";
      template = `/* ${cleanName} Baseline Styling */\nbody {\n  margin: 0;\n  padding: 0;\n}`;
    }

    const newFile: VirtualFile = {
      id: `file-${Date.now()}`,
      name: cleanName,
      language,
      content: template
    };

    setVirtualFiles((prev) => [...prev, newFile]);
    setCurrentFileIdx(virtualFiles.length);
  };

  const handleRenameFile = (idx: number) => {
    const file = virtualFiles[idx];
    if (!file) return;
    const newName = prompt(`Rename ${file.name} to:`, file.name);
    if (!newName || !newName.trim() || newName === file.name) return;

    if (virtualFiles.some((f, i) => i !== idx && f.name.toLowerCase() === newName.toLowerCase())) {
      alert("A file with that name already exists.");
      return;
    }

    const ext = newName.split(".").pop()?.toLowerCase();
    let language = "javascript";
    if (ext === "html" || ext === "htm") language = "html";
    if (ext === "css") language = "css";

    setVirtualFiles((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], name: newName, language };
      return next;
    });
  };

  const handleDeleteFile = (idx: number) => {
    if (virtualFiles.length <= 1) {
      alert("Workspace Constraint: Keep at least one file.");
      return;
    }
    const file = virtualFiles[idx];
    if (!confirm(`Delete "${file?.name}"?`)) return;

    setVirtualFiles((prev) => prev.filter((_, i) => i !== idx));
    setCurrentFileIdx((prev) => Math.max(0, prev - 1));
  };

  const handleSaveApiKey = () => {
    if (apiInput.trim()) {
      setApiKey(apiInput.trim());
      localStorage.setItem("gemini_api_key", apiInput.trim());
      setApiInput("");
      alert("API Key Saved.");
    }
  };

  const handleRemoveApiKey = () => {
    setApiKey("");
    localStorage.removeItem("gemini_api_key");
    alert("API Key Removed.");
  };

  const handleRunAiPrompt = async (customPrompt?: string) => {
    const promptToUse = customPrompt || promptInput;
    if (!promptToUse.trim()) return;
    if (!apiKey) {
      alert("Please enter a Gemini API Key first.");
      return;
    }

    setAiLoading(true);
    try {
      const payload = {
        contents: [
          {
            parts: [
              {
                text: `You are an expert developer assistant inside Code Inspector Pro.
File: ${activeFile?.name} (${activeFile?.language})
Content:
\`\`\`${activeFile?.language}
${activeFile?.content}
\`\`\`

Task: ${promptToUse}

Return ONLY the updated code without markdown code blocks or explanations so it can be directly placed into the editor.`
              }
            ]
          }
        ]
      };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        let cleaned = data.candidates[0].content.parts[0].text.trim();
        cleaned = cleaned.replace(/^```[a-z]*\n/i, "").replace(/\n```$/, "");
        updateFileContent(cleaned);
        setPromptInput("");
      } else {
        throw new Error(data.error?.message || "Invalid response");
      }
    } catch (err: any) {
      alert("Gemini Error: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-6 animate-fade-in font-sans">
      <div className="w-full max-w-7xl h-[92vh] bg-[#181825] border border-[#313244] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#cdd6f4]">
        
        {/* Modal Header */}
        <header className="bg-[#11111b] border-b border-[#313244] px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-[#cba6f7] to-[#89b4fa] p-2 rounded-lg text-[#11111b]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-white uppercase flex items-center gap-2">
                The Code Inspector Pro{" "}
                <span className="text-[9px] bg-[#f9e2af] text-[#11111b] px-1 rounded font-mono">
                  V3.5 Compiler-Edition
                </span>
              </h1>
              <p className="text-[10px] text-[#a6adc8]">
                Advanced Complexity, Static Linter, & In-Memory Compiler
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Background Daemon Toggle */}
            <div className="flex items-center gap-2 bg-[#1e1e2e] px-3 py-1 rounded border border-[#313244]">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bgDaemonEnabled}
                  onChange={(e) => {
                    setBgDaemonEnabled(e.target.checked);
                    setDaemonStatus({
                      mode: e.target.checked ? "idle" : "disabled",
                      text: e.target.checked ? "Daemon: Watching" : "Daemon: Suspended"
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-7 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#a6e3a1]"></div>
              </label>
              <span className="text-[10px] text-[#a6adc8] font-medium uppercase tracking-wider">
                Daemon
              </span>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 bg-[#1e1e2e] px-3 py-1.5 rounded-md border border-[#313244] text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  daemonStatus.mode === "scanning"
                    ? "bg-[#f9e2af] animate-ping"
                    : daemonStatus.mode === "disabled"
                    ? "bg-[#585b70]"
                    : "bg-[#a6e3a1]"
                }`}
              />
              <span className="text-[#a6adc8] text-[11px] font-medium">{daemonStatus.text}</span>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#313244] hover:bg-[#45475a] text-white transition-colors cursor-pointer"
              title="Close Code Inspector Pro"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Sidebar: File Explorer */}
          <aside className="w-56 bg-[#11111b] border-r border-[#313244] flex flex-col shrink-0">
            <div className="p-3 border-b border-[#313244] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#a6adc8] flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-[#89b4fa]" /> Workspace
              </span>
              <button
                onClick={handleAddFile}
                className="text-[#a6adc8] hover:text-white transition-colors p-1"
                title="Create new virtual file"
              >
                <FilePlus className="w-4 h-4" />
              </button>
            </div>

            {/* Files List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {virtualFiles.map((file, idx) => {
                const isActive = idx === currentFileIdx;
                return (
                  <div
                    key={file.id || idx}
                    className="group flex items-center justify-between w-full px-2 py-1.5 rounded-md transition-all hover:bg-[#1e1e2e]/60"
                  >
                    <button
                      onClick={() => setCurrentFileIdx(idx)}
                      className={`flex-1 flex items-center gap-2 text-left text-xs truncate py-1 px-1 rounded transition-all font-mono ${
                        isActive ? "text-white font-medium bg-[#313244]" : "text-[#a6adc8] hover:text-white"
                      }`}
                    >
                      <FileCode className="w-4 h-4 shrink-0 text-[#89b4fa]" />
                      <span className="truncate">{file.name}</span>
                    </button>

                    <div className="hidden group-hover:flex items-center gap-1.5 shrink-0 ml-1">
                      <button
                        onClick={() => handleRenameFile(idx)}
                        className="text-[#a6adc8] hover:text-[#f9e2af] transition-colors p-0.5"
                        title="Rename"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(idx)}
                        className="text-[#a6adc8] hover:text-[#f38ba8] transition-colors p-0.5"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-[#181825] border-t border-[#313244] text-[10px] text-[#a6adc8] space-y-1">
              <div className="flex items-center gap-1 font-semibold text-white">
                <Info className="w-3.5 h-3.5 text-[#f9e2af]" />
                <span>Live Inspector</span>
              </div>
              <p className="leading-tight">Edits are audited in real time and saved locally.</p>
            </div>
          </aside>

          {/* Center Pane: Code Editor */}
          <main className="flex-1 flex flex-col bg-[#1e1e2e] relative">
            <div className="bg-[#11111b] border-b border-[#313244] px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-mono">
                <FileCode className="w-4 h-4 text-[#cba6f7]" />
                <span className="font-medium text-white">{activeFile?.name}</span>
                <span className="text-[#585b70]">|</span>
                <span className="text-[#a6adc8] bg-[#313244] px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                  {activeFile?.language}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFormat}
                  className="bg-[#313244] hover:bg-[#45475a] text-white px-3 py-1 rounded flex items-center gap-1.5 transition-colors text-xs font-medium cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#f9e2af]" /> Format
                </button>
                <button
                  onClick={() => setActiveTab("issues")}
                  className="bg-[#89b4fa] hover:bg-[#b4befe] text-[#11111b] font-semibold px-3 py-1 rounded flex items-center gap-1.5 transition-colors text-xs cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5" /> Audit
                </button>
              </div>
            </div>

            {/* Textarea Editor with Line Numbers */}
            <div className="flex-1 flex overflow-hidden relative">
              <div
                ref={lineNumbersRef}
                className="w-12 bg-[#11111b] text-[#585b70] text-right pr-3 pt-4 select-none font-mono text-xs leading-6 overflow-hidden"
              >
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
                placeholder="// Write or paste code here..."
              />
            </div>
          </main>

          {/* Right Sidebar: Inspector Tabs */}
          <section className="w-80 sm:w-96 bg-[#11111b] border-l border-[#313244] flex flex-col shrink-0">
            {/* Tab Header */}
            <div className="flex border-b border-[#313244] text-[11px] overflow-x-auto shrink-0 font-mono">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex-1 py-3 px-1 text-center border-b-2 font-semibold whitespace-nowrap cursor-pointer ${
                  activeTab === "dashboard" ? "border-[#cba6f7] text-white" : "border-transparent text-[#a6adc8] hover:text-white"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("issues")}
                className={`flex-1 py-3 px-1 text-center border-b-2 font-semibold whitespace-nowrap cursor-pointer ${
                  activeTab === "issues" ? "border-[#cba6f7] text-white" : "border-transparent text-[#a6adc8] hover:text-white"
                }`}
              >
                Audit ({analysis.issues.length})
              </button>
              <button
                onClick={() => setActiveTab("ast")}
                className={`flex-1 py-3 px-1 text-center border-b-2 font-semibold whitespace-nowrap cursor-pointer ${
                  activeTab === "ast" ? "border-[#cba6f7] text-white" : "border-transparent text-[#a6adc8] hover:text-white"
                }`}
              >
                AST ({analysis.astNodes.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab("compiler");
                  handleCompileProject();
                }}
                className={`flex-1 py-3 px-1 text-center border-b-2 font-semibold whitespace-nowrap cursor-pointer bg-[#1e1e2e] ${
                  activeTab === "compiler" ? "border-[#a6e3a1] text-[#a6e3a1]" : "border-transparent text-[#a6adc8] hover:text-white"
                }`}
              >
                Compiler
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`flex-1 py-3 px-1 text-center border-b-2 font-semibold whitespace-nowrap cursor-pointer ${
                  activeTab === "ai" ? "border-[#f9e2af] text-[#f9e2af]" : "border-transparent text-[#a6adc8] hover:text-white"
                }`}
              >
                AI
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* TAB 1: Dashboard */}
              {activeTab === "dashboard" && (
                <div className="space-y-4">
                  <div className="bg-[#181825] border border-[#313244] rounded-lg p-3 space-y-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Health Metrics
                    </h3>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#a6adc8]">Maintainability Index</span>
                        <span className="font-bold text-[#a6e3a1] font-mono">
                          {analysis.maintainability}/100
                        </span>
                      </div>
                      <div className="w-full bg-[#313244] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#a6e3a1] h-full transition-all duration-500"
                          style={{ width: `${analysis.maintainability}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#a6adc8]">Security Health</span>
                        <span className="font-bold text-[#a6e3a1] font-mono">
                          {analysis.securityHealth}%
                        </span>
                      </div>
                      <div className="w-full bg-[#313244] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#a6e3a1] h-full transition-all duration-500"
                          style={{ width: `${analysis.securityHealth}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="bg-[#181825] p-3 rounded-lg border border-[#313244]">
                      <div className="text-[10px] uppercase text-[#a6adc8]">Complexity</div>
                      <div className="text-lg font-bold text-white mt-1">{analysis.complexity}</div>
                    </div>
                    <div className="bg-[#181825] p-3 rounded-lg border border-[#313244]">
                      <div className="text-[10px] uppercase text-[#a6adc8]">Unused Vars</div>
                      <div className="text-lg font-bold text-white mt-1">
                        {analysis.deadVariables.length}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#181825] border border-[#313244] rounded-lg p-3 space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Workspace Payload
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="text-[#a6adc8]">Lines: <span className="text-white">{analysis.lineCount}</span></div>
                      <div className="text-[#a6adc8]">Bytes: <span className="text-white">{analysis.sizeBytes} B</span></div>
                      <div className="text-[#a6adc8]">Chars: <span className="text-white">{analysis.charCount}</span></div>
                      <div className="text-[#a6adc8]">Est Tokens: <span className="text-white">{analysis.estTokens}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Diagnostics */}
              {activeTab === "issues" && (
                <div className="space-y-3">
                  <div className="bg-[#181825] border border-[#313244] rounded-lg p-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5 font-mono">
                      <ShieldAlert className="w-4 h-4 text-[#f38ba8]" /> Static Analysis Audit
                    </h3>
                    {analysis.issues.length === 0 ? (
                      <div className="text-[#a6e3a1] flex gap-2 bg-[#a6e3a1]/10 p-3 rounded border border-[#a6e3a1]/30 text-xs">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Clean buffer! Passed security audits & static checks.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {analysis.issues.map((iss, i) => (
                          <div
                            key={i}
                            className={`flex gap-2.5 p-2.5 rounded border text-xs leading-relaxed ${
                              iss.severity === "error"
                                ? "bg-[#f38ba8]/10 border-[#f38ba8]/30 text-[#f38ba8]"
                                : "bg-[#f9e2af]/10 border-[#f9e2af]/30 text-[#f9e2af]"
                            }`}
                          >
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block uppercase text-[9px] tracking-wide font-mono">
                                {iss.category}
                              </span>
                              <span>{iss.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: AST */}
              {activeTab === "ast" && (
                <div className="space-y-3">
                  <div className="bg-[#181825] border border-[#313244] rounded-lg p-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2 font-mono">
                      <Layers className="w-4 h-4 text-[#a6e3a1]" /> AST Tree Map
                    </h3>
                    {analysis.astNodes.length === 0 ? (
                      <div className="text-[#585b70] italic text-xs p-1">
                        No structural nodes found in active file.
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs font-mono">
                        {analysis.astNodes.map((node, i) => {
                          let icon = <CodeCode className="w-3.5 h-3.5 text-[#cba6f7]" />;
                          if (node.type === "ClassNode") icon = <Package className="w-3.5 h-3.5 text-[#f9e2af]" />;
                          if (node.type === "FunctionNode") icon = <Terminal className="w-3.5 h-3.5 text-[#89b4fa]" />;
                          if (node.type === "HtmlElement") icon = <Globe className="w-3.5 h-3.5 text-[#a6e3a1]" />;
                          if (node.type === "StyleRule") icon = <Brush className="w-3.5 h-3.5 text-[#f38ba8]" />;

                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between bg-[#1e1e2e] p-2 rounded border border-[#313244]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {icon}
                                <div className="truncate">
                                  <span className="text-[9px] text-[#585b70] block uppercase font-bold leading-none">
                                    {node.type}
                                  </span>
                                  <span className="text-white text-xs block mt-0.5 truncate font-mono">
                                    {node.name}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[9px] bg-[#313244] text-[#a6adc8] px-1.5 py-0.5 rounded font-bold font-mono">
                                Ln {node.line}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: Compiler */}
              {activeTab === "compiler" && (
                <div className="space-y-3 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                      <Play className="w-4 h-4 text-[#a6e3a1]" /> Compiler Sandbox
                    </h3>
                    <button
                      onClick={handleCompileProject}
                      className="bg-[#a6e3a1] text-[#11111b] text-[11px] font-bold px-2 py-1 rounded flex items-center gap-1 hover:bg-[#89b4fa] transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Re-compile
                    </button>
                  </div>

                  <div className="bg-[#11111b] border border-[#313244] rounded p-2 text-[10px] font-mono text-[#a6adc8] select-text">
                    {compilerLogs}
                  </div>

                  <div className="flex-1 bg-white rounded-lg border-2 border-[#45475a] overflow-hidden min-h-[260px] flex flex-col relative">
                    <div className="bg-[#313244] text-[10px] px-3 py-1 flex items-center justify-between text-white font-semibold font-mono">
                      <span>Executable Output Frame</span>
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                    {compiledBlobUrl ? (
                      <iframe
                        src={compiledBlobUrl}
                        title="Compiler Sandbox Preview"
                        className="w-full flex-1 bg-white border-none"
                        sandbox="allow-scripts"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 italic p-4">
                        Click Re-compile to run code bundle.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: AI Copilot */}
              {activeTab === "ai" && (
                <div className="space-y-3">
                  <div className="bg-[#181825] border border-[#313244] rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Key className="w-4 h-4 text-[#f9e2af]" /> API Connection
                      </h3>
                      {apiKey && (
                        <button
                          onClick={handleRemoveApiKey}
                          className="text-[10px] text-[#f38ba8] hover:underline cursor-pointer"
                        >
                          Remove Key
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder={apiKey ? "••••••••••••••••••••" : "Enter Gemini API Key..."}
                        value={apiInput}
                        onChange={(e) => setApiInput(e.target.value)}
                        className="flex-1 bg-[#11111b] border border-[#313244] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#89b4fa] font-mono"
                      />
                      <button
                        onClick={handleSaveApiKey}
                        className="bg-[#89b4fa] text-[#11111b] font-bold text-xs px-3 py-1 rounded hover:bg-[#b4befe] transition-colors cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#181825] border border-[#313244] rounded-lg p-3 space-y-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Bot className="w-4 h-4 text-[#cba6f7]" /> Gemini Prompt Assistant
                    </h3>
                    <textarea
                      rows={3}
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      placeholder="Ask Gemini to refactor, write, or fix active file..."
                      className="w-full bg-[#11111b] border border-[#313244] rounded p-2 text-xs text-white focus:outline-none focus:border-[#cba6f7] resize-none font-mono"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRunAiPrompt()}
                        disabled={aiLoading}
                        className="flex-1 bg-[#cba6f7] text-[#11111b] font-bold text-xs py-1.5 rounded hover:bg-[#b4befe] transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {aiLoading ? "Processing..." : "Run Prompt"}
                      </button>
                      <button
                        onClick={() => handleRunAiPrompt("Review and fix static security and lint issues.")}
                        disabled={aiLoading}
                        className="bg-[#313244] hover:bg-[#45475a] text-[#a6e3a1] font-bold text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5" /> Auto-Fix
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Control Panel */}
            <div className="p-3 bg-[#11111b] border-t border-[#313244] shrink-0">
              <button
                onClick={handleMinify}
                className="w-full bg-[#313244] hover:bg-[#45475a] text-white py-2 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer font-mono"
              >
                <Minimize2 className="w-4 h-4" /> Minify Active Buffer
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function CodeCode(props: any) {
  return <FileCode {...props} />;
}
