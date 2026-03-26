import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react'
import { getDuplicateSerialGroups, newEmptyItem } from '../inventoryUtils.js'

/**
 * @typedef {import('../services/inventoryBundle.js').InventoryItem} InventoryItem
 */

/** @typedef {{ items: InventoryItem[], selectedId: string | null }} InventoryState */

function revokeIfBlobUrl(url) {
  if (url && String(url).startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

/** @param {InventoryState} state */
function revokeAllThumbnails(state) {
  for (const p of state.items) {
    revokeIfBlobUrl(p.thumbnailUrl)
  }
}

/**
 * @param {InventoryState} state
 * @param {unknown} action
 * @returns {InventoryState}
 */
function inventoryReducer(state, action) {
  switch (action.type) {
    case 'replaceAll': {
      revokeAllThumbnails(state)
      const items = action.items
      return {
        items,
        selectedId: items[0]?.id ?? null,
      }
    }
    case 'add': {
      const item = newEmptyItem()
      return {
        items: [...state.items, item],
        selectedId: item.id,
      }
    }
    case 'update': {
      const { id, patch } = action
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.id !== id) return item
          if (
            Object.prototype.hasOwnProperty.call(patch, 'thumbnailUrl') &&
            patch.thumbnailUrl !== item.thumbnailUrl
          ) {
            revokeIfBlobUrl(item.thumbnailUrl)
          }
          return { ...item, ...patch }
        }),
      }
    }
    case 'deleteSelected': {
      const sel = state.selectedId
      if (!sel) return state
      const idx = state.items.findIndex((i) => i.id === sel)
      if (idx === -1) {
        return { ...state, selectedId: state.items[0]?.id ?? null }
      }
      const removed = state.items[idx]
      if (removed) revokeIfBlobUrl(removed.thumbnailUrl)
      const nextItems = state.items.filter((i) => i.id !== sel)
      const nextSelected =
        nextItems.length === 0
          ? null
          : nextItems[Math.min(idx, nextItems.length - 1)].id
      return { items: nextItems, selectedId: nextSelected }
    }
    case 'select': {
      return { ...state, selectedId: action.id }
    }
    default:
      return state
  }
}

/** @type {React.Context<null | { items: InventoryItem[], selectedId: string | null, selectedItem: InventoryItem | null, duplicateSerialGroups: { serial: string, ids: string[] }[], selectItem: (id: string | null) => void, addItem: () => void, updateItem: (id: string, patch: Partial<InventoryItem>) => void, deleteSelectedItem: () => void, replaceInventory: (items: InventoryItem[]) => void }>} */
const InventoryContext = createContext(null)

export function InventoryProvider({ children }) {
  const [state, dispatch] = useReducer(inventoryReducer, {
    items: [],
    selectedId: null,
  })

  const { items, selectedId } = state

  const duplicateSerialGroups = useMemo(
    () => getDuplicateSerialGroups(items),
    [items],
  )

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  )

  const selectItem = useCallback((id) => {
    dispatch({ type: 'select', id })
  }, [])

  const replaceInventory = useCallback((nextItems) => {
    dispatch({ type: 'replaceAll', items: nextItems })
  }, [])

  const addItem = useCallback(() => {
    dispatch({ type: 'add' })
  }, [])

  const updateItem = useCallback((id, patch) => {
    dispatch({ type: 'update', id, patch })
  }, [])

  const deleteSelectedItem = useCallback(() => {
    dispatch({ type: 'deleteSelected' })
  }, [])

  const value = useMemo(
    () => ({
      items,
      selectedId,
      selectedItem,
      duplicateSerialGroups,
      selectItem,
      addItem,
      updateItem,
      deleteSelectedItem,
      replaceInventory,
    }),
    [
      items,
      selectedId,
      selectedItem,
      duplicateSerialGroups,
      selectItem,
      addItem,
      updateItem,
      deleteSelectedItem,
      replaceInventory,
    ],
  )

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) {
    throw new Error('useInventory must be used within InventoryProvider')
  }
  return ctx
}
