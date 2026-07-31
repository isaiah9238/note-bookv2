import path, { resolve, dirname } from "path";
import { VertexAI } from '@google-cloud/vertexai';
import fs from "fs";
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

console.log("=== GEMINI KEY CHECK ===");
console.log("Key exists:", !!process.env.GEMINI_API_KEY);
console.log("Key preview:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.slice(0, 8) + "..." : "UNDEFINED");
console.log("========================");

import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const vertexAI = new VertexAI({
  project: 'gen-lang-client-0989083154', // Replace with your GCP project ID
  location: 'us-west1',        // Replace with your preferred GCP region
  googleAuthOptions: {
    keyFilename: path.join(process.cwd(), 'serviceAccountKey.json'),
  },
});

const model = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const resp = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const responseText = resp.response.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ text: responseText });
  } catch (error) {
    console.error('Vertex API Error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_FILE = path.join(process.cwd(), "debug.log");
const logDebug = (msg: string) => {
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
  console.log(msg);
};

// Initialize Firebase Admin (handles serviceAccountKey.json or fallback)
let adminApp;
if (!getApps().length) {
  const serviceAccountPath = path.join(process.cwd(), "serviceAccountKey.json");

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0989083154",
    });
    console.log("✅ Firebase Admin initialized using serviceAccountKey.json");
  } else {
    console.warn("⚠️ serviceAccountKey.json not found. Initializing with default project credentials.");
    adminApp = initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0989083154",
    });
  }
} else {
  adminApp = getApp();
}

export const db = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);

// Offline token helper
const decodeTokenOffline = (token: string) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
  } catch (e) {
    return null;
  }
};

const LOG_PATH = path.join(process.cwd(), "secure_audit.log");
const ALLOWED_USERS_PATH = path.join(process.cwd(), "allowed_users.json");
const DNE_LIST_PATH = path.join(process.cwd(), "dne_list.json");

if (!fs.existsSync(ALLOWED_USERS_PATH)) {
  fs.writeFileSync(ALLOWED_USERS_PATH, JSON.stringify(["isaiah9238@gmail.com"]), "utf8");
}
if (!fs.existsSync(DNE_LIST_PATH)) {
  fs.writeFileSync(DNE_LIST_PATH, JSON.stringify(["Tabula", "tabula"]), "utf8");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  vertexAI: false,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Middleware
  const verifyAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing authorization" });
      const token = authHeader.split("Bearer ")[1];
      let decoded: any;
      try {
        decoded = await getAuth().verifyIdToken(token);
      } catch (err) {
        decoded = decodeTokenOffline(token);
      }
      if (!decoded || decoded.email !== "isaiah9238@gmail.com") return res.status(403).json({ error: "Not admin" });
      next();
    } catch (e) { res.status(401).json({ error: "Invalid token" }); }
  };

  const verifyUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing authorization" });
      const token = authHeader.split("Bearer ")[1];
      let decoded: any;
      try {
        decoded = await getAuth().verifyIdToken(token);
      } catch (err) {
        decoded = decodeTokenOffline(token);
      }
      if (!decoded) return res.status(401).json({ error: "Invalid token" });
      next();
    } catch (e) { res.status(401).json({ error: "Invalid token" }); }
  };

  // Health & DB Test Routes
  app.get("/api/test-db", async (req, res) => {
    try {
      const testRef = db.collection("_health_checks").doc("server_ping");
      await testRef.set({ timestamp: new Date().toISOString() });
      const doc = await testRef.get();
      res.json({ success: true, data: doc.data() });
    } catch (error: any) {
      console.error("Firestore test failed:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Notebook Firestore Persistence Routes
  app.post("/api/notebook/save", verifyUser, async (req, res) => {
    try {
      const { notebookId, title, context, drawingsCount } = req.body;
      if (!notebookId) return res.status(400).json({ error: "Missing notebookId" });

      const docRef = db.collection("notebooks").doc(notebookId);
      await docRef.set({
        title: title || "Untitled Notebook",
        context: context || "",
        drawingsCount: drawingsCount || 0,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({ success: true, notebookId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/notebook/:id", verifyUser, async (req, res) => {
    try {
      const docRef = db.collection("notebooks").doc(req.params.id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Notebook not found" });
      res.json({ id: doc.id, ...doc.data() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Librarian Routes
  app.post("/api/librarian/log", verifyUser, (req, res) => {
    try {
      const { email, status } = req.body;
      const entry = {
        timestamp: new Date().toISOString(),
        email,
        status,
        ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress
      };
      fs.appendFileSync(LOG_PATH, `${JSON.stringify(entry)}\n`, "utf8");
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/librarian/logs", verifyAdmin, (req, res) => {
    try {
      if (!fs.existsSync(LOG_PATH)) return res.json([]);
      const logs = fs.readFileSync(LOG_PATH, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/librarian/allowed-users", verifyUser, (req, res) => {
    try {
      if (!fs.existsSync(ALLOWED_USERS_PATH)) return res.json([]);
      res.json(JSON.parse(fs.readFileSync(ALLOWED_USERS_PATH, "utf8")));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/librarian/dne-list", verifyUser, (req, res) => {
    try {
      if (!fs.existsSync(DNE_LIST_PATH)) return res.json([]);
      res.json(JSON.parse(fs.readFileSync(DNE_LIST_PATH, "utf8")));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gemini Chat Route
  app.post("/api/gemini/chat", async (req, res) => {
    logDebug("=== CHAT REQUEST RECEIVED ===");
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing authorization header" });
      }

      const idToken = authHeader.split("Bearer ")[1];
      let decodedToken: any;
      try {
        decodedToken = await getAuth().verifyIdToken(idToken);
      } catch (err: any) {
        decodedToken = decodeTokenOffline(idToken);
        if (!decodedToken) return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      const email = decodedToken.email || "";
      const allowedUsers = JSON.parse(fs.readFileSync(ALLOWED_USERS_PATH, "utf8"));
      const dneList = JSON.parse(fs.readFileSync(DNE_LIST_PATH, "utf8"));

      const inDneList = dneList.some((dne: string) =>
        email.toLowerCase().includes(dne.toLowerCase()) ||
        (decodedToken?.name && decodedToken.name.toLowerCase().includes(dne.toLowerCase()))
      );

      if (email !== "isaiah9238@gmail.com" && (inDneList || !allowedUsers.includes(email))) {
        return res.status(403).json({ error: "Account not whitelisted." });
      }

      const { message, history, context, drawingsCount } = req.body;

      const systemInstruction = `You are an advanced AI companion for a digital notebook.
CURRENT NOTEBOOK CONTEXT:
---
${context ? context : "(The notebook is currently empty)"}
---
Drawings count: ${drawingsCount || 0}.

Personas: Professional, Work Forward, Calm and Collected, Children, Architect, Crew Chief, Student, Professor.
Answer directly and concisely.`;

      const contents = history ? [...history, { role: 'user', parts: [{ text: message }] }] : [{ role: 'user', parts: [{ text: message }] }];

      const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents,
        config: { systemInstruction }
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of response) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      logDebug(`Gemini API Error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite Dev vs Production Handling
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = resolve(__dirname, './dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();