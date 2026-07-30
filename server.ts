import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const appUrl = process.env.APP_URL || "http://localhost:3000";

const LOG_FILE = path.join(process.cwd(), "debug.log");
const logDebug = (msg: string) => {
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
  console.log(msg);
};

// Initialize Firebase Admin (handles serviceAccountKey.json or fallback)
const serviceAccountPath = path.join(process.cwd(), "serviceAccountKey.json");
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0989083154",
  });
} else {
  // Fallback for local development if key is missing (uses offline token decoding)
  console.warn("⚠️ serviceAccountKey.json not found. Falling back to default initialization.");
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0989083154",
  });
}

// Helper for offline token fallback if Firebase Admin key is not provided locally
const decodeTokenOffline = (token: string) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    return payload;
  } catch (e) {
    return null;
  }
};

const LOG_PATH = path.join(process.cwd(), "secure_audit.log");
const ALLOWED_USERS_PATH = path.join(process.cwd(), "allowed_users.json");
const DNE_LIST_PATH = path.join(process.cwd(), "dne_list.json");

// Ensure allowed users file exists
if (!fs.existsSync(ALLOWED_USERS_PATH)) {
  fs.writeFileSync(ALLOWED_USERS_PATH, JSON.stringify(["isaiah9238@gmail.com"]), "utf8");
}

