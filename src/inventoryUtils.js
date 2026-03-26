/**
 * @param {Array<{ id: string, serial: string }>} items
 * @returns {{ serial: string, ids: string[] }[]}
 */
export function getDuplicateSerialGroups(items) {
  const map = new Map()
  for (const item of items) {
    const s = item.serial.trim()
    if (!s) continue
    if (!map.has(s)) map.set(s, [])
    map.get(s).push(item.id)
  }
  return [...map.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([serial, ids]) => ({ serial, ids }))
}

/**
 * @param {Array<{ name: string }>} items
 * @returns {boolean}
 */
export function everyItemHasName(items) {
  return items.every((i) => i.name.trim().length > 0)
}

function newEmptyItem() {
  return {
    id: crypto.randomUUID(),
    name: '',
    makeModel: '',
    serial: '',
    description: '',
    storageLocation: '',
    assignedEmployee: '',
    assignedProject: '',
    thumbnailUrl: null,
  }
}

export { newEmptyItem }
