import useSWR, { mutate as globalMutate } from "swr"
import {
  getShoppingItems,
  addShoppingItems as storageAdd,
  updateShoppingItem as storageUpdate,
  deleteShoppingItem as storageDelete,
  clearCheckedItems as storageClearChecked,
  clearAllShoppingItems as storageClearAll,
} from "@/lib/sync/shopping-sync"
import { ShoppingItem } from "@/lib/types"

const KEY_PREFIX = "shopping-items"

function keyFor(listId?: string) {
  return listId ? [KEY_PREFIX, listId] : KEY_PREFIX
}

export function useShoppingItems(listId?: string) {
  const { data, error, isLoading } = useSWR(
    keyFor(listId),
    () => getShoppingItems(listId),
    {
      fallbackData: [],
      revalidateOnFocus: true,
    },
  )

  return {
    items: data ?? [],
    isLoading,
    error,
  }
}

async function revalidate() {
  await globalMutate(
    (key) => key === KEY_PREFIX || (Array.isArray(key) && key[0] === KEY_PREFIX),
  )
}

export async function addItemsAndRevalidate(items: ShoppingItem[], listId?: string) {
  await storageAdd(items, listId)
  await revalidate()
}

export async function updateItemAndRevalidate(id: string, updates: Partial<ShoppingItem>) {
  await storageUpdate(id, updates)
  await revalidate()
}

export async function deleteItemAndRevalidate(id: string) {
  await storageDelete(id)
  await revalidate()
}

export async function clearCheckedAndRevalidate(listId?: string) {
  await storageClearChecked(listId)
  await revalidate()
}

export async function clearAllAndRevalidate(listId?: string) {
  await storageClearAll(listId)
  await revalidate()
}