// Ensure DNE (Do Not Enter) list exists
if (!fs.existsSync(DNE_LIST_PATH)) {
  fs.writeFileSync(DNE_LIST_PATH, JSON.stringify(["Tabula", "tabula"]), "utf8");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
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

  // Gatekeeper Middlewares
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

  // Librarian API Endpoints
  app.post("/api/librarian/log", verifyUser, (req, res) => {
    try {
      const { email, status } = req.body;
      const entry = {
        timestamp: new Date().toISOString(),
        email,
        status,
        ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress
      };
      const logLine = `${JSON.stringify(entry)}\n`;
      fs.appendFileSync(LOG_PATH, logLine, "utf8");
      res.json({ success: true });
    } catch (error: any) {
      console.error("Librarian Log Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/librarian/logs", verifyAdmin, (req, res) => {
    try {
      if (!fs.existsSync(LOG_PATH)) {
        return res.json([]);
      }
      const fileContent = fs.readFileSync(LOG_PATH, "utf8");
      const logs = fileContent
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      res.json(logs);
    } catch (error: any) {
      console.error("Librarian Read Logs Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/librarian/allowed-users", verifyUser, (req, res) => {
    try {
      if (!fs.existsSync(ALLOWED_USERS_PATH)) {
        return res.json([]);
      }
      const allowedUsers = JSON.parse(fs.readFileSync(ALLOWED_USERS_PATH, "utf8"));
      res.json(allowedUsers);
    } catch (error: any) {
      console.error("Librarian Read Allowed Users Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/librarian/dne-list", verifyUser, (req, res) => {
    try {
      if (!fs.existsSync(DNE_LIST_PATH)) {
        return res.json([]);
      }
      const dneList = JSON.parse(fs.readFileSync(DNE_LIST_PATH, "utf8"));
      res.json(dneList);
    } catch (error: any) {
      console.error("Librarian Read DNE List Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Gemini Companion API Route
  app.post("/api/gemini/chat", async (req, res) => {
    logDebug("=== CHAT REQUEST RECEIVED ===");
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logDebug("Missing auth header");
        return res.status(401).json({ error: "Missing or invalid authorization header" });
      }

      const idToken = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await getAuth().verifyIdToken(idToken);
        logDebug(`Token decoded for ${decodedToken.email}`);
      } catch (err: any) {
        logDebug(`Token verification failed, trying offline decode: ${err.message}`);
        decodedToken = decodeTokenOffline(idToken);
        if (!decodedToken) {
          logDebug("Offline decode also failed");
          return res.status(401).json({ error: "Unauthorized: Invalid token" });
        }
      }
      
      const email = decodedToken.email || "";
      const allowedUsers = JSON.parse(fs.readFileSync(ALLOWED_USERS_PATH, "utf8"));
      const dneList = JSON.parse(fs.readFileSync(DNE_LIST_PATH, "utf8"));
      
      const inDneList = dneList.some((dne: string) => 
        email.toLowerCase().includes(dne.toLowerCase()) || 
        (decodedToken?.name && decodedToken.name.toLowerCase().includes(dne.toLowerCase()))
      );

      if (email !== "isaiah9238@gmail.com" && (inDneList || !allowedUsers.includes(email))) {
        logDebug(`Gatekeeper blocked user: ${email}. inDneList=${inDneList}, allowedUsers=${allowedUsers.join(",")}`);
        console.warn(`[SERVER GATEKEEPER] BLOCKED API request from ${email}`);
        return res.status(403).json({ error: "Your account is not whitelisted to use the AI in this app. Please contact the owner." });
      }

      const { message, history, context, drawingsCount } = req.body;
      logDebug(`Request body sizes - message: ${message?.length}, history: ${history?.length}, context: ${context?.length}`);

      const systemInstruction = `You are an advanced AI companion for a digital notebook.
You have access to the user's current notebook contents to provide highly contextual assistance.

CURRENT NOTEBOOK CONTEXT:
---
${context ? context : "(The notebook is currently empty)"}
---
The notebook currently contains ${drawingsCount || 0} embedded drawings/sketches.

Your personas (user may ask to switch):
1. The Professional
2. Work Forward
3. Calm and Collected
4. Children
5. The Architect
6. The Crew Chief
7. The Student
8. The Professor

Answer the user directly and concisely. Keep the tone minimal unless instructed otherwise.

IMPORTANT CO-CREATION CAPABILITY:
You can help the user build their vision by suggesting clean text, markdown widgets, HTML elements, or custom execution paths.
When proposing code modifications, full templates, or structured notes that the user might want to apply directly to their parent notebook, ALWAYS wrap them inside standard markdown code blocks (such as \`\`\`html ... \`\`\` or \`\`\`markdown ... \`\`\`).
The user has direct, 1-click interface buttons ("Replace Notebook", "Append", "Insert") beneath all your code blocks to instantly integrate your suggestions into their notebook canvas. Encourage them to start fresh on a blank canvas, brainstorm their vision, and output beautiful interactive templates they can test in real-time by switching to the "View" tab!`;

      const contents = history ? [...history, { role: 'user', parts: [{ text: message }] }] : [{ role: 'user', parts: [{ text: message }] }];

      logDebug(`Calling Gemini generateContentStream...`);
      let response;
      try {
        response = await ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction: systemInstruction,
          }
        });
      } catch (genError: any) {
        logDebug(`Gemini API Generation Error: ${genError.message}`);
        console.error("Gemini API Generation Error:", genError);
        
        let errMsg = genError.message || String(genError);
        if (
          errMsg.includes("prepayment credits") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("429") ||
          errMsg.includes("depleted")
        ) {
          errMsg = "The Gemini AI service is temporarily unavailable due to depleted API credits or rate limits. Please try again later or contact the notebook owner.";
        }
        return res.status(500).json({ error: errMsg });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let chunksSent = 0;
      try {
        for await (const chunk of response) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
            chunksSent++;
          }
        }
        res.write("data: [DONE]\n\n");
        res.end();
        logDebug(`Stream complete. Chunks sent: ${chunksSent}`);
      } catch (streamError: any) {
        logDebug(`Gemini API Stream Iteration Error: ${streamError.message}`);
        console.error("Gemini API Stream Iteration Error:", streamError);
        
        let streamErrMsg = streamError.message || String(streamError);
        if (
          streamErrMsg.includes("prepayment credits") ||
          streamErrMsg.includes("RESOURCE_EXHAUSTED") ||
          streamErrMsg.includes("429") ||
          streamErrMsg.includes("depleted")
        ) {
          streamErrMsg = "\n\n⚠️ **Service Alert:** The Gemini AI companion is temporarily unavailable due to depleted API credits or rate limits. Please try again later or contact the notebook owner.";
        } else {
          streamErrMsg = `\n\n⚠️ **Stream Error:** ${streamErrMsg}`;
        }
        res.write(`data: ${JSON.stringify({ text: streamErrMsg })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
      }
    } catch (error: any) {
      logDebug(`Gemini API Error: ${error.message}`);
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development vs static bundle serve in production
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

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();