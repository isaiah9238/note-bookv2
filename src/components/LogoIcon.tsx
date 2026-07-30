import React from "react";

interface LogoIconProps {
  className?: string;
  theme?: "light" | "dark";
  useOriginalColors?: boolean; // If true, uses light blue/black or absolute black/neon-emerald
}

export default function LogoIcon({ className = "w-16 h-16", theme = "light", useOriginalColors = false }: LogoIconProps) {
  if (useOriginalColors) {
    if (theme === "dark") {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" className={className}>
          <rect width="500" height="500" fill="#000000" rx="40" />
          <g fill="#00FF66">
            <rect x="170" y="120" width="40" height="40" />
            <rect x="200" y="120" width="10" height="260" />
            <rect x="170" y="340" width="40" height="40" />
            <rect x="90" y="180" width="40" height="30" />
            <rect x="120" y="180" width="10" height="140" />
            <rect x="90" y="290" width="40" height="30" />
            <rect x="40" y="215" width="25" height="20" />
            <rect x="60" y="215" width="5" height="70" />
            <rect x="40" y="265" width="25" height="20" />
            <rect x="290" y="120" width="40" height="40" />
            <rect x="290" y="120" width="10" height="260" />
            <rect x="290" y="340" width="40" height="40" />
            <rect x="370" y="180" width="40" height="30" />
            <rect x="370" y="180" width="10" height="140" />
            <rect x="370" y="290" width="40" height="30" />
            <rect x="435" y="215" width="25" height="20" />
            <rect x="435" y="215" width="5" height="70" />
            <rect x="435" y="265" width="25" height="20" />
          </g>
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" className={className}>
          <rect width="500" height="500" fill="#cce8ff" rx="40" />
          <g fill="#000000">
            <rect x="170" y="120" width="40" height="40" />
            <rect x="200" y="120" width="10" height="260" />
            <rect x="170" y="340" width="40" height="40" />
            <rect x="90" y="180" width="40" height="30" />
            <rect x="120" y="180" width="10" height="140" />
            <rect x="90" y="290" width="40" height="30" />
            <rect x="40" y="215" width="25" height="20" />
            <rect x="60" y="215" width="5" height="70" />
            <rect x="40" y="265" width="25" height="20" />
            <rect x="290" y="120" width="40" height="40" />
            <rect x="290" y="120" width="10" height="260" />
            <rect x="290" y="340" width="40" height="40" />
            <rect x="370" y="180" width="40" height="30" />
            <rect x="370" y="180" width="10" height="140" />
            <rect x="370" y="290" width="40" height="30" />
            <rect x="435" y="215" width="25" height="20" />
            <rect x="435" y="215" width="5" height="70" />
            <rect x="435" y="265" width="25" height="20" />
          </g>
        </svg>
      );
    }
  }

  // Dynamic minimalist transparent theme-aligned SVG
  const fillClass = theme === "dark" ? "fill-[#00FF66]" : "fill-black";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" className={`${className} ${fillClass}`}>
      <g>
        {/* LEFT SIDE */}
        <rect x="170" y="120" width="40" height="40" />
        <rect x="200" y="120" width="10" height="260" />
        <rect x="170" y="340" width="40" height="40" />

        <rect x="90" y="180" width="40" height="30" />
        <rect x="120" y="180" width="10" height="140" />
        <rect x="90" y="290" width="40" height="30" />

        <rect x="40" y="215" width="25" height="20" />
        <rect x="60" y="215" width="5" height="70" />
        <rect x="40" y="265" width="25" height="20" />

        {/* RIGHT SIDE */}
        <rect x="290" y="120" width="40" height="40" />
        <rect x="290" y="120" width="10" height="260" />
        <rect x="290" y="340" width="40" height="40" />

        <rect x="370" y="180" width="40" height="30" />
        <rect x="370" y="180" width="10" height="140" />
        <rect x="370" y="290" width="40" height="30" />

        <rect x="435" y="215" width="25" height="20" />
        <rect x="435" y="215" width="5" height="70" />
        <rect x="435" y="265" width="25" height="20" />
      </g>
    </svg>
  );
}
