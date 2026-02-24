import useSWR, { mutate as globalMutate } from "swr"
import {
  getShoppingItems,
  addShoppingItems as storageAdd,
  updateShoppingItem as storageUpdate,
  deleteShoppingItem as storageDelete,
  clearCheckedItems as storageClearChecked,
  clearAllShoppingItems as storageClearAll,
} from "@/lib/storage"
import { ShoppingItem } from "@/lib/types"

const KEY = "shopping-items"

export function useShoppingItems() {
  const { data, error, isLoading } = useSWR(KEY, getShoppingItems, {
    fallbackData: [],
    revalidateOnFocus: false,
  })

  return {
    items: data ?? [],
    isLoading,
    error,
  }
}

async function revalidate() {
  await globalMutate(KEY)
}

export async function addItemsAndRevalidate(items: ShoppingItem[]) {
  await storageAdd(items)
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

export async function clearCheckedAndRevalidate() {
  await storageClearChecked()
  await revalidate()
}

export async function clearAllAndRevalidate() {
  await storageClearAll()
  await revalidate()
}
