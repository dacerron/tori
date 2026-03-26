import { InventoryCsv } from './InventoryCsv.js'

/**
 * @typedef {Object} InventoryItem
 * @property {string} id
 * @property {string} name
 * @property {string} makeModel
 * @property {string} serial
 * @property {string} description
 * @property {string} storageLocation
 * @property {string} assignedEmployee
 * @property {string} assignedProject
 * @property {string | null} thumbnailUrl
 */

/**
 * Shared loader for ZIP (v1) and future loose CSV + folder flows.
 * @param {{ csvText: string, resolveImage: (relativePath: string) => Promise<Blob | null | undefined> }} bundle
 * @returns {Promise<InventoryItem[]>}
 */
export async function loadInventoryFromBundle({ csvText, resolveImage }) {
  const rows = InventoryCsv.parse(csvText)
  /** @type {InventoryItem[]} */
  const items = []
  for (const row of rows) {
    const id = row.id.trim() || crypto.randomUUID()
    let thumbnailUrl = null
    const thumbPath = row.thumbnail.trim()
    if (thumbPath) {
      const blob = await resolveImage(thumbPath)
      if (blob) {
        thumbnailUrl = URL.createObjectURL(blob)
      }
    }
    items.push({
      id,
      name: row.name,
      makeModel: row.makeModel,
      serial: row.serial,
      description: row.description,
      storageLocation: row.storageLocation,
      assignedEmployee: row.assignedEmployee,
      assignedProject: row.assignedProject,
      thumbnailUrl,
    })
  }
  return items
}
