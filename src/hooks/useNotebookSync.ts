// src/hooks/useNotebookSync.ts
import { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const STORAGE_KEY = "mini_note_content";
const NAME_KEY = "mini_note_owner_name";

export function useNotebookSync(user: User | null | undefined, defaultContent: string) {
  const [content, setContent] = useState(defaultContent);
  const [ownerName, setOwnerName] = useState("");
  const [drawings, setDrawings] = useState<Record<string, string>>({});
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isLoaded, setIsLoaded] = useState(false);

  const lastSyncedRef = useRef<{ content: string; ownerName: string; drawings: Record<string, string>; theme: string } | null>(null);

  // Load state on mount/auth change
  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          const snap = await getDoc(doc(db, "drafts", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            setContent(data.content || defaultContent);
            setOwnerName(data.ownerName || "");
            setDrawings(data.drawings || {});
            setTheme(data.theme || "light");
            lastSyncedRef.current = { content: data.content, ownerName: data.ownerName, drawings: data.drawings, theme: data.theme };
            setIsLoaded(true);
            return;
          }
        } catch (e) {
          console.warn("Cloud load failed, using local storage", e);
        }
      }
      // Local fallback
      setContent(localStorage.getItem(STORAGE_KEY) || defaultContent);
      setOwnerName(localStorage.getItem(NAME_KEY) || "");
      setTheme((localStorage.getItem("mini_note_theme") as "light" | "dark") || "light");
      try {
        setDrawings(JSON.parse(localStorage.getItem("mini_note_drawings") || "{}"));
      } catch {
        setDrawings({});
      }
      setIsLoaded(true);
    }
    loadData();
  }, [user]);

  // Debounced Auto-Save (1s)
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setTimeout(async () => {
      localStorage.setItem(STORAGE_KEY, content);
      localStorage.setItem(NAME_KEY, ownerName);
      localStorage.setItem("mini_note_drawings", JSON.stringify(drawings));
      localStorage.setItem("mini_note_theme", theme);

      if (user) {
        try {
          await setDoc(doc(db, "drafts", user.uid), { content, ownerName, drawings, theme, userId: user.uid, updatedAt: Date.now() }, { merge: true });
        } catch (e) {
          console.warn("Cloud save failed", e);
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, ownerName, drawings, theme, isLoaded, user]);

  return { content, setContent, ownerName, setOwnerName, drawings, setDrawings, theme, setTheme, isLoaded };
}