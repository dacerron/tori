import { useRef, useState } from 'react'
import { InventoryZip } from '../services/InventoryZip.js'
import { everyItemHasName } from '../inventoryUtils.js'
import { useInventory } from '../context/InventoryContext.jsx'
import './Toolbar.css'

export function Toolbar() {
  const importInputRef = useRef(null)
  const [message, setMessage] = useState(null)
  const [messageKind, setMessageKind] = useState('info')
  const { items, replaceInventory, addItem, deleteSelectedItem, selectedId } =
    useInventory()

  const showMessage = (text, kind = 'info') => {
    setMessage(text)
    setMessageKind(kind)
  }

  const onImportClick = () => {
    importInputRef.current?.click()
  }

  const onImportChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.zip')) {
      showMessage('Please choose a .zip file.', 'error')
      return
    }
    try {
      const imported = await InventoryZip.importFile(file)
      replaceInventory(imported)
      showMessage(
        imported.length
          ? `Imported ${imported.length} item(s).`
          : 'ZIP contained no data rows.',
        'success',
      )
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : 'Import failed.',
        'error',
      )
    }
  }

  const onExport = async () => {
    if (!items.length) {
      showMessage('Nothing to export.', 'error')
      return
    }
    if (!everyItemHasName(items)) {
      showMessage('Every item needs a name before export.', 'error')
      return
    }
    try {
      const blob = await InventoryZip.buildExportBlob(items)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'inventory-export.zip'
      a.click()
      URL.revokeObjectURL(url)
      showMessage('Export downloaded.', 'success')
    } catch (err) {
      showMessage(
        err instanceof Error ? err.message : 'Export failed.',
        'error',
      )
    }
  }

  return (
    <div className="toolbar-wrap">
      <div
        className="toolbar"
        role="toolbar"
        aria-label="Inventory actions"
      >
        <button type="button" className="toolbar__btn" onClick={addItem}>
          New
        </button>
        <button
          type="button"
          className="toolbar__btn"
          onClick={onImportClick}
        >
          Import ZIP
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept=".zip,application/zip"
          className="toolbar__file"
          aria-hidden
          tabIndex={-1}
          onChange={onImportChange}
        />
        <button
          type="button"
          className="toolbar__btn"
          onClick={onExport}
          disabled={!items.length}
        >
          Export ZIP
        </button>
        <button
          type="button"
          className="toolbar__btn toolbar__btn--danger"
          onClick={deleteSelectedItem}
          disabled={!selectedId}
        >
          Delete
        </button>
      </div>
      {message ? (
        <p
          className={`toolbar__msg toolbar__msg--${messageKind}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
