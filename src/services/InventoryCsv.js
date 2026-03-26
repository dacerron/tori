/** @typedef {{ id: string, name: string, makeModel: string, serial: string, description: string, storageLocation: string, assignedEmployee: string, assignedProject: string, thumbnail: string }} CsvItemRow */

export const INVENTORY_CSV_HEADERS = [
  'id',
  'name',
  'makeModel',
  'serial',
  'description',
  'storageLocation',
  'assignedEmployee',
  'assignedProject',
  'thumbnail',
]

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let i = 0
  let inQuotes = false
  while (i < text.length) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += c
      i++
      continue
    }
    if (c === '"') {
      inQuotes = true
      i++
      continue
    }
    if (c === ',') {
      row.push(field)
      field = ''
      i++
      continue
    }
    if (c === '\r') {
      i++
      continue
    }
    if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i++
      continue
    }
    field += c
    i++
  }
  row.push(field)
  if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
    rows.push(row)
  }
  return rows
}

function escapeCsvField(value) {
  const s = value == null ? '' : String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export class InventoryCsv {
  /**
   * @param {string} text - UTF-8 CSV body
   * @returns {CsvItemRow[]}
   */
  static parse(text) {
    const rows = parseCsv(text.replace(/^\uFEFF/, ''))
    if (rows.length === 0) {
      throw new Error('inventory.csv is empty.')
    }
    const header = rows[0].map((h) => h.trim())
    if (
      header.length !== INVENTORY_CSV_HEADERS.length ||
      INVENTORY_CSV_HEADERS.some((h, idx) => header[idx] !== h)
    ) {
      throw new Error(
        `The first row must be exactly: ${INVENTORY_CSV_HEADERS.join(',')}`,
      )
    }
    /** @type {CsvItemRow[]} */
    const out = []
    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r]
      const pad = (idx) => (cells[idx] != null ? String(cells[idx]) : '')
      const row = {
        id: pad(0),
        name: pad(1),
        makeModel: pad(2),
        serial: pad(3),
        description: pad(4),
        storageLocation: pad(5),
        assignedEmployee: pad(6),
        assignedProject: pad(7),
        thumbnail: pad(8),
      }
      const allEmpty = Object.values(row).every((v) => !String(v).trim())
      if (allEmpty) continue
      out.push(row)
    }
    return out
  }

  /**
   * @param {Array<{ id: string, name: string, makeModel: string, serial: string, description: string, storageLocation: string, assignedEmployee: string, assignedProject: string, thumbnailPath: string }>} items
   * @returns {string}
   */
  static serialize(items) {
    const lines = [INVENTORY_CSV_HEADERS.join(',')]
    for (const item of items) {
      const cells = [
        item.id,
        item.name,
        item.makeModel,
        item.serial,
        item.description,
        item.storageLocation,
        item.assignedEmployee,
        item.assignedProject,
        item.thumbnailPath ?? '',
      ]
      lines.push(cells.map(escapeCsvField).join(','))
    }
    return lines.join('\r\n')
  }
}
