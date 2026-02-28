"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, Download } from "lucide-react";
import { exportDatabase } from "@/lib/export-db";

export function SettingsMenu({ variant = "icon" }: { variant?: "icon" | "sidebar" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  async function handleExport() {
    console.log("starting export");
    // setOpen(false);
    await exportDatabase();
  }

  return (
    <div ref={ref} className="relative">
      {variant === "sidebar" ? (
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
            open
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
          aria-label="Settings"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Settings className="h-5 w-5" strokeWidth={open ? 2.5 : 2} />
          Settings
        </button>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="p-2.5 rounded-lg border bg-card text-foreground border-border hover:bg-accent transition-colors duration-150"
          aria-label="Settings"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Settings className="h-4 w-4" />
        </button>
      )}
      {open && (
        <div
          className={`absolute z-50 w-48 bg-card border border-border rounded-xl shadow-lg py-1 animate-in fade-in duration-150 ${
            variant === "sidebar"
              ? "bottom-full mb-1.5 left-0 slide-in-from-bottom-1"
              : "top-full mt-1.5 right-0 slide-in-from-top-1"
          }`}
        >
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-100"
          >
            <Download className="h-4 w-4" />
            Export Backup
          </button>
        </div>
      )}
    </div>
  );
}