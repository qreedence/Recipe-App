import { db } from "./db";

async function buildExportData() {
  const [recipes, shoppingItems] = await Promise.all([
    db.recipes.toArray(),
    db.shoppingItems.toArray(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    recipes,
    shoppingItems,
  };
}

export async function exportDatabase() {
  const data = await buildExportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const file = new File([blob], `recipe-backup-${Date.now()}.json`, {
    type: "application/json",
  });

  let canShare = false;
  try {
    canShare = !!navigator.canShare?.({ files: [file] });
  } catch {
    // Some browsers throw instead of returning false
  }

  if (canShare) {
    try {
      await navigator.share({ title: "Recipe Book Backup", files: [file] });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return; // User cancelled the share sheet, not an error
      }
      // Gesture expired or other error — fall through to download
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
  localStorage.setItem("lastExportedAt", new Date().toISOString());
}