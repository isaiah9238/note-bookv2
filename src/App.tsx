import React, { useState, useEffect, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { auth, signInWithGoogle, signOutUser, db } from "./firebase";
import { Plus, Link, Image, Video, X, ChevronRight, ArrowLeft, Palette, Brush, Sparkles, Send, Loader2, Sun, Moon, Activity, Bell, Download, Printer, FileText, Copy, Maximize2, Minimize2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DrawingPad from "./components/DrawingPad";
import LogoIcon from "./components/LogoIcon";
import CodeInspectorModal from "./components/CodeInspectorModal";
import { CODE_INSPECTOR_SECTION_MD } from "./data/codeInspectorPro";

const STORAGE_KEY = "mini_note_content";
const NAME_KEY = "mini_note_owner_name";

const DEFAULT_CONTENT = `# System Design Notebook

Welcome to your minimalist design notebook. This system supports embedding sketches, drawings, and zero-dependency layout blocks.

Below is your live **System Design Console**. It has been built using a clean, pure-CSS tab layout to ensure high performance and lag-free interaction in the preview environment.

\`\`\`html
<div class="system-console" style="background-color: #0a0a0a; color: #fff; font-family: monospace; border: 1px solid #222; padding: 24px; border-radius: 6px; box-sizing: border-box; width: 100%; max-width: 100%;">
  
  <style>
    .system-console * {
      box-sizing: border-box;
    }
    .system-console .tab-radio {
      display: none;
    }
    .system-console .tabs-nav {
      display: flex;
      border-bottom: 2px solid #222;
      margin-bottom: 20px;
      gap: 16px;
    }
    .system-console .tab-label {
      padding: 10px 16px;
      cursor: pointer;
      color: #888;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      font-weight: bold;
      font-size: 13px;
      transition: all 0.2s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .system-console .tab-label:hover {
      color: #ff6600;
    }
    
    #tab-1:checked ~ .tabs-nav label[for="tab-1"] {
      color: #ff6600;
      border-bottom-color: #ff6600;
    }
    #tab-2:checked ~ .tabs-nav label[for="tab-2"] {
      color: #ff6600;
      border-bottom-color: #ff6600;
    }
    
    .system-console .tab-content {
      display: none;
    }
    
    #tab-1:checked ~ .content-panel-1 {
      display: block;
    }
    #tab-2:checked ~ .content-panel-2 {
      display: block;
    }
    
    .system-console .color-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
      gap: 16px;
    }
    .system-console .color-card {
      background: #121212;
      border: 1px solid #222;
      border-radius: 4px;
      padding: 8px;
      text-align: center;
      transition: border-color 0.2s;
    }
    .system-console .color-card:hover {
      border-color: #ff6600;
    }
    .system-console .color-swatch {
      width: 100%;
      height: 140px;
      border-radius: 2px;
      margin-bottom: 8px;
    }
    .system-console .color-value {
      font-size: 11px;
      color: #ff6600;
      font-weight: bold;
    }
    .system-console .color-name {
      font-size: 9px;
      color: #666;
      margin-top: 2px;
    }
    
    .system-console .panel {
      background: #121212;
      border: 1px solid #222;
      border-radius: 4px;
      padding: 16px;
    }
    .system-console .panel-title {
      font-size: 13px;
      font-weight: bold;
      color: #ff6600;
      border-bottom: 1px solid #222;
      padding-bottom: 8px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    @media (max-width: 600px) {
      .system-console .color-grid {
        display: flex;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        padding-bottom: 10px;
        gap: 16px;
      }
      .system-console .color-card {
        flex: 0 0 70px;
        scroll-snap-align: start;
      }
      .system-console .metrics-grid {
        grid-template-columns: 1fr !important;
      }
    }
  </style>

  <input type="radio" id="tab-1" name="console-tabs" class="tab-radio" checked />
  <input type="radio" id="tab-2" name="console-tabs" class="tab-radio" />

  <div class="tabs-nav">
    <label for="tab-1" class="tab-label">Color Palette</label>
    <label for="tab-2" class="tab-label">Geometry & Metrics</label>
  </div>

  <div class="tab-content content-panel-1">
    <div class="color-grid">
      <div class="color-card">
        <div class="color-swatch" style="background-color: #ff6600;"></div>
        <div class="color-value">#FF6600</div>
        <div class="color-name">Accent Orange</div>
      </div>
      <div class="color-card">
        <div class="color-swatch" style="background-color: #0a0a0a;"></div>
        <div class="color-value">#0A0A0A</div>
        <div class="color-name">Deep Dark</div>
      </div>
      <div class="color-card">
        <div class="color-swatch" style="background-color: #121212;"></div>
        <div class="color-value">#121212</div>
        <div class="color-name">Panel Grey</div>
      </div>
      <div class="color-card">
        <div class="color-swatch" style="background-color: #222222;"></div>
        <div class="color-value">#222222</div>
        <div class="color-name">Border Grey</div>
      </div>
      <div class="color-card">
        <div class="color-swatch" style="background-color: #888888;"></div>
        <div class="color-value">#888888</div>
        <div class="color-name">Muted Grey</div>
      </div>
      <div class="color-card">
        <div class="color-swatch" style="background-color: #ffffff;"></div>
        <div class="color-value">#FFFFFF</div>
        <div class="color-name">Pure White</div>
      </div>
    </div>
  </div>

  <div class="tab-content content-panel-2">
    <div class="metrics-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div class="panel">
        <div class="panel-title">Proportional Constraints Map</div>
        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #222; padding-bottom: 4px;">
            <span style="color: #888;">Base Scale Unit:</span>
            <span style="color: #ff6600;">8px</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #222; padding-bottom: 4px;">
            <span style="color: #888;">Swatch Width:</span>
            <span>70px</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #222; padding-bottom: 4px;">
            <span style="color: #888;">Swatch Height:</span>
            <span>140px <span style="color: #555;">(2:1 Ratio)</span></span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #222; padding-bottom: 4px;">
            <span style="color: #888;">Gap Spacing:</span>
            <span>16px <span style="color: #555;">(2x Base)</span></span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #888;">Container Padding:</span>
            <span>24px <span style="color: #555;">(3x Base)</span></span>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-title">Responsive Pipeline Status</div>
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 11px;">
          <div style="background: rgba(0,255,170,0.05); border: 1px solid rgba(0,255,170,0.2); padding: 8px; border-radius: 4px;">
            <strong style="color: #00ffaa;">DESKTOP VIEWPORT: ONLINE</strong>
            <p style="margin: 4px 0 0 0; color: #aaa;">Grid renders fully flat. No clipping or displacement.</p>
          </div>
          <div style="background: rgba(255,102,0,0.05); border: 1px solid rgba(255,102,0,0.2); padding: 8px; border-radius: 4px;">
            <strong style="color: #ff6600;">MOBILE VIEWPORT: ISOLATED</strong>
            <p style="margin: 4px 0 0 0; color: #aaa;">Overflow-X engine active. Proportions strictly locked via scroll track.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

</div>
\`\`\`

---

## Priority Execution Matrix

Manage your urgent and strategic tasks directly in the interactive matrix console below:

\`\`\`html
<!-- INTERACTIVE TASK MATRIX CONSOLE -->
<div class="matrix-console-wrapper">
  
  <style>
    .matrix-console-wrapper {
      --bg-color: #0A0A0A;
      --surface-color: #141414;
      --border-color: #222222;
      --text-primary: #E0E0E0;
      --text-muted: #888888;
      --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
      
      /* Priority Accents */
      --color-do: #FF5500;       /* Urgent & Important */
      --color-schedule: #00FFCC; /* Important, Not Urgent */
      --color-delegate: #BD93F9; /* Urgent, Not Important */
      --color-eliminate: #444444;/* Neither */

      box-sizing: border-box;
      max-width: 100%;
      margin: 10px auto;
      font-family: var(--font-mono);
      color: var(--text-primary);
    }

    .matrix-box {
      background-color: var(--bg-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 24px;
      box-sizing: border-box;
    }

    .matrix-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 14px;
      margin-bottom: 20px;
    }

    .matrix-title {
      font-size: 14px;
      font-weight: bold;
      color: #FFF;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Task Input Bar */
    .task-input-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .task-input {
      flex: 1;
      min-width: 200px;
      background: #050505;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 10px 14px;
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: 12px;
    }

    .task-input:focus {
      outline: 1px solid var(--color-schedule);
      border-color: transparent;
    }

    .quadrant-select {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 10px;
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: 11px;
      cursor: pointer;
    }

    .add-btn {
      background: #111;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: 11px;
      text-transform: uppercase;
      transition: all 0.2s;
    }

    .add-btn:hover {
      background: var(--text-primary);
      color: var(--bg-color);
    }

    /* 4 Quadrants Grid */
    .matrix-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .quadrant {
      background-color: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 16px;
      min-height: 200px;
      display: flex;
      flex-direction: column;
    }

    .quadrant-header {
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .quadrant-q1 .quadrant-header { color: var(--color-do); }
    .quadrant-q2 .quadrant-header { color: var(--color-schedule); }
    .quadrant-q3 .quadrant-header { color: var(--color-delegate); }
    .quadrant-q4 .quadrant-header { color: var(--color-eliminate); }

    .task-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-grow: 1;
    }

    .task-item {
      background: #1b1b1b;
      border-left: 3px solid transparent;
      padding: 10px;
      border-radius: 3px;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      animation: taskFade 0.2s ease-out;
    }

    @keyframes taskFade {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .quadrant-q1 .task-item { border-left-color: var(--color-do); }
    .quadrant-q2 .task-item { border-left-color: var(--color-schedule); }
    .quadrant-q3 .task-item { border-left-color: var(--color-delegate); }
    .quadrant-q4 .task-item { border-left-color: var(--color-eliminate); }

    .delete-task-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-family: var(--font-mono);
      font-size: 10px;
    }

    .delete-task-btn:hover {
      color: #ff3333;
    }

    .empty-state {
      font-size: 10px;
      color: var(--text-muted);
      text-align: center;
      margin: auto;
      font-style: italic;
    }
  </style>

  <div class="matrix-box">
    
    <div class="matrix-header">
      <div class="matrix-title">Priority Execution Matrix</div>
    </div>

    <!-- Quick Task Injector Form -->
    <div class="task-input-bar">
      <input type="text" id="task-text-input" class="task-input" placeholder="Initiate task description..." onkeydown="if(event.key === 'Enter') addTask()" />
      
      <select id="task-quadrant-input" class="quadrant-select">
        <option value="q1">Q1: Urgent / Important (Do)</option>
        <option value="q2">Q2: Strategic / Non-Urgent (Schedule)</option>
        <option value="q3">Q3: Urgent / Non-Important (Delegate)</option>
        <option value="q4">Q4: Non-Urgent / Non-Important (Eliminate)</option>
      </select>

      <button class="add-btn" onclick="addTask()">Deploy</button>
    </div>

    <!-- Matrix Visualization Grid -->
    <div class="matrix-grid">
      
      <!-- Q1: DO -->
      <div class="quadrant quadrant-q1">
        <div class="quadrant-header">
          <span>Q1 // Critical</span>
          <span style="font-size: 9px; opacity: 0.6;">[Do]</span>
        </div>
        <div id="q1-list" class="task-list">
          <div class="empty-state">No critical actions queued.</div>
        </div>
      </div>

      <!-- Q2: SCHEDULE -->
      <div class="quadrant quadrant-q2">
        <div class="quadrant-header">
          <span>Q2 // Strategic</span>
          <span style="font-size: 9px; opacity: 0.6;">[Schedule]</span>
        </div>
        <div id="q2-list" class="task-list">
          <div class="empty-state">No strategic items scheduled.</div>
        </div>
      </div>

      <!-- Q3: DELEGATE -->
      <div class="quadrant quadrant-q3">
        <div class="quadrant-header">
          <span>Q3 // Operational</span>
          <span style="font-size: 9px; opacity: 0.6;">[Delegate]</span>
        </div>
        <div id="q3-list" class="task-list">
          <div class="empty-state">No operations delegated.</div>
        </div>
      </div>

      <!-- Q4: ELIMINATE -->
      <div class="quadrant quadrant-q4">
        <div class="quadrant-header">
          <span>Q4 // Trivial</span>
          <span style="font-size: 9px; opacity: 0.6;">[Eliminate]</span>
        </div>
        <div id="q4-list" class="task-list">
          <div class="empty-state">No noise detected.</div>
        </div>
      </div>

    </div>

  </div>

  <script>
    // Self-contained dynamic task controller
    function addTask() {
      const textInput = document.getElementById('task-text-input');
      const quadInput = document.getElementById('task-quadrant-input');
      
      const taskText = textInput.value.trim();
      const targetQuad = quadInput.value;

      if (!taskText) return;

      const targetList = document.getElementById(targetQuad + "-list");
      
      // Clear out empty state if it's there
      const emptyState = targetList.querySelector('.empty-state');
      if (emptyState) {
        emptyState.remove();
      }

      // Generate task list element
      const li = document.createElement('div');
      li.className = 'task-item';
      li.innerHTML = "<span>" + taskText + "</span><button class=\"delete-task-btn\" onclick=\"removeTask(this, '" + targetQuad + "')\">✖</button>";

      targetList.appendChild(li);
      textInput.value = ''; // Reset input
    }

    function removeTask(button, quadId) {
      const item = button.closest('.task-item');
      const list = document.getElementById(quadId + "-list");
      item.remove();

      // If list is now empty, re-render empty state message
      if (list.children.length === 0) {
        let text = "No items queued.";
        if (quadId === 'q1') text = "No critical actions queued.";
        if (quadId === 'q2') text = "No strategic items scheduled.";
        if (quadId === 'q3') text = "No operations delegated.";
        if (quadId === 'q4') text = "No noise detected.";
        
        list.innerHTML = "<div class=\"empty-state\">" + text + "</div>";
      }
    }
  </script>
</div>
\`\`\`

${CODE_INSPECTOR_SECTION_MD}

---
Enjoy your custom layouts and embedded sketches!
`;

type ViewMode = "cover" | "intro" | "editor" | "dashboard";

function DashboardView({ theme, setViewMode }: { theme: "light" | "dark", setViewMode: (mode: ViewMode) => void }) {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    auth.currentUser?.getIdToken().then(token => {
      fetch("/api/librarian/logs", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => setLogs(data))
        .catch((err) => console.error("Failed to fetch logs", err));
    });
  }, []);

  return (
    <div className={`min-h-[100dvh] ${theme === "dark" ? "bg-[#121212] text-zinc-100" : "bg-white text-black"} p-6 sm:p-12 font-mono transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <header className="flex items-center justify-between border-b pb-4 border-current/10">
          <h1 className="text-xl uppercase tracking-widest">Sovereign Gatekeeper Logs</h1>
          <button 
            onClick={() => setViewMode("intro")}
            className="text-xs uppercase tracking-widest px-4 py-2 border border-current/20 hover:bg-current/5 transition-colors"
          >
            Lock Console
          </button>
        </header>
        
        <div className={`border ${theme === "dark" ? "border-zinc-800 bg-zinc-900/50" : "border-black/10 bg-black/5"} rounded p-6 h-[60vh] overflow-y-auto space-y-2`}>
          {logs.length === 0 ? (
            <p className="opacity-50 text-sm">No events logged yet.</p>
          ) : (
            logs.slice().reverse().map((log, i) => (
              <div key={i} className={`text-sm flex gap-4 ${log.status === "DENIED" ? "text-red-500" : "text-green-500"}`}>
                <span className="opacity-50">[{log.timestamp.slice(11, 19)}]</span>
                <span className="w-20">{log.status}</span>
                <span>{log.email}</span>
                <span className="opacity-50">{log.ip}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [ownerName, setOwnerName] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cover");
  const [editorMode, setEditorMode] = useState<"write" | "view">("write");

  // Code Inspector Pro states
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorCode, setInspectorCode] = useState<string | undefined>(undefined);
  const [inspectorLang, setInspectorLang] = useState<string | undefined>(undefined);

  const handleOpenInspector = (code?: string, lang?: string) => {
    setInspectorCode(code);
    setInspectorLang(lang);
    setIsInspectorOpen(true);
  };

  // Insert modal states
  const [isInsertOpen, setIsInsertOpen] = useState(false);
  const [insertStep, setInsertStep] = useState<"menu" | "link_options" | "form">("menu");
  const [activeForm, setActiveForm] = useState<"url" | "uri" | "website" | "photo" | "video" | "color" | "drawing" | null>(null);
  const [inputUrl, setInputUrl] = useState("");
  const [inputTitle, setInputTitle] = useState("");
  const [savedSelection, setSavedSelection] = useState<{ start: number; end: number; text: string } | null>(null);

  // Color picker states
  const [selectedColor, setSelectedColor] = useState({
    hex: "#ff5733",
    r: 255,
    g: 87,
    b: 51,
    h: 11,
    s: 100,
    l: 60
  });

  const [drawings, setDrawings] = useState<Record<string, string>>({});
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isLayoutStretched, setIsLayoutStretched] = useState<boolean>(() => localStorage.getItem("mini_note_layout_stretched") === "true");

  const toggleLayoutStretch = () => {
    setIsLayoutStretched(prev => {
      const next = !prev;
      localStorage.setItem("mini_note_layout_stretched", String(next));
      return next;
    });
  };

  // Session, Activity logs & Toast states
  const [sessionId] = useState(() => {
    const existing = sessionStorage.getItem("mini_note_session_id");
    if (existing) return existing;
    const newId = "session_" + Math.random().toString(36).substring(2, 11);
    sessionStorage.setItem("mini_note_session_id", newId);
    return newId;
  });
  const [activityLogs, setActivityLogs] = useState<{ id: string; type: string; userName: string; userEmail: string; details: string; timestamp: number; sessionId: string }[]>([]);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: string; userName: string; timestamp: number }[]>([]);
  const [isActivityPanelOpen, setIsActivityPanelOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const logActivity = async (type: "visit" | "edit" | "chat", details: string) => {
    try {
      const logData = {
        type,
        userName: ownerName.trim() || user?.displayName || "Guest User",
        userEmail: user?.email || "Guest Email",
        details,
        timestamp: Date.now(),
        sessionId: sessionId
      };
      await addDoc(collection(db, "activity_logs"), logData);
    } catch (err) {
      console.warn("Failed to log activity:", err);
    }
  };

  // Assistant Chat states
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: "user" | "model", text: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [user, loading] = useAuthState(auth);
  const [prevUserUid, setPrevUserUid] = useState<string | null | undefined>(undefined);
  const lastSyncedRef = useRef<{
    content: string;
    ownerName: string;
    drawings: Record<string, string>;
    theme: string;
  } | null>(null);
  const [authError, setAuthError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Librarian Gatekeeper State
  const [accessChecked, setAccessChecked] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Librarian Gatekeeper Effect
  useEffect(() => {
    if (!user) {
      setAccessChecked(false);
      setAccessDenied(false);
      return;
    }
    
    let isMounted = true;
    const checkAccess = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const headers = { "Authorization": `Bearer ${idToken}` };
        
        const [allowedRes, dneRes] = await Promise.all([
          fetch("/api/librarian/allowed-users", { headers }),
          fetch("/api/librarian/dne-list", { headers })
        ]);
        
        const allowedUsers = await allowedRes.json();
        const dneList = await dneRes.json();
        const email = user.email || "";
        const displayName = user.displayName || "";
        
        // Check if user is in DNE list (by exact match or substring in email or name)
        const inDneList = dneList.some((dne: string) => 
          email.toLowerCase().includes(dne.toLowerCase()) || 
          displayName.toLowerCase().includes(dne.toLowerCase())
        );

        const isAllowed = !inDneList && email && allowedUsers.includes(email);
        
        await fetch("/api/librarian/log", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({ email, status: isAllowed ? "GRANTED" : "DENIED" })
        });

        if (!isMounted) return;

        if (!isAllowed) {
          console.warn(`ACCESS_DENIED: ${email} ${inDneList ? "(Matched DNE list)" : ""}`);
          await signOutUser();
          setAccessDenied(true);
        } else {
          console.log(`ACCESS_GRANTED: ${email}`);
          setAccessChecked(true);
        }
      } catch (err) {
        console.error("Librarian check error", err);
      }
    };
    
    if (!accessChecked && !accessDenied) {
      checkAccess();
    }

    return () => { isMounted = false; };
  }, [user, accessChecked, accessDenied]);

  // Synchronously reset isLoaded and lastSyncedRef when user authentication state changes
  const currentUserUid = user ? user.uid : null;
  if (prevUserUid !== currentUserUid) {
    setPrevUserUid(currentUserUid);
    setIsLoaded(false);
    lastSyncedRef.current = null;
  }

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError("");
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.warn(error);
      const isIframe = window.self !== window.top;
      if (error.code === 'auth/popup-blocked') {
        setAuthError("Popup blocked. Please allow popups or use the 'Open in New Tab' button below.");
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        if (isIframe) {
          setAuthError("Sign-in cancelled. Because you are inside the AI Studio frame on a mobile device, please open this app in a new tab to sign in successfully.");
        } else {
          setAuthError("Sign-in was cancelled.");
        }
      } else {
        setAuthError(error.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your entire notebook? This cannot be undone.")) {
      setContent("");
      setDrawings({});
    }
  };

  const handlePrint = () => {
    logActivity("chat", "Printed notebook/Saved as PDF");
    window.print();
  };

  const handleExportMarkdown = () => {
    try {
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const fileName = `${ownerName.trim() ? ownerName.trim().replace(/\s+/g, "_") : "notebook"}_draft.md`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      logActivity("chat", `Exported notebook as Markdown: ${fileName}`);
    } catch (err) {
      console.error("Markdown export failed", err);
    }
  };

  const handleExportTxt = () => {
    try {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const fileName = `${ownerName.trim() ? ownerName.trim().replace(/\s+/g, "_") : "notebook"}_draft.txt`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      logActivity("chat", `Exported notebook as Plain Text: ${fileName}`);
    } catch (err) {
      console.error("TXT export failed", err);
    }
  };

  const handleCopyToClipboard = () => {
    try {
      navigator.clipboard.writeText(content);
      const id = "copy_" + Date.now();
      setToasts(prev => [
        ...prev,
        {
          id,
          message: "Copied notebook markdown content to clipboard!",
          type: "info",
          userName: "System",
          timestamp: Date.now()
        }
      ]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4500);
      
      logActivity("chat", "Copied notebook to clipboard");
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  const ensureCodeInspector = (rawText: string) => {
    if (!rawText || !rawText.includes("Code Inspector Pro")) {
      return (rawText ? rawText.trim() + "\n\n" : "") + CODE_INSPECTOR_SECTION_MD;
    }
    return rawText;
  };

  // Load saved content from local or cloud
  useEffect(() => {
    async function loadContent() {
      if (user) {
        try {
          // Load from cloud if user exists
          const draftRef = doc(db, "drafts", user.uid);
          const snap = await getDoc(draftRef);
          if (snap.exists()) {
            const data = snap.data();
            const loadedContent = ensureCodeInspector(data.content ? data.content : DEFAULT_CONTENT);
            const loadedOwnerName = data.ownerName !== undefined ? data.ownerName : "";
            const loadedDrawings = data.drawings !== undefined ? (data.drawings || {}) : {};
            const loadedTheme = (data.theme === "dark" || data.theme === "light") ? data.theme : "light";

            setContent(loadedContent);
            setOwnerName(loadedOwnerName);
            setDrawings(loadedDrawings);
            setTheme(loadedTheme);

            lastSyncedRef.current = {
              content: loadedContent,
              ownerName: loadedOwnerName,
              drawings: loadedDrawings,
              theme: loadedTheme
            };
          } else {
            // If no cloud data yet, fallback to local storage
            const savedContent = ensureCodeInspector(localStorage.getItem(STORAGE_KEY) || DEFAULT_CONTENT);
            const savedName = localStorage.getItem(NAME_KEY) || "";
            const savedTheme = localStorage.getItem("mini_note_theme") as "light" | "dark" | null;
            const finalTheme = savedTheme || "light";
            let savedDrawingsObj = {};
            const savedDrawings = localStorage.getItem("mini_note_drawings");
            if (savedDrawings) {
              try { savedDrawingsObj = JSON.parse(savedDrawings); } catch (e) {}
            }

            setContent(savedContent);
            setOwnerName(savedName);
            setTheme(finalTheme);
            setDrawings(savedDrawingsObj);

            lastSyncedRef.current = {
              content: savedContent,
              ownerName: savedName,
              drawings: savedDrawingsObj,
              theme: finalTheme
            };
          }
        } catch (error) {
          console.warn("Failed to load from cloud, falling back to local storage:", error);
          const savedContent = ensureCodeInspector(localStorage.getItem(STORAGE_KEY) || DEFAULT_CONTENT);
          const savedName = localStorage.getItem(NAME_KEY) || "";
          const savedTheme = localStorage.getItem("mini_note_theme") as "light" | "dark" | null;
          const finalTheme = savedTheme || "light";
          let savedDrawingsObj = {};
          const savedDrawings = localStorage.getItem("mini_note_drawings");
          if (savedDrawings) {
            try { savedDrawingsObj = JSON.parse(savedDrawings); } catch (e) {}
          }

          setContent(savedContent);
          setOwnerName(savedName);
          setTheme(finalTheme);
          setDrawings(savedDrawingsObj);

          lastSyncedRef.current = {
            content: savedContent,
            ownerName: savedName,
            drawings: savedDrawingsObj,
            theme: finalTheme
          };
        }
      } else {
        // Load local
        const savedContent = ensureCodeInspector(localStorage.getItem(STORAGE_KEY) || DEFAULT_CONTENT);
        const savedName = localStorage.getItem(NAME_KEY) || "";
        const savedTheme = localStorage.getItem("mini_note_theme") as "light" | "dark" | null;
        const finalTheme = savedTheme || "light";
        let savedDrawingsObj = {};
        const savedDrawings = localStorage.getItem("mini_note_drawings");
        if (savedDrawings) {
          try { savedDrawingsObj = JSON.parse(savedDrawings); } catch (e) {}
        }

        setContent(savedContent);
        setOwnerName(savedName);
        setTheme(finalTheme);
        setDrawings(savedDrawingsObj);

        lastSyncedRef.current = {
          content: savedContent,
          ownerName: savedName,
          drawings: savedDrawingsObj,
          theme: finalTheme
        };
      }
      setIsLoaded(true);
    }
    
    if (!loading) {
      loadContent();
    }
  }, [user, loading]);

  // Auto-save content & drawings & theme
  useEffect(() => {
    if (isLoaded) {
      const timeoutId = setTimeout(async () => {
        localStorage.setItem(STORAGE_KEY, content);
        localStorage.setItem("mini_note_drawings", JSON.stringify(drawings));
        localStorage.setItem("mini_note_theme", theme);

        // Only save to the cloud if the content actually changed from the last synced state
        const isChanged = !lastSyncedRef.current ||
          lastSyncedRef.current.content !== content ||
          lastSyncedRef.current.ownerName !== ownerName ||
          lastSyncedRef.current.theme !== theme ||
          JSON.stringify(lastSyncedRef.current.drawings) !== JSON.stringify(drawings);

        if (isChanged) {
          if (user) {
            try {
              await setDoc(doc(db, "drafts", user.uid), {
                content,
                ownerName,
                drawings,
                theme,
                userId: user.uid,
                updatedAt: Date.now()
              }, { merge: true });

              lastSyncedRef.current = {
                content,
                ownerName,
                drawings,
                theme
              };
              logActivity("edit", "Updated the notebook cloud draft");
            } catch (e) {
              console.warn("Failed to save to cloud:", e);
            }
          } else {
            logActivity("edit", "Updated the notebook local draft");
          }
        }
      }, 1000); // 1s debounce
      return () => clearTimeout(timeoutId);
    }
  }, [content, ownerName, drawings, isLoaded, user, theme]);

  // Log initial session visit
  const loggedVisitRef = useRef(false);
  useEffect(() => {
    if (isLoaded && !loggedVisitRef.current) {
      loggedVisitRef.current = true;
      logActivity("visit", "Opened the notebook");
    }
  }, [isLoaded]);

  // Real-time activity snapshot listener
  useEffect(() => {
    if (!db) return;
    const q = query(
      collection(db, "activity_logs"),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    let initialLoad = true;

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const logs: any[] = [];
        snapshot.forEach((doc) => {
          logs.push({ id: doc.id, ...doc.data() });
        });
        setActivityLogs(logs);

        if (initialLoad) {
          initialLoad = false;
          return;
        }

        // Check for incoming changes from other sessions to trigger toast notifications
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            // Filter out events triggered by this exact session and events older than 15s
            if (
              data.sessionId !== sessionId &&
              Math.abs(Date.now() - (data.timestamp || 0)) < 15000
            ) {
              const actionText = 
                data.type === "visit" ? "opened the notebook" :
                data.type === "edit" ? "updated the notebook" :
                data.type === "chat" ? "queried the AI companion" : "touched the app";

              const newToast = {
                id: change.doc.id,
                message: `${data.userName || "Someone"} ${actionText}`,
                type: data.type,
                userName: data.userName || "Someone",
                timestamp: data.timestamp
              };
              
              setToasts((prev) => [newToast, ...prev].slice(0, 5));
              
              // Automatically clear toast after 4.5 seconds
              setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== change.doc.id));
              }, 4500);
            }
          }
        });
      },
      (error) => {
        console.warn("Activity logs subscription error (possibly rules propagating):", error);
      }
    );

    return () => unsubscribe();
  }, [db, sessionId]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content, editorMode]);

  // Auto-save owner name locally (cloud saving handled in the above effect)
  useEffect(() => {
    if (isLoaded) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(NAME_KEY, ownerName);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [ownerName, isLoaded]);

  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent(prev => prev + textToInsert);
      return;
    }

    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;
    if (savedSelection) {
      start = savedSelection.start;
      end = savedSelection.end;
    }
    const oldText = textarea.value;
    
    const newText = oldText.substring(0, start) + textToInsert + oldText.substring(end);
    setContent(newText);
    
    // Set focus and cursor position after state updates
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
      setSavedSelection(null);
    }, 0);
  };

  const handleApplyToNotebook = (suggestedText: string, language?: string) => {
    let finalContent = suggestedText;
    const lang = language ? language.toLowerCase() : "";
    
    // Smart replacement: if there is an existing code block of the same language, replace it
    if (lang && ["html", "jsx", "css", "js", "javascript", "typescript", "markdown", "md"].includes(lang)) {
      const codeBlockStart = `\`\`\`${lang}`;
      const startIndex = content.indexOf(codeBlockStart);
      if (startIndex !== -1) {
        const blockContentStart = startIndex + codeBlockStart.length;
        const endIndex = content.indexOf("```", blockContentStart);
        if (endIndex !== -1) {
          const before = content.substring(0, startIndex);
          const after = content.substring(endIndex + 3);
          const newBlock = `${codeBlockStart}\n${suggestedText}\n\`\`\``;
          setContent(before + newBlock + after);
          setEditorMode("view");
          logActivity("edit", `Updated existing ${lang} code block in notebook and toggled view mode`);
          triggerToast(`Updated the design console block in your notebook!`, "success");
          return;
        }
      }
    }
    
    // Fallback: If no existing block, replace the entire notebook
    if (lang && ["html", "jsx", "css", "js", "javascript", "typescript", "markdown", "md"].includes(lang)) {
      finalContent = `\`\`\`${lang}\n${suggestedText}\n\`\`\``;
    }
    setContent(finalContent);
    setEditorMode("view");
    logActivity("edit", "Replaced notebook content via AI assistant suggestion and toggled view mode");
    triggerToast("Notebook content replaced with AI suggested code/text!", "success");
  };

  const handleAppendToNotebook = (suggestedText: string, language?: string) => {
    let finalContent = suggestedText;
    if (language && ["html", "jsx", "css", "js", "javascript", "typescript", "markdown", "md"].includes(language.toLowerCase())) {
      finalContent = `\`\`\`${language.toLowerCase()}\n${suggestedText}\n\`\`\``;
    }
    setContent(prev => prev + (prev.endsWith("\n") || prev === "" ? "" : "\n") + finalContent);
    setEditorMode("view");
    logActivity("edit", "Appended content to notebook via AI assistant suggestion and toggled view mode");
    triggerToast("Appended AI suggested code/text and switched to View!", "success");
  };

  const handleInsertAtCursor = (suggestedText: string, language?: string) => {
    let finalContent = suggestedText;
    if (language && ["html", "jsx", "css", "js", "javascript", "typescript", "markdown", "md"].includes(language.toLowerCase())) {
      finalContent = `\`\`\`${language.toLowerCase()}\n${suggestedText}\n\`\`\``;
    }
    insertTextAtCursor(finalContent);
    setEditorMode("view");
    logActivity("edit", "Inserted content at cursor via AI assistant suggestion and toggled view mode");
    triggerToast("Inserted AI suggested code/text and switched to View!", "success");
  };

  const triggerToast = (message: string, type: "info" | "success" | "error" = "info") => {
    const id = "toast_" + Date.now();
    setToasts(prev => [
      ...prev,
      {
        id,
        message,
        type,
        userName: "System",
        timestamp: Date.now()
      }
    ]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const closeInsertModal = () => {
    setIsInsertOpen(false);
    setInsertStep("menu");
    setActiveForm(null);
    setInputUrl("");
    setInputTitle("");
    setSavedSelection(null);
  };

  const updateColorFromHex = (hexStr: string) => {
    let cleanHex = hexStr.trim();
    if (cleanHex && !cleanHex.startsWith("#")) {
      cleanHex = "#" + cleanHex;
    }
    if (/^#[0-9a-fA-F]{3}$/.test(cleanHex) || /^#[0-9a-fA-F]{6}$/.test(cleanHex)) {
      const rgb = hexToRgb(cleanHex);
      if (rgb) {
        const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
        setSelectedColor({
          hex: cleanHex,
          r: rgb[0],
          g: rgb[1],
          b: rgb[2],
          h: hsl[0],
          s: hsl[1],
          l: hsl[2]
        });
      }
    } else {
      setSelectedColor(prev => ({ ...prev, hex: hexStr }));
    }
  };

  const updateColorFromRgb = (r: number, g: number, b: number) => {
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    setSelectedColor({ hex, r, g, b, h: hsl[0], s: hsl[1], l: hsl[2] });
  };

  const updateColorFromHsl = (h: number, s: number, l: number) => {
    const rgb = hslToRgb(h, s, l);
    const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
    setSelectedColor({ hex, r: rgb[0], g: rgb[1], b: rgb[2], h, s, l });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let formattedText = "";
    switch (activeForm) {
      case "url": {
        let cleanUrl = inputUrl.trim();
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://") && !cleanUrl.startsWith("//")) {
          cleanUrl = "https://" + cleanUrl;
        }
        formattedText = `[${inputTitle || "Link"}](${cleanUrl})`;
        break;
      }
      case "uri": {
        formattedText = `[${inputTitle || "Action"}](${inputUrl.trim()})`;
        break;
      }
      case "website": {
        let cleanUrl = inputUrl.trim();
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://") && !cleanUrl.startsWith("//")) {
          cleanUrl = "https://" + cleanUrl;
        }
        formattedText = `[${inputTitle || "Website"}](${cleanUrl})`;
        break;
      }
      case "photo": {
        formattedText = `![${inputTitle || "Photo"}](${inputUrl.trim()})`;
        break;
      }
      case "video": {
        formattedText = `<video src="${inputUrl.trim()}" controls width="100%">${inputTitle || "Video"}</video>`;
        break;
      }
      default:
        break;
    }

    insertTextAtCursor(formattedText);
    closeInsertModal();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isAssistantOpen) {
      scrollToBottom();
    }
  }, [chatHistory, isAssistantOpen]);

  const handleSendMessage = async (e?: React.FormEvent, directMessage?: string) => {
    if (e) e.preventDefault();
    const messageToSend = directMessage || chatInput.trim();
    if (!messageToSend.trim() || isTyping) return;

    const userMessage = messageToSend.trim();
    setChatInput("");
    
    setChatHistory(prev => [...prev, { role: "user", text: userMessage }]);
    setIsTyping(true);
    
    logActivity("chat", `Sent message: "${userMessage.slice(0, 50)}${userMessage.length > 50 ? '...' : ''}"`);

    try {
      const historyForApi = chatHistory.map(msg => ({
        role: msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.text }]
      }));

      const idToken = await auth.currentUser?.getIdToken() || "";

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: userMessage,
          history: historyForApi,
          context: content,
          drawingsCount: Object.keys(drawings).length
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || "Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) throw new Error("No reader");

      let aiResponseText = "";
      setChatHistory(prev => [...prev, { role: "model", text: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                aiResponseText += data.text;
                setChatHistory(prev => {
                  const newHistory = [...prev];
                  newHistory[newHistory.length - 1] = { role: "model", text: aiResponseText };
                  return newHistory;
                });
              }
            } catch (err) {
              console.warn("Error parsing stream chunk:", err);
            }
          }
        }
      }
    } catch (error: any) {
      console.warn("Chat error:", error);
      let userFriendlyMsg = error.message || String(error);
      if (
        userFriendlyMsg.includes("prepayment credits") ||
        userFriendlyMsg.includes("RESOURCE_EXHAUSTED") ||
        userFriendlyMsg.includes("429") ||
        userFriendlyMsg.includes("depleted")
      ) {
        userFriendlyMsg = "⚠️ **Service Alert:** The Gemini AI companion is temporarily unavailable due to depleted API credits or rate limits. Please try again later or contact the notebook owner.";
      } else {
        userFriendlyMsg = "Error Details: " + userFriendlyMsg;
      }
      setChatHistory(prev => [...prev, { role: "model", text: userFriendlyMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  if (viewMode === "cover") {
    return (
      <div 
        className={`min-h-[100dvh] ${theme === "dark" ? "bg-[#121212] text-zinc-100" : "bg-zinc-50 text-black"} flex items-center justify-center p-6 cursor-pointer font-serif transition-colors duration-300`}
        onClick={() => setViewMode("intro")}
      >
        {/* The Notebook Cover */}
        <div className={`w-full max-w-sm aspect-[3/4] ${theme === "dark" ? "bg-zinc-900 border-zinc-850 shadow-2xl" : "bg-white border-black/5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)]"} border relative group transition-transform duration-700 hover:-translate-y-2 flex items-center justify-center`}>
          
          {/* Subtle spine texture line */}
          <div className={`absolute left-0 top-0 bottom-0 w-8 border-r ${theme === "dark" ? "border-zinc-800 bg-gradient-to-r from-black/40 to-transparent" : "border-black/5 bg-gradient-to-r from-black/5 to-transparent"}`} />
          
          <div className={`border ${theme === "dark" ? "border-zinc-850 bg-zinc-900 group-hover:border-zinc-750" : "border-black/20 bg-white group-hover:border-black/40"} p-8 sm:p-12 text-center transition-all duration-700 flex flex-col items-center`}>
            <LogoIcon className="w-16 h-16 mb-6 opacity-85 transition-transform duration-700 group-hover:scale-105" theme={theme} useOriginalColors={true} />
            <h1 className={`text-3xl tracking-[0.3em] uppercase ${theme === "dark" ? "text-zinc-100" : "text-black"} font-light mb-6`}>Draft</h1>
            <div className={`w-12 h-px ${theme === "dark" ? "bg-zinc-700 group-hover:bg-zinc-550" : "bg-black/20 group-hover:bg-black/40"} mx-auto mb-6 transition-all duration-700 group-hover:w-16`} />
            <p className={`text-[10px] tracking-[0.3em] uppercase ${theme === "dark" ? "text-zinc-500 group-hover:text-zinc-400" : "text-black/40 group-hover:text-black/60"} transition-colors duration-700`}>
              Open Volume
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "intro") {
    return (
      <div className={`min-h-[100dvh] ${theme === "dark" ? "bg-[#121212] text-zinc-100" : "bg-white text-black"} flex items-center justify-center p-6 font-serif transition-colors duration-300`}>
        <div className="w-full max-w-xl flex flex-col space-y-12 items-center animate-fade-in">
          <LogoIcon className="w-16 h-16 opacity-85 hover:scale-105 transition-transform duration-500" theme={theme} useOriginalColors={true} />
          
          {/* Owner Engraving */}
          <div className="space-y-4 text-center w-full">
            <h2 className={`text-xs tracking-[0.3em] uppercase ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>This volume belongs to</h2>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Name"
              className={`w-full bg-transparent text-center text-4xl sm:text-5xl font-light tracking-tight outline-none border-b transition-colors pb-4 placeholder:opacity-30 ${theme === "dark" ? "text-zinc-100 border-zinc-850 focus:border-zinc-700 placeholder:text-zinc-700" : "text-black border-black/10 focus:border-black/30 placeholder:text-black/10"}`}
              autoFocus
            />
          </div>

          {/* Intro Description */}
          <div className={`space-y-8 text-center ${theme === "dark" ? "text-zinc-400" : "text-black/60"} max-w-sm mx-auto`}>
            <p className="leading-relaxed">
              A durable canvas for unstructured thoughts, drafted in peace. Work is preserved automatically.
            </p>
            
            {loading ? null : !user ? (
              <div className="space-y-4">
                <p className={`text-xs uppercase tracking-widest ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>Optional Cloud Sync</p>
                <button 
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className={`text-xs uppercase tracking-[0.2em] px-4 py-2 border transition-colors ${theme === "dark" ? "border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-white/5" : "border-black/10 hover:border-black/50 hover:bg-black/5 text-black"} ${isSigningIn ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isSigningIn ? "Signing in..." : "Sign in with Google"}
                </button>
                {window.self !== window.top && (
                  <div className="mt-4 p-4 border border-amber-500/20 bg-amber-500/5 rounded-sm max-w-xs mx-auto space-y-2">
                    <p className={`text-[10px] uppercase tracking-wider ${theme === "dark" ? "text-amber-400" : "text-amber-700"} font-sans font-semibold`}>
                      Mobile & Tablet Users
                    </p>
                    <p className={`text-[10px] ${theme === "dark" ? "text-zinc-500" : "text-black/40"} leading-relaxed font-sans`}>
                      Sign-in popups are blocked inside iframes by iOS and Android security. Open in its own tab to sign in seamlessly:
                    </p>
                    <a 
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-block text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 border transition-colors font-sans font-medium ${theme === "dark" ? "border-amber-900/40 text-amber-400 hover:bg-amber-400/10" : "border-amber-500/30 text-amber-700 hover:bg-amber-500/10"}`}
                    >
                      Open Notebook in New Tab
                    </a>
                  </div>
                )}
                <span className="hidden"></span>
                {authError && (
                  <p className="text-xs text-red-500 max-w-[250px] mx-auto mt-2">
                    {authError}
                  </p>
                )}
                {accessDenied && (
                  <p className="text-xs text-red-500 max-w-[250px] mx-auto mt-2 font-mono">
                    ACCESS DENIED. Your ID is not in the Librarian's whitelist.
                  </p>
                )}
              </div>
            ) : !accessChecked ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin opacity-50" />
                <p className="text-[10px] uppercase tracking-widest opacity-50">Librarian checking credentials...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-green-700 dark:text-green-500 uppercase tracking-widest">
                  ✓ Syncing to Cloud
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSignOut}
                    className={`text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-colors ${theme === "dark" ? "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200" : "border-black/10 text-black/50 hover:border-black/30 hover:text-black"}`}
                  >
                    Sign Out
                  </button>
                  {user?.email === "isaiah9238@gmail.com" && (
                    <button 
                      onClick={() => setViewMode("dashboard")}
                      className={`text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-colors ${theme === "dark" ? "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 bg-zinc-800" : "border-black/10 text-black/50 hover:border-black/30 hover:text-black bg-black/5"}`}
                    >
                      Vault Logs
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className={`w-12 h-px ${theme === "dark" ? "bg-zinc-800" : "bg-black/10"} mx-auto`} />
            <p className="leading-relaxed text-sm">
              Press <strong>Begin</strong> below to open the drafting area. You may return to the cover at any time by selecting "Draft" in the header.
            </p>
          </div>

          {/* Begin Button */}
          <div className="flex justify-center pt-8">
            <button
              onClick={() => setViewMode("editor")}
              className={`text-xs uppercase tracking-[0.3em] px-8 py-4 border transition-all duration-300 ${theme === "dark" ? "border-zinc-850 hover:border-zinc-650 hover:bg-white/5 text-zinc-300" : "border-black/10 hover:border-black/50 hover:bg-black/5 text-black"}`}
            >
              Begin
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "dashboard") {
    return <DashboardView theme={theme} setViewMode={setViewMode} />;
  }

  return (
    <div className={`min-h-[100dvh] ${theme === "dark" ? "bg-[#121212] text-zinc-100" : "bg-white text-black"} font-serif px-6 sm:px-12 pb-6 sm:pb-12 flex flex-col items-center transition-colors duration-300`}>
      <div className={`w-full ${isLayoutStretched ? "max-w-7xl" : "max-w-3xl"} flex-1 flex flex-col relative transition-all duration-300`}>
        {/* Header */}
        <header className={`relative z-10 ${theme === "dark" ? "border-zinc-850" : "border-black/10"} pt-6 sm:pt-12 flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 pb-4 border-b-2`}>
          <div className="flex items-start gap-6">
            <button 
              onClick={() => setViewMode("cover")}
              className={`font-semibold tracking-tight uppercase text-sm hover:opacity-50 transition-opacity cursor-pointer flex items-center gap-2 mt-1.5 ${theme === "dark" ? "text-zinc-100 hover:text-zinc-300" : "text-black"}`}
            >
              <LogoIcon className="w-5 h-5 opacity-90" theme={theme} useOriginalColors={false} />
              <span>Draft</span>
            </button>
            
            {/* Minimalist Tab Switcher, Theme Toggle, and Layout Toggle STACKED */}
            <div className="flex flex-col gap-2.5 items-start">
              {/* Minimalist Tab Switcher */}
              <div className={`flex ${theme === "dark" ? "bg-zinc-900 border border-zinc-800" : "bg-zinc-100"} p-0.5 rounded-xs text-[11px] font-sans w-fit`}>
                <button
                  onClick={() => setEditorMode("write")}
                  className={`px-3 py-1 uppercase tracking-wider rounded-xs transition-all cursor-pointer relative before:content-[''] before:absolute before:inset-[-4px] ${
                    editorMode === "write"
                      ? (theme === "dark" ? "bg-zinc-800 text-zinc-100 font-semibold shadow-sm" : "bg-white text-black font-semibold shadow-xs")
                      : (theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-black/40 hover:text-black/60")
                  }`}
                >
                  Write
                </button>
                <button
                  onClick={() => setEditorMode("view")}
                  className={`px-3 py-1 uppercase tracking-wider rounded-xs transition-all cursor-pointer relative before:content-[''] before:absolute before:inset-[-4px] ${
                    editorMode === "view"
                      ? (theme === "dark" ? "bg-zinc-800 text-zinc-100 font-semibold shadow-sm" : "bg-white text-black font-semibold shadow-xs")
                      : (theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-black/40 hover:text-black/60")
                  }`}
                >
                  View
                </button>
              </div>

              {/* Minimalist Theme Toggle */}
              <div className={`flex ${theme === "dark" ? "bg-zinc-900 border border-zinc-850" : "bg-zinc-100"} p-0.5 rounded-xs text-[11px] font-sans w-fit`}>
                <button
                  onClick={() => setTheme("light")}
                  className={`px-3 py-1 rounded-xs transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider font-semibold relative before:content-[''] before:absolute before:inset-[-4px] ${
                    theme === "light"
                      ? "bg-white text-black shadow-xs"
                      : "text-black/40 hover:text-black/60"
                  }`}
                  title="Light Mode"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span className="text-[9px]">Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-3 py-1 rounded-xs transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider font-semibold relative before:content-[''] before:absolute before:inset-[-4px] ${
                    theme === "dark"
                      ? "bg-zinc-850 text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title="Dark Mode"
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span className="text-[9px]">Dark</span>
                </button>
              </div>

              {/* Minimalist Layout Width Toggle */}
              <div className={`flex ${theme === "dark" ? "bg-zinc-900 border border-zinc-850" : "bg-zinc-100"} p-0.5 rounded-xs text-[11px] font-sans w-fit`}>
                <button
                  onClick={toggleLayoutStretch}
                  className={`px-3 py-1 rounded-xs transition-all cursor-pointer flex items-center gap-1.5 relative before:content-[''] before:absolute before:inset-[-4px]`}
                  title={isLayoutStretched ? "Toggle Classic Cozy View" : "Toggle Full Stretch Canvas"}
                >
                  {isLayoutStretched ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-zinc-500" />
                      <span className={`text-[9px] uppercase tracking-wider font-semibold ${theme === "dark" ? "text-zinc-100" : "text-black"}`}>Cozy View</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-zinc-500" />
                      <span className={`text-[9px] uppercase tracking-wider font-semibold ${theme === "dark" ? "text-zinc-300" : "text-black/60"}`}>Stretch View</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-start mt-1.5">
            {/* Code Inspector Pro Button */}
            <button
              onClick={() => handleOpenInspector()}
              className={`flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] border px-3 py-1.5 cursor-pointer transition-all ${
                theme === "dark" 
                  ? "border-purple-800/60 hover:border-purple-600 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300" 
                  : "border-purple-200 hover:border-purple-400 bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold"
              }`}
              title="Open The Code Inspector Pro workspace"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
              <span>Inspector</span>
            </button>

            {/* Insert Button */}
            <button
              onClick={() => {
                const textarea = textareaRef.current;
                let selText = "";
                if (textarea) {
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  selText = textarea.value.substring(start, end);
                  setSavedSelection({ start, end, text: selText });
                } else {
                  setSavedSelection(null);
                }
                setInputTitle(selText);
                setEditorMode("write");
                setIsInsertOpen(true);
                setInsertStep("menu");
                setActiveForm(null);
              }}
              className={`flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] border px-3 py-1.5 cursor-pointer transition-all ${theme === "dark" ? "border-zinc-800 hover:border-zinc-650 bg-zinc-900 hover:bg-zinc-800 text-zinc-300" : "border-black/10 hover:border-black/50 bg-white hover:bg-black/5 text-black"}`}
              title="Insert canvas element, video or media"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Insert</span>
            </button>

            {/* Clear Button */}
            <button
              onClick={handleClear}
              className={`text-[10px] uppercase tracking-widest cursor-pointer px-3 py-1.5 border transition-all ${
                theme === "dark" 
                  ? "border-zinc-850 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-red-400" 
                  : "border-black/10 hover:border-black/30 bg-white text-black/50 hover:text-red-600"
              }`}
              title="Clear entire notebook"
            >
              Clear
            </button>

            {/* Export Dropdown Button */}
            <div className="relative no-print">
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className={`flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] border px-3 py-1.5 cursor-pointer transition-all ${
                  isExportOpen
                    ? (theme === "dark" ? "border-zinc-650 bg-zinc-850 text-zinc-100" : "border-black/50 bg-zinc-100 text-black")
                    : (theme === "dark" ? "border-zinc-850 hover:border-zinc-750 bg-zinc-900 hover:bg-zinc-850 text-zinc-300" : "border-black/10 hover:border-black/30 bg-white hover:bg-black/5 text-black")
                }`}
                title="Export or print notebook"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
              
              <AnimatePresence>
                {isExportOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsExportOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute right-0 mt-2 w-48 rounded-xs shadow-xl border p-2 z-50 font-sans ${
                        theme === "dark"
                          ? "bg-zinc-950 border-zinc-850 text-zinc-300"
                          : "bg-white border-black/15 text-black"
                      }`}
                    >
                      <button
                        onClick={() => {
                          setIsExportOpen(false);
                          handlePrint();
                        }}
                        className={`w-full text-left px-3 py-2 text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs transition-colors cursor-pointer ${
                          theme === "dark" ? "hover:bg-zinc-900 hover:text-zinc-100" : "hover:bg-zinc-50 hover:text-black"
                        }`}
                      >
                        <Printer className="w-3.5 h-3.5 opacity-70" />
                        Print / PDF
                      </button>
                      <button
                        onClick={() => {
                          setIsExportOpen(false);
                          handleExportMarkdown();
                        }}
                        className={`w-full text-left px-3 py-2 text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs transition-colors cursor-pointer ${
                          theme === "dark" ? "hover:bg-zinc-900 hover:text-zinc-100" : "hover:bg-zinc-50 hover:text-black"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 opacity-70" />
                        Markdown (.md)
                      </button>
                      <button
                        onClick={() => {
                          setIsExportOpen(false);
                          handleExportTxt();
                        }}
                        className={`w-full text-left px-3 py-2 text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs transition-colors cursor-pointer ${
                          theme === "dark" ? "hover:bg-zinc-900 hover:text-zinc-100" : "hover:bg-zinc-50 hover:text-black"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 opacity-70" />
                        Plain Text (.txt)
                      </button>
                      <button
                        onClick={() => {
                          setIsExportOpen(false);
                          handleCopyToClipboard();
                        }}
                        className={`w-full text-left px-3 py-2 text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs transition-colors cursor-pointer ${
                          theme === "dark" ? "hover:bg-zinc-900 hover:text-zinc-100" : "hover:bg-zinc-50 hover:text-black"
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5 opacity-70" />
                        Copy Raw Text
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Editor or Viewer Panel */}
        {editorMode === "write" ? (
          <div className="w-full flex-1 flex flex-col">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Begin..."
              className={`w-full resize-none outline-none bg-transparent placeholder:opacity-20 text-lg leading-relaxed focus:ring-0 min-h-[45vh] sm:min-h-[500px] overflow-hidden ${theme === "dark" ? "text-zinc-100 placeholder:text-zinc-700" : "text-black placeholder:text-black/20"}`}
              autoFocus
            />
            {/* Word Count on the page */}
            <div className={`mt-4 pt-4 border-t ${theme === "dark" ? "border-zinc-850 text-zinc-500" : "border-black/10 text-black/40"} text-xs uppercase tracking-widest font-sans self-end no-print`}>
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </div>
          </div>
        ) : (
          <div className="w-full flex-1 min-h-[45vh] sm:min-h-[500px] animate-fade-in pb-12 flex flex-col">
            {content.trim() ? (
              <>
                <div className={`prose max-w-full font-serif text-lg ${theme === "dark" ? "text-zinc-200" : "text-black/85"} flex-1`}>
                  {parseContentToJSX(content, drawings, ownerName, theme, handleOpenInspector)}
                </div>
                {/* Word Count on the page */}
                <div className={`mt-8 pt-4 border-t ${theme === "dark" ? "border-zinc-850 text-zinc-500" : "border-black/10 text-black/40"} text-xs uppercase tracking-widest font-sans self-end no-print`}>
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </div>
              </>
            ) : (
              <div className={`flex-1 flex flex-col items-center justify-center py-24 text-center font-sans border border-dashed rounded-xs ${theme === "dark" ? "text-zinc-600 border-zinc-850 bg-zinc-900/10" : "text-black/30 border-black/10"}`}>
                <p className="text-xs uppercase tracking-[0.2em] mb-2 font-semibold">Empty Notebook Draft</p>
                <p className="text-xs italic font-serif">Switch to "Write" mode to begin detailing your thoughts.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Assistant Button */}
      {!isAssistantOpen && (
        <button
          onClick={() => setIsAssistantOpen(true)}
          className={`fixed bottom-6 right-6 sm:bottom-12 sm:right-12 z-40 p-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center group ${theme === "dark" ? "bg-zinc-100 text-zinc-950" : "bg-black text-white"}`}
          aria-label="Open Assistant"
        >
          <Sparkles className={`w-5 h-5 ${theme === "dark" ? "text-zinc-950" : "text-white/90 group-hover:text-white"}`} />
        </button>
      )}

      {/* Elegant Assistant Drawer */}
      {isAssistantOpen && (
        <div className={`fixed top-0 right-0 h-[100dvh] w-full sm:w-96 ${theme === "dark" ? "bg-[#121212] border-zinc-850 text-zinc-100" : "bg-white border-black/10"} border-l shadow-2xl z-50 flex flex-col font-sans animate-fade-in transform transition-transform duration-300`}>
          <div className={`flex items-center justify-between p-6 border-b ${theme === "dark" ? "border-zinc-850 bg-zinc-900/40" : "border-black/5 bg-zinc-50"}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${theme === "dark" ? "bg-zinc-800 text-zinc-100" : "bg-black text-white"}`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-sm font-semibold tracking-widest uppercase ${theme === "dark" ? "text-zinc-200" : "text-black"}`}>Aetherial Guide</h3>
                <p className={`text-[10px] ${theme === "dark" ? "text-zinc-500" : "text-black/40"} tracking-wider uppercase`}>AI Assistant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsAssistantOpen(false)}
              className={`transition-colors ${theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-black/40 hover:text-black"}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${theme === "dark" ? "bg-[#121212]" : "bg-white"} flex flex-col`}>
            {chatHistory.length === 0 && (
              <div className={`flex-1 flex flex-col items-center justify-center text-center p-4 space-y-6 ${theme === "dark" ? "text-zinc-500" : "text-black/40"} opacity-95`}>
                <div className="flex flex-col items-center space-y-2">
                  <Sparkles className="w-8 h-8 opacity-40 animate-pulse text-amber-500" />
                  <p className="text-sm font-serif italic max-w-[200px]">How might I assist you with your thoughts today?</p>
                </div>
                <div className="w-full space-y-2 text-left">
                  <p className="text-[9px] uppercase tracking-wider font-semibold opacity-70 px-1">Quick Blueprints:</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAssistantOpen(false);
                      handleOpenInspector();
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded border transition-all cursor-pointer font-medium ${
                      theme === "dark" 
                        ? "bg-purple-950/40 border-purple-800/60 hover:border-purple-600 text-purple-300 hover:bg-purple-900/50" 
                        : "bg-purple-50 border-purple-200 hover:border-purple-300 text-purple-900 hover:bg-purple-100"
                    }`}
                  >
                    ⚡ Launch Code Inspector Pro
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage(undefined, "Suggest a custom interactive HTML widget I can insert into my blank notebook canvas.")}
                    className={`w-full text-left px-3 py-2 text-xs rounded border transition-all cursor-pointer relative before:content-[''] before:absolute before:inset-[-4px] ${
                      theme === "dark" 
                        ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-850" 
                        : "bg-zinc-50 border-black/5 hover:border-black/10 text-black/85 hover:bg-zinc-100"
                    }`}
                  >
                    🪄 Suggest interactive HTML layout
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage(undefined, "Generate some creative, structural ideas to design a custom workspace inside my digital notebook.")}
                    className={`w-full text-left px-3 py-2 text-xs rounded border transition-all cursor-pointer relative before:content-[''] before:absolute before:inset-[-4px] ${
                      theme === "dark" 
                        ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-850" 
                        : "bg-zinc-50 border-black/5 hover:border-black/10 text-black/85 hover:bg-zinc-100"
                    }`}
                  >
                    💡 Help me brainstorm creative notebook layouts
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage(undefined, "Could you audit the parent notebook structure and recommend code updates or improvements?")}
                    className={`w-full text-left px-3 py-2 text-xs rounded border transition-all cursor-pointer relative before:content-[''] before:absolute before:inset-[-4px] ${
                      theme === "dark" 
                        ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-850" 
                        : "bg-zinc-50 border-black/5 hover:border-black/10 text-black/85 hover:bg-zinc-100"
                    }`}
                  >
                    🔍 Request code updates & layout audit
                  </button>
                </div>
              </div>
            )}
            
            {chatHistory.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full animate-fade-in`}>
                  <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser 
                      ? (theme === "dark" ? "bg-zinc-850 text-zinc-100 rounded-br-none border border-zinc-750 font-serif" : "bg-black text-white rounded-br-none font-serif") 
                      : (theme === "dark" ? "bg-zinc-900 text-zinc-300 rounded-bl-none border border-zinc-850 w-full" : "bg-zinc-100 text-black/80 rounded-bl-none w-full")
                  }`}>
                    {isUser ? (
                      <span className="whitespace-pre-wrap">{msg.text}</span>
                    ) : (
                      <div className="space-y-3 font-sans">
                        {parseChatMessage(msg.text).map((part, pIdx) => {
                          if (part.type === "code") {
                            return (
                              <div key={pIdx} className={`my-3 rounded-md overflow-hidden border shadow-sm flex flex-col ${theme === "dark" ? "border-zinc-800 bg-[#1e1e24]" : "border-black/10 bg-[#1C1C1E]"}`}>
                                <div className={`text-[10px] px-3 py-1.5 uppercase tracking-widest font-mono border-b flex justify-between items-center ${theme === "dark" ? "bg-zinc-950 text-zinc-400 border-zinc-850" : "bg-zinc-950 text-white/50 border-white/5"}`}>
                                  <span>{part.language || "code"}</span>
                                  <span className="text-[9px] text-zinc-500 lowercase">ai suggestion</span>
                                </div>
                                <pre className="p-3 overflow-x-auto max-h-60 text-xs font-mono text-white/95 leading-relaxed bg-[#15151a]">
                                  <code>{part.content}</code>
                                </pre>
                                <div className={`p-2 border-t font-sans flex flex-wrap gap-1.5 items-center justify-end ${theme === "dark" ? "bg-zinc-950/60 border-zinc-850" : "bg-zinc-900 border-white/5"}`}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(part.content);
                                      triggerToast("Copied suggestion to clipboard!", "success");
                                    }}
                                    className="px-2 py-1 rounded-xs bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Copy Code Block"
                                  >
                                    <Copy className="w-3 h-3" />
                                    Copy
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleInsertAtCursor(part.content, part.language)}
                                    className="px-2 py-1 rounded-xs bg-zinc-800 hover:bg-zinc-750 text-[10px] text-zinc-300 flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Insert code at current text cursor"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Insert
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAppendToNotebook(part.content, part.language)}
                                    className="px-2 py-1 rounded-xs bg-zinc-800 hover:bg-zinc-750 text-[10px] text-zinc-300 flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Append code to end of notebook"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Append
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyToNotebook(part.content, part.language)}
                                    className="px-2.5 py-1 rounded-xs bg-amber-600 hover:bg-amber-500 text-[10px] text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                                    title="Overwrites the notebook with this suggestion"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    Replace Notebook
                                  </button>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div key={pIdx} className="whitespace-pre-wrap leading-relaxed font-serif text-[13.5px]">
                                {formatInlineText(part.content, theme)}
                              </div>
                            );
                          }
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className={`rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 ${theme === "dark" ? "bg-zinc-900 text-zinc-400 border border-zinc-850" : "bg-zinc-100 text-black/50"}`}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs tracking-widest uppercase">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={`p-4 border-t ${theme === "dark" ? "bg-zinc-900/40 border-zinc-850" : "bg-zinc-50 border-black/5"}`}>
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask for guidance..."
                className={`w-full rounded-full pl-5 pr-12 py-3 text-sm outline-none font-serif ${theme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-100 focus:border-zinc-700 placeholder:text-zinc-650" : "bg-white border-black/10 text-black focus:border-black/30 placeholder:text-black/30"}`}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isTyping}
                className={`absolute right-2 p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${theme === "dark" ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-750" : "bg-black text-white hover:bg-black/80"}`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Elegant Minimalist Insert Drawer / Overlay */}
      {isInsertOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`w-full max-w-md border shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 relative font-sans transition-colors duration-300 ${theme === "dark" ? "bg-zinc-900 border-zinc-850 text-zinc-100" : "bg-white border-black/10 text-black"}`}>
            <button 
              onClick={closeInsertModal}
              className={`absolute right-4 top-4 transition-colors cursor-pointer ${theme === "dark" ? "text-zinc-500 hover:text-zinc-350" : "text-black/40 hover:text-black"}`}
            >
              <X className="w-4 h-4" />
            </button>

            {insertStep === "menu" && (
              <div className="space-y-4">
                <h3 className={`text-sm font-semibold tracking-[0.2em] uppercase mb-2 ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>Insert</h3>
                <div className={`divide-y ${theme === "dark" ? "divide-zinc-800" : "divide-black/5"}`}>
                  <button 
                    onClick={() => setInsertStep("link_options")}
                    className={`w-full text-left py-3.5 flex items-center justify-between transition-colors uppercase text-xs tracking-widest ${theme === "dark" ? "hover:text-zinc-300" : "hover:text-black/60"}`}
                  >
                    <span className="flex items-center gap-3">
                      <Link className={`w-3.5 h-3.5 ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`} />
                      Link
                    </span>
                    <ChevronRight className={`w-4 h-4 ${theme === "dark" ? "text-zinc-600" : "text-black/30"}`} />
                  </button>
                  
                  <button 
                    onClick={() => {
                      setActiveForm("photo");
                      setInsertStep("form");
                    }}
                    className={`w-full text-left py-3.5 flex items-center justify-between transition-colors uppercase text-xs tracking-widest ${theme === "dark" ? "hover:text-zinc-300" : "hover:text-black/60"}`}
                  >
                    <span className="flex items-center gap-3">
                      <Image className={`w-3.5 h-3.5 ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`} />
                      Photo
                    </span>
                    <ChevronRight className={`w-4 h-4 ${theme === "dark" ? "text-zinc-600" : "text-black/30"}`} />
                  </button>

                  <button 
                    onClick={() => {
                      setActiveForm("video");
                      setInsertStep("form");
                    }}
                    className={`w-full text-left py-3.5 flex items-center justify-between transition-colors uppercase text-xs tracking-widest cursor-pointer ${theme === "dark" ? "hover:text-zinc-300" : "hover:text-black/60"}`}
                  >
                    <span className="flex items-center gap-3">
                      <Video className={`w-3.5 h-3.5 ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`} />
                      Video
                    </span>
                    <ChevronRight className={`w-4 h-4 ${theme === "dark" ? "text-zinc-600" : "text-black/30"}`} />
                  </button>

                  <button 
                    onClick={() => {
                      setActiveForm("color");
                      setInsertStep("form");
                    }}
                    className={`w-full text-left py-3.5 flex items-center justify-between transition-colors uppercase text-xs tracking-widest cursor-pointer ${theme === "dark" ? "hover:text-zinc-300" : "hover:text-black/60"}`}
                  >
                    <span className="flex items-center gap-3">
                      <Palette className={`w-3.5 h-3.5 ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`} />
                      Color & Swatch
                    </span>
                    <ChevronRight className={`w-4 h-4 ${theme === "dark" ? "text-zinc-600" : "text-black/30"}`} />
                  </button>

                  <button 
                    onClick={() => {
                      setActiveForm("drawing");
                      setInsertStep("form");
                    }}
                    className={`w-full text-left py-3.5 flex items-center justify-between transition-colors uppercase text-xs tracking-widest cursor-pointer ${theme === "dark" ? "hover:text-zinc-300" : "hover:text-black/60"}`}
                  >
                    <span className="flex items-center gap-3">
                      <Brush className={`w-3.5 h-3.5 ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`} />
                      Sketch Drawing Pad
                    </span>
                    <ChevronRight className={`w-4 h-4 ${theme === "dark" ? "text-zinc-600" : "text-black/30"}`} />
                  </button>

                  <button 
                    onClick={() => {
                      insertTextAtCursor(CODE_INSPECTOR_SECTION_MD);
                      closeInsertModal();
                    }}
                    className={`w-full text-left py-3.5 flex items-center justify-between transition-colors uppercase text-xs tracking-widest cursor-pointer ${theme === "dark" ? "hover:text-zinc-300" : "hover:text-black/60"}`}
                  >
                    <span className="flex items-center gap-3">
                      <Sparkles className={`w-3.5 h-3.5 ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`} />
                      The Code Inspector Pro
                    </span>
                    <ChevronRight className={`w-4 h-4 ${theme === "dark" ? "text-zinc-600" : "text-black/30"}`} />
                  </button>
                </div>
              </div>
            )}

            {insertStep === "link_options" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <button 
                    onClick={() => setInsertStep("menu")}
                    className={`transition-colors ${theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-black/40 hover:text-black"}`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className={`text-sm font-semibold tracking-[0.2em] uppercase mb-2 ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>Link Type</h3>
                </div>
                
                <div className={`divide-y ${theme === "dark" ? "divide-zinc-800" : "divide-black/5"}`}>
                  <button 
                    onClick={() => {
                      setActiveForm("url");
                      setInsertStep("form");
                    }}
                    className={`w-full text-left py-3.5 flex flex-col justify-center transition-colors ${theme === "dark" ? "hover:text-zinc-350" : "hover:text-black/60"}`}
                  >
                    <span className="text-xs uppercase tracking-widest font-semibold">Web URL</span>
                    <span className={`text-[10px] tracking-normal mt-0.5 font-serif italic ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>Insert a standard web link</span>
                  </button>

                  <button 
                    onClick={() => {
                      setActiveForm("uri");
                      setInsertStep("form");
                    }}
                    className={`w-full text-left py-3.5 flex flex-col justify-center transition-colors ${theme === "dark" ? "hover:text-zinc-350" : "hover:text-black/60"}`}
                  >
                    <span className="text-xs uppercase tracking-widest font-semibold">Custom URI</span>
                    <span className={`text-[10px] tracking-normal mt-0.5 font-serif italic ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>Insert custom scheme protocols (e.g. mailto:, tel:)</span>
                  </button>

                  <button 
                    onClick={() => {
                      setActiveForm("website");
                      setInsertStep("form");
                    }}
                    className={`w-full text-left py-3.5 flex flex-col justify-center transition-colors ${theme === "dark" ? "hover:text-zinc-350" : "hover:text-black/60"}`}
                  >
                    <span className="text-xs uppercase tracking-widest font-semibold">Website</span>
                    <span className={`text-[10px] tracking-normal mt-0.5 font-serif italic ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>Insert a domain website reference</span>
                  </button>
                </div>
              </div>
            )}

            {insertStep === "form" && activeForm === "color" && (
              <div className="space-y-4 animate-fade-in font-sans">
                {/* Back / Title */}
                <div className="flex items-center gap-2 mb-2">
                  <button 
                    type="button"
                    onClick={() => setInsertStep("menu")}
                    className={`transition-colors cursor-pointer ${theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-black/40 hover:text-black"}`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className={`text-xs font-semibold tracking-[0.2em] uppercase ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>Color Design Swatch</h3>
                </div>

                {/* Main Color Preview */}
                <div className={`flex items-center gap-4 p-4 border rounded-xs ${theme === "dark" ? "border-zinc-800 bg-zinc-950" : "border-black/5 bg-zinc-50"}`}>
                  <div 
                    className={`w-16 h-16 rounded-xs border shadow-inner shrink-0 ${theme === "dark" ? "border-zinc-800" : "border-black/15"}`} 
                    style={{ backgroundColor: selectedColor.hex }}
                  />
                  <div className={`space-y-1 font-mono text-[10px] leading-tight ${theme === "dark" ? "text-zinc-500" : "text-black/50"}`}>
                    <p className={`font-semibold text-xs uppercase ${theme === "dark" ? "text-zinc-200" : "text-black"}`}>{selectedColor.hex}</p>
                    <p>RGB: {selectedColor.r}, {selectedColor.g}, {selectedColor.b}</p>
                    <p>HSL: {selectedColor.h}°, {selectedColor.s}%, {selectedColor.l}%</p>
                  </div>
                </div>

                {/* SECTION C: SPECTRUM ON A LINE */}
                <div>
                  <label className={`block text-[10px] uppercase tracking-[0.15em] mb-1.5 font-semibold ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>
                    c. Color Spectrum Band
                  </label>
                  <div 
                    className="relative w-full h-6 rounded-xs cursor-pointer border border-black/10 select-none bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-cyan-500 via-blue-500 via-magenta-500 to-red-500 touch-none"
                    onMouseDown={(e) => {
                      const handleMove = (ev: MouseEvent) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = Math.max(0, Math.min(ev.clientX - rect.left, rect.width));
                        updateColorFromHsl(Math.round((x / rect.width) * 360), selectedColor.s, selectedColor.l);
                      };
                      const handleUp = () => {
                        window.removeEventListener("mousemove", handleMove);
                        window.removeEventListener("mouseup", handleUp);
                      };
                      window.addEventListener("mousemove", handleMove);
                      window.addEventListener("mouseup", handleUp);
                      // Trigger initial click position
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                      updateColorFromHsl(Math.round((x / rect.width) * 360), selectedColor.s, selectedColor.l);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const touch = e.touches[0];
                      const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
                      updateColorFromHsl(Math.round((x / rect.width) * 360), selectedColor.s, selectedColor.l);
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const touch = e.touches[0];
                      const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
                      updateColorFromHsl(Math.round((x / rect.width) * 360), selectedColor.s, selectedColor.l);
                    }}
                  >
                    {/* Sliding handle */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white border border-black shadow-xs -ml-0.5 pointer-events-none"
                      style={{ left: `${(selectedColor.h / 360) * 100}%` }}
                    />
                  </div>
                </div>

                {/* SECTION A: HEX VALUE CONTROL */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.15em] text-black/40 mb-1 font-semibold">
                      a. Hex Color
                    </label>
                    <input 
                      type="text"
                      value={selectedColor.hex}
                      onChange={(e) => updateColorFromHex(e.target.value)}
                      placeholder="#ff5733"
                      className={`w-full border px-2 py-1.5 font-mono text-xs uppercase outline-none transition-colors ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-zinc-500" : "bg-white border-black/10 text-black focus:border-black/30"}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] uppercase tracking-[0.15em] mb-1 font-semibold ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>
                      Quick Swatches
                    </label>
                    <div className="flex gap-2 flex-wrap items-center">
                      {["#FF3B30", "#34C759", "#007AFF", "#FFCC00", "#AF52DE", "#FF9500", "#1C1C1E"].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => updateColorFromHex(p)}
                          className={`w-6 h-6 rounded-xs border shadow-xs cursor-pointer hover:scale-110 active:scale-95 transition-transform relative before:content-[''] before:absolute before:inset-[-4px] ${theme === "dark" ? "border-zinc-750" : "border-black/15"}`}
                          style={{ backgroundColor: p }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECTION B: RGB & HSL CONTROLS (The other one) */}
                <div className={`space-y-2 border-t pt-3 ${theme === "dark" ? "border-zinc-800" : "border-black/5"}`}>
                  <span className={`block text-[10px] uppercase tracking-[0.15em] font-semibold mb-1 ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>
                    b. RGB & HSL Sliders
                  </span>
                  
                  {/* HSL Saturation & Lightness - with colorful gradients! */}
                  <div className="space-y-1 text-xs">
                    <div className={`flex justify-between font-mono text-[9px] ${theme === "dark" ? "text-zinc-500" : "text-black/45"}`}>
                      <span>Saturation: {selectedColor.s}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={selectedColor.s}
                      onChange={(e) => updateColorFromHsl(selectedColor.h, parseInt(e.target.value), selectedColor.l)}
                      className={`w-full h-1 rounded-sm cursor-pointer ${theme === "dark" ? "bg-zinc-800 accent-zinc-200" : "bg-zinc-100 accent-black"}`}
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className={`flex justify-between font-mono text-[9px] ${theme === "dark" ? "text-zinc-500" : "text-black/45"}`}>
                      <span>Lightness: {selectedColor.l}%</span>
                    </div>
                    <input 
                      type="range"
                      min="10"
                      max="90" 
                      value={selectedColor.l}
                      onChange={(e) => updateColorFromHsl(selectedColor.h, selectedColor.s, parseInt(e.target.value))}
                      className={`w-full h-1 rounded-sm cursor-pointer ${theme === "dark" ? "bg-zinc-800 accent-zinc-200" : "bg-zinc-100 accent-black"}`}
                    />
                  </div>

                  {/* Red/Green/Blue Sliders */}
                  <div className={`grid grid-cols-3 gap-2 text-xs pt-1 border-t border-dashed ${theme === "dark" ? "border-zinc-800" : "border-black/5"}`}>
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] text-red-500 font-semibold uppercase">R: {selectedColor.r}</span>
                      <input 
                        type="range"
                        min="0"
                        max="255"
                        value={selectedColor.r}
                        onChange={(e) => updateColorFromRgb(parseInt(e.target.value), selectedColor.g, selectedColor.b)}
                        className={`w-full h-1 rounded-sm cursor-pointer ${theme === "dark" ? "bg-zinc-800 accent-red-500" : "bg-zinc-100 accent-red-500"}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] text-green-600 font-semibold uppercase">G: {selectedColor.g}</span>
                      <input 
                        type="range"
                        min="0"
                        max="255"
                        value={selectedColor.g}
                        onChange={(e) => updateColorFromRgb(selectedColor.r, parseInt(e.target.value), selectedColor.b)}
                        className={`w-full h-1 rounded-sm cursor-pointer ${theme === "dark" ? "bg-zinc-800 accent-green-600" : "bg-zinc-100 accent-green-600"}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] text-blue-600 font-semibold uppercase">B: {selectedColor.b}</span>
                      <input 
                        type="range"
                        min="0"
                        max="255"
                        value={selectedColor.b}
                        onChange={(e) => updateColorFromRgb(selectedColor.r, selectedColor.g, parseInt(e.target.value))}
                        className={`w-full h-1 rounded-sm cursor-pointer ${theme === "dark" ? "bg-zinc-800 accent-blue-650" : "bg-zinc-100 accent-blue-600"}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Submission Options */}
                <div className={`space-y-2 pt-3 border-t ${theme === "dark" ? "border-zinc-800" : "border-black/10"}`}>
                  <p className={`text-[10px] uppercase tracking-widest font-semibold text-center mb-1 ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>
                    Select Insertion Format
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const txt = (savedSelection && savedSelection.text) || "colored text";
                        insertTextAtCursor(`[${txt}](color:${selectedColor.hex})`);
                        closeInsertModal();
                      }}
                      className={`border transition-colors duration-150 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xs cursor-pointer ${theme === "dark" ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 text-zinc-300" : "border-black hover:bg-black hover:text-white text-black"}`}
                    >
                      Apply Text Color
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const txt = (savedSelection && savedSelection.text) || "highlighted text";
                        insertTextAtCursor(`[${txt}](bg:${selectedColor.hex})`);
                        closeInsertModal();
                      }}
                      className={`border transition-colors duration-150 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xs cursor-pointer ${theme === "dark" ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 text-zinc-300" : "border-black hover:bg-black hover:text-white text-black"}`}
                    >
                      Apply Highlight
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      insertTextAtCursor(`\n[swatch: ${selectedColor.hex}]\n`);
                      closeInsertModal();
                    }}
                    className={`w-full hover:opacity-90 transition-opacity py-3 text-[10px] font-extrabold uppercase tracking-widest rounded-xs cursor-pointer flex items-center justify-center gap-1.5 ${theme === "dark" ? "bg-zinc-100 text-zinc-950 hover:bg-white" : "bg-black text-white"}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Embed Pantone Swatch block
                  </button>
                </div>
              </div>
            )}

            {insertStep === "form" && activeForm === "drawing" && (
              <DrawingPad 
                initialColor={selectedColor.hex}
                theme={theme}
                onBack={() => setInsertStep("menu")}
                onInsert={(dataUrl) => {
                  const sketchId = "sketch_" + Date.now();
                  setDrawings((prev) => ({
                    ...prev,
                    [sketchId]: dataUrl
                  }));
                  insertTextAtCursor(`\n[sketch: ${sketchId}]\n`);
                  closeInsertModal();
                }}
              />
            )}

            {insertStep === "form" && activeForm && activeForm !== "color" && activeForm !== "drawing" && (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <button 
                    type="button"
                    onClick={() => {
                      if (["url", "uri", "website"].includes(activeForm)) {
                        setInsertStep("link_options");
                      } else {
                        setInsertStep("menu");
                      }
                    }}
                    className={`transition-colors cursor-pointer ${theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-black/40 hover:text-black"}`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className={`text-sm font-semibold tracking-[0.2em] uppercase ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>
                    {activeForm === "url" && "Insert Web URL"}
                    {activeForm === "uri" && "Insert Custom URI"}
                    {activeForm === "website" && "Insert Website"}
                    {activeForm === "photo" && "Insert Photo"}
                    {activeForm === "video" && "Insert Video"}
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className={`block text-[10px] uppercase tracking-widest mb-1 font-medium ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>
                      {activeForm === "url" && "Link Text / Title"}
                      {activeForm === "uri" && "Link Action / Value"}
                      {activeForm === "website" && "Website Name"}
                      {activeForm === "photo" && "Photo Description (Alt text)"}
                      {activeForm === "video" && "Video Title / Caption"}
                    </label>
                    <input 
                      type="text"
                      required
                      value={inputTitle}
                      onChange={(e) => setInputTitle(e.target.value)}
                      placeholder={
                        activeForm === "url" ? "Read the documentation" :
                        activeForm === "uri" ? "Call Customer Service" :
                        activeForm === "website" ? "Bloomberg" :
                        activeForm === "photo" ? "Calm lake in morning mist" : "Interactive Prototype Tutorial"
                      }
                      className={`w-full border px-3 py-2 text-sm outline-none transition-colors ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-zinc-550 placeholder:text-zinc-650" : "bg-white border-black/10 text-black focus:border-black/30 placeholder:text-black/20"}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] uppercase tracking-widest mb-1 font-medium ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>
                      {activeForm === "url" && "URL Link (e.g. https://domain.com)"}
                      {activeForm === "uri" && "Custom Protocol URI (e.g. tel:+1234, mailto:)"}
                      {activeForm === "website" && "Domain Site (e.g. www.google.com)"}
                      {activeForm === "photo" && "Photo Image Address (URL)"}
                      {activeForm === "video" && "Video Source Address (URL)"}
                    </label>
                    <input 
                      type="text"
                      required
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder={
                        activeForm === "url" ? "https://example.com" :
                        activeForm === "uri" ? "mailto:support@domain.com" :
                        activeForm === "website" ? "google.com" :
                        activeForm === "photo" ? "https://images.unsplash.com/photo-1542281286-9e0a16bb7366" : "https://www.w3schools.com/html/mov_bbb.mp4"
                      }
                      className={`w-full border px-3 py-2 text-sm outline-none transition-colors ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-zinc-550 placeholder:text-zinc-650" : "bg-white border-black/10 text-black focus:border-black/30 placeholder:text-black/20"}`}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className={`w-full text-xs uppercase tracking-[0.2em] py-3 transition-colors mt-4 ${theme === "dark" ? "bg-zinc-100 text-zinc-950 hover:bg-white font-semibold" : "bg-black text-white hover:bg-black/90"}`}
                >
                  Insert Content
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Real-time Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none w-full max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`pointer-events-auto w-full p-4 rounded-lg shadow-xl border flex items-start gap-3 backdrop-blur-md ${
                theme === "dark"
                  ? "bg-zinc-950/90 border-zinc-800 text-zinc-100"
                  : "bg-white/90 border-black/10 text-black"
              }`}
            >
              <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-500 shrink-0 animate-pulse">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-1 font-sans">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs tracking-wide uppercase text-emerald-500">
                    Live Session
                  </span>
                  <span className="text-[9px] opacity-40 font-mono">
                    {formatRelativeTime(toast.timestamp)}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90 font-medium">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-inherit opacity-40 hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Hidden print-only layout that contains the fully formatted document */}
      <div id="notebook-print-area" className="hidden print:block print:w-full font-serif text-lg text-black bg-white p-8">
        {ownerName && (
          <div className="mb-8 border-b pb-4 text-center">
            <h1 className="text-2xl font-bold uppercase tracking-widest text-black">{ownerName}'s Notebook</h1>
            <p className="text-xs text-gray-500 font-sans mt-1">
              Printed on {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        )}
        <div className="prose max-w-full font-serif text-lg text-black">
          {parseContentToJSX(content, drawings, ownerName, "light", handleOpenInspector)}
        </div>
      </div>

      {/* Code Inspector Pro Modal Component */}
      <CodeInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        theme={theme}
        initialCode={inspectorCode}
        initialLanguage={inspectorLang}
      />
    </div>
  );
}

// Custom parser to format active links, inline photos, video embeds, Pantone swatches, and Sketch drawings in the View tab
function parseContentToJSX(text: string, drawings: Record<string, string> = {}, ownerName: string = "", theme: "light" | "dark" = "light", onOpenInspector?: (code: string, lang: string) => void) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  
  let pBuffer: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLanguage = "";
  
  const flushParagraph = (key: number) => {
    if (pBuffer.length > 0) {
      elements.push(
        <p key={`p-${key}`} className={`text-lg leading-relaxed font-serif mb-6 break-words whitespace-pre-line ${theme === "dark" ? "text-zinc-300" : "text-black/80"}`}>
          {renderInlineContent(pBuffer.join("\n"), theme)}
        </p>
      );
      pBuffer = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    if (inCodeBlock) {
      if (trimmed.startsWith("```")) {
        inCodeBlock = false;
        elements.push(
          <div key={`code-${idx}`} className={`my-8 rounded-xs overflow-hidden border shadow-sm flex flex-col ${theme === "dark" ? "border-zinc-800 bg-[#1e1e24]" : "border-black/10 bg-[#1C1C1E]"}`}>
            <div className={`text-[10px] px-4 py-2 uppercase tracking-widest font-sans border-b flex justify-between items-center ${theme === "dark" ? "bg-zinc-950 text-zinc-500 border-zinc-850" : "bg-black text-white/50 border-white/5"}`}>
              <span>{codeLanguage || "code"} snippet {(codeLanguage.toLowerCase() === "html" || codeLanguage.toLowerCase() === "jsx") && "& Preview"}</span>
              {onOpenInspector && (
                <button
                  type="button"
                  onClick={() => onOpenInspector(codeBuffer.join("\n"), codeLanguage)}
                  className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-purple-400 hover:text-purple-300 font-semibold cursor-pointer border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 rounded-xs"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Inspect Code</span>
                </button>
              )}
            </div>
            <pre className="p-4 overflow-x-auto">
              <code className="text-sm font-mono text-white/90">
                {codeBuffer.join("\n")}
              </code>
            </pre>
            {(codeLanguage.toLowerCase() === "html" || codeLanguage.toLowerCase() === "jsx") && (() => {
              const htmlCode = codeBuffer.join("\n");
              const isComplexApp = htmlCode.includes("<script") || htmlCode.includes("<!DOCTYPE") || htmlCode.includes("<html") || htmlCode.includes("Code Inspector Pro");
              return (
                <div className={`p-2 border-t font-sans w-full ${theme === "dark" ? "bg-zinc-950 border-zinc-850 text-zinc-300" : "bg-zinc-50 border-black/10 text-black"}`}>
                  {isComplexApp ? (
                    <iframe 
                      srcDoc={htmlCode} 
                      title={`Embedded App Preview ${idx}`}
                      className="w-full h-[720px] border-0 rounded-xs shadow-xs bg-[#181825]" 
                      sandbox="allow-scripts allow-same-origin allow-modals allow-popups allow-forms"
                    />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: htmlCode }} />
                  )}
                </div>
              );
            })()}
          </div>
        );
        codeBuffer = [];
      } else {
        codeBuffer.push(line);
      }
      return;
    }

    if (trimmed.startsWith("```")) {
      flushParagraph(idx);
      inCodeBlock = true;
      codeLanguage = trimmed.substring(3).trim();
      return;
    }

    // Check if it's a Photo Markdown line: ![alt](url)
    const photoRegex = /^!\[(.*?)\]\((.*?)\)$/;
    const photoMatch = trimmed.match(photoRegex);
    
    // Check if it's a Video element line: <video src="url"...>caption</video>
    const videoRegex = /^<video\s+src="([^"]+)"[^>]*>([\s\S]*?)<\/video>$/i;
    const videoMatch = trimmed.match(videoRegex);

    // Check if it's a Swatch code line: [swatch: #colorSpec]
    const swatchRegex = /^\[swatch:\s*(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgb\([^)]+\)|hsl\([^)]+\))\]$/i;
    const swatchMatch = trimmed.match(swatchRegex);

    // Check if it's a Sketch tag: [sketch: sketch_ID]
    const sketchRegex = /^\[sketch:\s*(sketch_[a-zA-Z0-9_]+)\]$/i;
    const sketchMatch = trimmed.match(sketchRegex);

    if (photoMatch) {
      flushParagraph(idx);
      const alt = photoMatch[1];
      const url = photoMatch[2];
      elements.push(
        <div key={`photo-${idx}`} className="my-8 space-y-2 group">
          <div className={`overflow-hidden border transition-all duration-300 shadow-sm rounded-xs ${theme === "dark" ? "bg-zinc-900 border-zinc-850" : "bg-zinc-50 border-black/5"}`}>
            <img 
              src={url} 
              alt={alt} 
              referrerPolicy="no-referrer"
              className={`w-full h-auto object-cover max-h-[600px] border-b ${theme === "dark" ? "border-zinc-850" : "border-black/5"}`} 
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const parent = img.parentElement;
                if (parent) {
                  // Fallback beautiful label
                  const errLabel = parent.querySelector(".error-placeholder");
                  if (!errLabel) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = `error-placeholder p-8 text-center text-xs font-sans border border-dashed rounded-xs ${theme === "dark" ? "text-zinc-500 bg-zinc-900/40 border-zinc-800" : "text-black/40 bg-zinc-50 border-black/10"}`;
                    errorDiv.innerText = `[Image Link could not load in browser yet: src/url might be private or a file path instead of web url: ${url}]`;
                    parent.appendChild(errorDiv);
                  }
                }
              }}
            />
          </div>
          {alt && (
            <p className={`text-[11px] uppercase tracking-widest text-center font-sans italic ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>
              — {alt}
            </p>
          )}
        </div>
      );
    } else if (videoMatch) {
      flushParagraph(idx);
      const src = videoMatch[1];
      const caption = videoMatch[2];
      elements.push(
        <div key={`video-${idx}`} className="my-8 space-y-2">
          <div className={`border rounded-xs shadow-sm overflow-hidden ${theme === "dark" ? "border-zinc-800 bg-black" : "border-black/15 bg-black"}`}>
            <video 
              src={src} 
              controls 
              className="w-full max-h-[500px] outline-none" 
              onError={(e) => {
                const vid = e.target as HTMLVideoElement;
                vid.style.display = 'none';
                const parent = vid.parentElement;
                if (parent) {
                  const errLabel = parent.querySelector(".error-placeholder");
                  if (!errLabel) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = "error-placeholder p-8 text-center text-xs font-sans text-white/50 bg-zinc-900";
                    errorDiv.innerText = `[Video Player requires direct media URL. Failed playing: ${src}]`;
                    parent.appendChild(errorDiv);
                  }
                }
              }}
            />
          </div>
          {caption && (
            <p className={`text-[11px] uppercase tracking-widest text-center font-sans italic ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>
              — {caption}
            </p>
          )}
        </div>
      );
    } else if (swatchMatch) {
      flushParagraph(idx);
      const colorString = swatchMatch[1].trim();
      
      let rgbStr = "rgb(255, 87, 51)";
      let hslStr = "hsl(11, 100%, 60%)";

      if (colorString.startsWith("#")) {
        const rgb = hexToRgb(colorString);
        if (rgb) {
          rgbStr = `RGB: ${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
          const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
          hslStr = `HSL: ${hsl[0]}°, ${hsl[1]}%, ${hsl[2]}%`;
        }
      }

      elements.push(
        <div key={`swatch-${idx}`} className={`my-8 max-w-xs mx-auto border shadow-[0_12px_24px_rgba(0,0,0,0.06)] p-4 space-y-4 rounded-xs select-none transition-colors ${theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-black/15"}`}>
          {/* Main Color block */}
          <div 
            className={`w-full h-44 border rounded-xs relative overflow-hidden ${theme === "dark" ? "border-zinc-800" : "border-black/10"}`} 
            style={{ backgroundColor: colorString }}
          >
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-[9px] text-white px-2 py-0.5 tracking-widest font-mono rounded-xs uppercase">
              STUDIO SPECTRA
            </div>
          </div>
          {/* Metadata labels */}
          <div className={`space-y-1.5 font-sans leading-none border-t pt-3 ${theme === "dark" ? "border-zinc-800" : "border-black/5"}`}>
            <p className={`text-[10px] font-extrabold uppercase tracking-widest ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>COLOR BLOCK SWATCH</p>
            <div className="flex justify-between items-center text-xs pt-1">
              <span className={`font-semibold uppercase tracking-wider ${theme === "dark" ? "text-zinc-200" : "text-black"}`}>{colorString}</span>
              <span className={`font-mono text-[9px] ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>{rgbStr}</span>
            </div>
            <div className={`flex justify-between items-center text-[9px] font-mono border-t border-dashed pt-1.5 ${theme === "dark" ? "border-zinc-800 text-zinc-500" : "border-black/5 text-black/50"}`}>
              <span>COLOR COORDINATES</span>
              <span>{hslStr}</span>
            </div>
          </div>
        </div>
      );
    } else if (sketchMatch) {
      flushParagraph(idx);
      const sketchId = sketchMatch[1].trim();
      const sketchDataUrl = drawings[sketchId];
      if (sketchDataUrl) {
        elements.push(
          <div key={`sketch-${idx}`} className="my-8 space-y-2 group">
            <div className={`overflow-hidden border transition-all duration-300 shadow-sm rounded-xs max-w-lg mx-auto p-2 ${theme === "dark" ? "border-zinc-800 bg-[#121212]" : "border-black/10 bg-white"}`}>
              <img 
                src={sketchDataUrl} 
                alt="Sketch Drawing" 
                referrerPolicy="no-referrer"
                className={`w-full h-auto object-contain max-h-[400px] bg-white border ${theme === "dark" ? "border-zinc-800" : "border-black/5"}`} 
              />
            </div>
            <p className={`text-[10px] uppercase tracking-widest text-center font-sans italic ${theme === "dark" ? "text-zinc-500" : "text-black/30"}`}>
              — SKETCH DRAWING {sketchId.replace("sketch_", "")}
            </p>
          </div>
        );
      } else {
        elements.push(
          <div key={`sketch-err-${idx}`} className={`my-4 p-4 text-center text-xs font-mono border border-dashed rounded-xs ${theme === "dark" ? "text-zinc-500 border-zinc-800 bg-zinc-900/10" : "text-black/40 border-black/10"}`}>
            [Sketch Drawing Referenced: {sketchId} (Unavailable or Deleted)]
          </div>
        );
      }
    } else if (trimmed === "---" || trimmed === "***") {
      flushParagraph(idx);
      elements.push(
        <div key={`hr-${idx}`} className="my-16 flex flex-col items-center">
          <hr className={`w-full border-t mb-8 ${theme === "dark" ? "border-zinc-850" : "border-black/10"}`} />
          <div className="text-center w-full mb-8 select-none">
            <h2 className={`text-[10px] uppercase tracking-[0.2em] font-semibold mb-1 ${theme === "dark" ? "text-zinc-500" : "text-black/30"}`}>
              {ownerName ? `${ownerName}'s Notes` : "note book"}
            </h2>
            <p className={`text-[9px] uppercase tracking-widest ${theme === "dark" ? "text-zinc-650" : "text-black/20"}`}>
              {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      );
    } else if (trimmed === "") {
      flushParagraph(idx);
      elements.push(<div key={`space-${idx}`} className="h-4" />);
    } else {
      pBuffer.push(line);
    }
  });

  flushParagraph(lines.length);

  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <div key={`code-unclosed`} className={`my-8 rounded-xs overflow-hidden border shadow-sm ${theme === "dark" ? "border-zinc-800 bg-[#1e1e24]" : "border-black/10 bg-[#1C1C1E]"}`}>
        {codeLanguage && (
          <div className={`text-[10px] px-4 py-2 uppercase tracking-widest font-sans border-b flex justify-between ${theme === "dark" ? "bg-zinc-950 text-zinc-500 border-zinc-850" : "bg-black text-white/50 border-white/5"}`}>
            <span>{codeLanguage} snippet (unclosed)</span>
          </div>
        )}
        <pre className="p-4 overflow-x-auto">
          <code className="text-sm font-mono text-white/90">
            {codeBuffer.join("\n")}
          </code>
        </pre>
      </div>
    );
  }

  return elements;
}

function renderInlineContent(text: string, theme: "light" | "dark" = "light") {
  // Link regex to search for both url/uri/website patterns: \[([^\]]+)\]\(([^)]+)\)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  const processInlineCode = (str: string, baseKey: string) => {
    const codeRegex = /`([^`]+)`/g;
    const codeParts: React.ReactNode[] = [];
    let codeLastIndex = 0;
    let codeMatch;
    let idx = 0;

    while ((codeMatch = codeRegex.exec(str)) !== null) {
      if (codeMatch.index > codeLastIndex) {
        codeParts.push(<span key={`${baseKey}-t-${idx++}`}>{str.substring(codeLastIndex, codeMatch.index)}</span>);
      }
      codeParts.push(
        <code key={`${baseKey}-c-${idx++}`} className={`px-1.5 py-0.5 font-mono text-[13px] rounded-xs mx-0.5 transition-colors border ${theme === "dark" ? "bg-zinc-800 text-zinc-200 border-zinc-700" : "bg-black/5 text-black border-black/10"}`}>
          {codeMatch[1]}
        </code>
      );
      codeLastIndex = codeRegex.lastIndex;
    }
    if (codeLastIndex < str.length) {
      codeParts.push(<span key={`${baseKey}-t-${idx++}`}>{str.substring(codeLastIndex)}</span>);
    }
    return codeParts.length > 0 ? codeParts : str;
  };

  while ((match = linkRegex.exec(text)) !== null) {
    const [_, label, url] = match;
    const matchIndex = match.index;

    // Push text preceding the match
    if (matchIndex > lastIndex) {
      parts.push(processInlineCode(text.substring(lastIndex, matchIndex), `pre-${matchIndex}`));
    }

    if (url.startsWith("color:")) {
      const textColor = url.replace("color:", "").trim();
      parts.push(
        <span 
          key={matchIndex} 
          style={{ color: textColor }} 
          className="font-semibold"
        >
          {label}
        </span>
      );
    } else if (url.startsWith("bg:")) {
      const bgColor = url.replace("bg:", "").trim();
      const textLightColor = isLightColor(bgColor) ? "#000000" : "#ffffff";
      parts.push(
        <span 
          key={matchIndex} 
          style={{ backgroundColor: bgColor, color: textLightColor }} 
          className="px-1.5 py-0.5 rounded-xs mx-0.5 font-sans font-semibold text-xs inline-block"
        >
          {label}
        </span>
      );
    } else {
      // Standardize URL protocol for absolute linking
      let href = url.trim();
      if (
        !href.startsWith("http://") && 
        !href.startsWith("https://") && 
        !href.includes(":") && 
        !href.startsWith("//")
      ) {
        href = "https://" + href;
      }
      
      parts.push(
        <a
          key={matchIndex}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-0.5 font-semibold underline transition-all px-1 rounded-xs cursor-pointer ${theme === "dark" ? "text-zinc-100 decoration-zinc-750 hover:decoration-zinc-500 bg-white/5 hover:bg-white/10" : "text-black decoration-black/30 hover:decoration-black bg-black/5 hover:bg-black/10"}`}
          onClick={(e) => {
            // If custom scheme uri is used e.g. custom schemas (skype:, tel:) keep native click actions active
            if (href.startsWith("mailto:") || href.startsWith("tel:")) {
              // Keep native behavior
            }
          }}
        >
          <span>{label}</span>
        </a>
      );
    }

    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(processInlineCode(text.substring(lastIndex), `post-${lastIndex}`));
  }

  return parts.length > 0 ? parts : processInlineCode(text, 'base');
}

// ==========================================
// COLOR SYSTEM MATHEMATICS HELPERS
// ==========================================

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [
    Math.round(255 * f(0)),
    Math.round(255 * f(8)),
    Math.round(255 * f(4))
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function isLightColor(colorStr: string): boolean {
  let r = 255, g = 255, b = 255;
  const normalized = colorStr.trim();
  if (normalized.startsWith("#")) {
    const rgb = hexToRgb(normalized);
    if (rgb) {
      r = rgb[0];
      g = rgb[1];
      b = rgb[2];
    }
  }
  // Formula for luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 5000) return "Just now";
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(ts).toLocaleDateString();
}

interface ChatMessagePart {
  type: "text" | "code";
  content: string;
  language?: string;
}

function parseChatMessage(text: string): ChatMessagePart[] {
  const parts: ChatMessagePart[] = [];
  const lines = text.split("\n");
  let inCode = false;
  let currentLanguage = "";
  let currentBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      if (inCode) {
        // End of code block
        parts.push({
          type: "code",
          content: currentBuffer.join("\n"),
          language: currentLanguage
        });
        currentBuffer = [];
        currentLanguage = "";
        inCode = false;
      } else {
        // End any text buffer first
        if (currentBuffer.length > 0) {
          parts.push({
            type: "text",
            content: currentBuffer.join("\n")
          });
          currentBuffer = [];
        }
        inCode = true;
        currentLanguage = line.trim().slice(3).trim();
      }
    } else {
      currentBuffer.push(line);
    }
  }

  // Handle remaining buffer
  if (currentBuffer.length > 0) {
    parts.push({
      type: inCode ? "code" : "text",
      content: currentBuffer.join("\n"),
      language: inCode ? currentLanguage : undefined
    });
  }

  return parts;
}

function formatInlineText(text: string, theme: "light" | "dark") {
  const boldParts = text.split(/\*\*([\s\S]*?)\*\*/g);
  return boldParts.map((part, i) => {
    const isBold = i % 2 === 1;
    const inlineParts = part.split(/`([\s\S]*?)`/g);
    const renderedInline = inlineParts.map((subPart, j) => {
      const isCode = j % 2 === 1;
      if (isCode) {
        return (
          <code 
            key={`code-${i}-${j}`} 
            className={`px-1.5 py-0.5 rounded-xs font-mono text-xs ${
              theme === "dark" ? "bg-zinc-800 text-amber-500" : "bg-zinc-200 text-amber-700"
            }`}
          >
            {subPart}
          </code>
        );
      }
      return subPart;
    });

    if (isBold) {
      return (
        <strong 
          key={`bold-${i}`} 
          className={theme === "dark" ? "text-white font-semibold" : "text-black font-semibold"}
        >
          {renderedInline}
        </strong>
      );
    }
    return <span key={`text-${i}`}>{renderedInline}</span>;
  });
}


