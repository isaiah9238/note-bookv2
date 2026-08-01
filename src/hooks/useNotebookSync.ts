import { useState, useEffect } from 'react';

const DEFAULT_CONTENT = `# System Design Notebook\n\nWelcome to your local workspace!`;

export function useNotebookSync(notebookId: string = 'default-notebook') {
  const STORAGE_KEY = `notebook_content_${notebookId}`;

  // Initialize state directly from LocalStorage
  const [content, setContent] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== null ? saved : DEFAULT_CONTENT;
    } catch (e) {
      console.warn("Failed to read from localStorage:", e);
      return DEFAULT_CONTENT;
    }
  });

  // Auto-save to LocalStorage whenever content changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, content);
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  }, [content, STORAGE_KEY]);

  return { content, setContent };
}