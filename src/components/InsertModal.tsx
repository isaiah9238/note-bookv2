import React, { useState } from "react";
import { X, Image, Palette, PenTool, Code } from "lucide-react";
import DrawingPad from "./DrawingPad";

interface InsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertData: (type: "image" | "sketch" | "code", payload: string) => void;
  theme?: "light" | "dark";
}

export function InsertModal({ isOpen, onClose, onInsertData, theme = "light" }: InsertModalProps) {
  const [activeTab, setActiveTab] = useState<"image" | "sketch">("sketch");
  const [imageUrl, setImageUrl] = useState("");

  if (!isOpen) return null;

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className={`w-full max-w-lg border rounded-lg p-6 relative shadow-2xl ${isDark ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-black/15 text-black"}`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:opacity-75">
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-sm font-bold uppercase tracking-wider mb-4">Insert Content</h2>

        <div className="flex border-b mb-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab("sketch")}
            className={`flex-1 py-2 text-center border-b-2 ${activeTab === "sketch" ? "border-purple-500 font-bold" : "border-transparent opacity-60"}`}
          >
            Sketch Pad
          </button>
          <button
            onClick={() => setActiveTab("image")}
            className={`flex-1 py-2 text-center border-b-2 ${activeTab === "image" ? "border-purple-500 font-bold" : "border-transparent opacity-60"}`}
          >
            Image Link
          </button>
        </div>

        {activeTab === "sketch" ? (
          <DrawingPad
            onBack={onClose}
            theme={theme}
            onInsert={(dataUrl) => {
              onInsertData("sketch", dataUrl);
              onClose();
            }}
          />
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Paste image URL (https://...)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={`w-full p-2 border rounded text-xs ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-black/20"}`}
            />
            <button
              onClick={() => {
                if (imageUrl) onInsertData("image", imageUrl);
                onClose();
              }}
              className="w-full py-2 bg-black text-white dark:bg-white dark:text-black font-bold uppercase text-xs rounded"
            >
              Insert Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}