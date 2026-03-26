import JSZip from 'jszip'
import { InventoryCsv } from './InventoryCsv.js'
import { loadInventoryFromBundle } from './inventoryBundle.js'
import { urlToExportJpegBlob } from './imageExport.js'

function normalizeBundleRelativePath(relativePath) {
  return relativePath.replace(/\\/g, '/').replace(/^\.\//, '')
}

export class InventoryZip {
  /**
   * @param {File} file
   * @returns {Promise<import('./inventoryBundle.js').InventoryItem[]>}
   */
  static async importFile(file) {
    const buffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(buffer)
    const csvEntry = zip.file('inventory.csv')
    if (!csvEntry) {
      throw new Error(
        'This ZIP must include a file named inventory.csv at the root of the archive.',
      )
    }
    const csvText = await csvEntry.async('string')
    return loadInventoryFromBundle({
      csvText,
      async resolveImage(relativePath) {
        const path = normalizeBundleRelativePath(relativePath)
        const entry = zip.file(path)
        if (!entry) return null
        return entry.async('blob')
      },
    })
  }

  /**
   * @param {import('./inventoryBundle.js').InventoryItem[]} items
   * @returns {Promise<Blob>}
   */
  static async buildExportBlob(items) {
    const zip = new JSZip()
    const rowsForCsv = []

    for (const item of items) {
      let thumbnailPath = ''
      if (item.thumbnailUrl) {
        const jpegBlob = await urlToExportJpegBlob(item.thumbnailUrl)
        const safeId = item.id.replace(/[^a-zA-Z0-9_-]/g, '_')
        thumbnailPath = `images/${safeId}.jpg`
        zip.file(thumbnailPath, jpegBlob)
      }
      rowsForCsv.push({
        id: item.id,
        name: item.name,
        makeModel: item.makeModel,
        serial: item.serial,
        description: item.description,
        storageLocation: item.storageLocation,
        assignedEmployee: item.assignedEmployee,
        assignedProject: item.assignedProject,
        thumbnailPath,
      })
    }

    const csvText = InventoryCsv.serialize(rowsForCsv)
    zip.file('inventory.csv', csvText)
    return zip.generateAsync({ type: 'blob' })
  }
}
