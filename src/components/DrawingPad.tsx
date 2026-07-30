import React, { useRef, useState, useEffect } from "react";
import { Trash2, Check, ArrowLeft, RefreshCw } from "lucide-react";

interface DrawingPadProps {
  onInsert: (dataUrl: string) => void;
  onBack: () => void;
  initialColor?: string;
  theme?: "light" | "dark";
}

export default function DrawingPad({ onInsert, onBack, initialColor = "#1C1C1E", theme = "light" }: DrawingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(initialColor);
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  // Initialize canvas with solid white background and handle high-DPI + dynamic resizing cleanly without stretching drawings
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Helper to configure canvas internal backing store and maintain crispness
    const configureCanvas = (width: number, height: number, existingDataUrl?: string) => {
      // Scale resolution by 2x for Retina/High-DPI displays
      canvas.width = width * 2;
      canvas.height = height * 2;
      ctx.scale(2, 2);

      // Re-initialize default canvas styles
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Restore existing drawing content if available, drawing it at new aspect ratio/dimensions
      if (existingDataUrl) {
        const img = new globalThis.Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
        };
        img.src = existingDataUrl;
      }
    };

    // Initial setup
    const initialRect = canvas.getBoundingClientRect();
    configureCanvas(initialRect.width, initialRect.height);

    // Track state to prevent resizing loops
    let resizeTimeout: any = null;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;

        // Debounce resize updates to preserve system resource usage and prevent cursor jumping
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const currentDataUrl = canvas.toDataURL();
          configureCanvas(width, height, currentDataUrl);
        }, 100);
      }
    });

    const parent = canvas.parentElement;
    if (parent) {
      observer.observe(parent);
    }

    return () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      observer.disconnect();
    };
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.strokeStyle = isEraser ? "#ffffff" : color;
      ctx.lineWidth = brushSize;
      
      // Draw a tiny dot immediately on click/touch to feel responsive
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.strokeStyle = isEraser ? "#ffffff" : color;
      ctx.lineWidth = brushSize;
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      const rect = canvas.getBoundingClientRect();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Export to high-quality png
      const dataUrl = canvas.toDataURL("image/png");
      onInsert(dataUrl);
    }
  };

  const presetColors = [
    "#1C1C1E", // Solid Charcoal
    "#FF3B30", // Scarlet Red
    "#34C759", // Emerald Green
    "#007AFF", // Royal Blue
    "#FFCC00", // Sunset Yellow
    "#AF52DE", // Monarch Purple
    "#FF9500"  // Orange Sunset
  ];

  const brushSizes = [2, 4, 8, 14];

  return (
    <div className="space-y-4 animate-fade-in font-sans">
      {/* Back / Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={onBack}
            className={`transition-opacity cursor-pointer p-1 ${theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-black/40 hover:text-black"}`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h3 className={`text-xs font-semibold tracking-[0.2em] uppercase ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>Sketch Drawing Pad</h3>
        </div>
        <button
          type="button"
          onClick={clearCanvas}
          className={`transition-colors flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold cursor-pointer ${theme === "dark" ? "text-zinc-500 hover:text-red-400" : "text-black/40 hover:text-red-500"}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* The Active Canvas */}
      <div className={`border p-1 rounded-sm relative overflow-hidden transition-colors ${theme === "dark" ? "border-zinc-800 bg-zinc-900" : "border-black/15 bg-stone-50"}`}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full h-48 bg-white cursor-crosshair block rounded-sm touch-none transition-colors ${theme === "dark" ? "border-zinc-850" : "border-stone-100"}`}
          style={{ width: "100%", height: "192px" }}
        />
        <div className={`absolute top-2 left-2 border backdrop-blur-xs text-[8px] uppercase tracking-wider font-semibold pointer-events-none px-1.5 py-0.5 rounded-sm ${theme === "dark" ? "bg-zinc-800/80 border-zinc-750 text-zinc-400" : "bg-stone-100/70 border-stone-200 text-black/40"}`}>
          Live Canvas Area
        </div>
      </div>

      {/* Controls & Presets */}
      <div className="space-y-3">
        {/* Brush vs Eraser and Size selector */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEraser(false)}
              className={`px-3 py-1 text-[10px] uppercase tracking-widest font-semibold border rounded-xs transition-all cursor-pointer relative before:content-[''] before:absolute before:inset-[-4px] ${
                !isEraser 
                  ? (theme === "dark" ? "bg-zinc-100 text-zinc-950 border-white font-extrabold" : "bg-black text-white border-black font-extrabold") 
                  : (theme === "dark" ? "bg-zinc-800 text-zinc-400 border-zinc-750 hover:border-zinc-500" : "bg-white text-black/60 border-black/10 hover:border-black/30")
              }`}
            >
              Pen Tool
            </button>
            <button
              type="button"
              onClick={() => setIsEraser(true)}
              className={`px-3 py-1 text-[10px] uppercase tracking-widest font-semibold border rounded-xs transition-all cursor-pointer relative before:content-[''] before:absolute before:inset-[-4px] ${
                isEraser 
                  ? (theme === "dark" ? "bg-zinc-100 text-zinc-950 border-white font-extrabold" : "bg-black text-white border-black font-extrabold") 
                  : (theme === "dark" ? "bg-zinc-800 text-zinc-400 border-zinc-750 hover:border-zinc-500" : "bg-white text-black/60 border-black/10 hover:border-black/30")
              }`}
            >
              Eraser
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[9px] uppercase tracking-wider font-semibold font-sans ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>Size:</span>
            <div className="flex gap-1.5">
              {brushSizes.map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setBrushSize(sz)}
                  className={`w-7 h-7 border rounded-xs flex items-center justify-center font-mono text-[9px] transition-all cursor-pointer relative before:content-[''] before:absolute before:inset-[-4px] ${
                    brushSize === sz 
                      ? (theme === "dark" ? "bg-zinc-100 text-zinc-950 border-white font-bold" : "bg-black text-white border-black font-bold") 
                      : (theme === "dark" ? "bg-zinc-800 text-zinc-400 border-zinc-750 hover:border-zinc-500" : "bg-white text-black/40 border-black/10 hover:border-black/25")
                  }`}
                >
                  {sz === 2 ? "XS" : sz === 4 ? "S" : sz === 8 ? "M" : "L"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Colors and Palette selection */}
        {!isEraser && (
          <div className={`space-y-1.5 pt-1 border-t ${theme === "dark" ? "border-zinc-800" : "border-black/5"}`}>
            <label className={`block text-[9px] uppercase tracking-[0.15em] font-semibold mb-1 select-none ${theme === "dark" ? "text-zinc-500" : "text-black/40"}`}>
              Inking Color Palette
            </label>
            <div className="flex gap-2 flex-wrap items-center">
              {presetColors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-xs border shadow-xs transition-all cursor-pointer hover:scale-110 active:scale-95 relative before:content-[''] before:absolute before:inset-[-4px] ${
                    color === c 
                      ? (theme === "dark" ? "border-zinc-100 scale-110 ring-2 ring-zinc-500" : "border-black scale-110 ring-2 ring-black/10") 
                      : (theme === "dark" ? "border-zinc-800" : "border-black/15")
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <button
        type="button"
        onClick={handleSave}
        className={`w-full hover:opacity-90 transition-opacity py-3 text-[10px] font-extrabold uppercase tracking-widest rounded-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm mt-4 ${theme === "dark" ? "bg-zinc-100 text-zinc-950 hover:bg-white" : "bg-black text-white"}`}
      >
        <Check className="w-3.5 h-3.5" />
        Insert Sketch drawing
      </button>
    </div>
  );
}
