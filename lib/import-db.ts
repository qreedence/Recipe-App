import { db } from "./db";

interface ImportResult {
  success: true;
  recipesCount: number;
  shoppingItemsCount: number;
}

interface ImportError {
  success: false;
  error: string;
}

export async function importDatabase(
  file: File
): Promise<ImportResult | ImportError> {
  let data: unknown;

  try {
    const text = await file.text();
    data = JSON.parse(text);
  } catch {
    return { success: false, error: "File is not valid JSON." };
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("version" in data) ||
    !("recipes" in data) ||
    !("shoppingItems" in data)
  ) {
    return {
      success: false,
      error: "This doesn't look like a Recipe Book backup.",
    };
  }

  const { version, recipes, shoppingItems } = data as {
    version: unknown;
    recipes: unknown;
    shoppingItems: unknown;
  };

  if (version !== 1) {
    return {
      success: false,
      error: `Unsupported backup version: ${version}`,
    };
  }

  if (!Array.isArray(recipes) || !Array.isArray(shoppingItems)) {
    return {
      success: false,
      error: "Backup data is missing recipes or shopping items.",
    };
  }

  try {
    await db.transaction(
      "rw",
      db.recipes,
      db.shoppingItems,
      async () => {
        await db.recipes.clear();
        await db.shoppingItems.clear();
        await db.recipes.bulkAdd(recipes);
        await db.shoppingItems.bulkAdd(shoppingItems);
      }
    );
  } catch {
    return {
      success: false,
      error: "Something went wrong writing to the database.",
    };
  }

  return {
    success: true,
    recipesCount: recipes.length,
    shoppingItemsCount: shoppingItems.length,
  };
}