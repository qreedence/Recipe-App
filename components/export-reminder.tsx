"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { db } from "@/lib/db";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function ExportReminder() {
  useEffect(() => {
    if (sessionStorage.getItem("hasShownExportReminder")) return;

    async function checkReminder() {
      const count = await db.recipes.count();
      if (count === 0) return;

      const lastExport = localStorage.getItem("lastExportedAt");
      const shouldRemind =
        !lastExport ||
        Date.now() - new Date(lastExport).getTime() >= SEVEN_DAYS;

      if (shouldRemind) {
        sessionStorage.setItem("hasShownExportReminder", "true");
        toast.info("It's been a while — back up your recipes!", {
          duration: 5000,
        });
      }
    }

    checkReminder();
  }, []);

  return null;
}