import { useInventory } from '../context/InventoryContext.jsx'
import './ItemList.css'

export function ItemList() {
  const { items, selectedId, selectItem } = useInventory()

  if (!items.length) {
    return (
      <div className="item-list item-list--empty">
        <p className="item-list__empty">No items yet. Tap New or import a ZIP.</p>
      </div>
    )
  }

  return (
    <div className="item-list">
      <p className="item-list__label" id="item-list-label">
        Items
      </p>
      <div
        className="item-list__strip"
        role="listbox"
        aria-labelledby="item-list-label"
        aria-activedescendant={selectedId ? `item-${selectedId}` : undefined}
      >
        {items.map((item) => {
          const selected = item.id === selectedId
          return (
            <button
              key={item.id}
              type="button"
              id={`item-${item.id}`}
              role="option"
              aria-selected={selected}
              className={`item-list__card${selected ? ' item-list__card--selected' : ''}`}
              onClick={() => selectItem(item.id)}
            >
              <span className="item-list__thumb-wrap">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="item-list__thumb"
                  />
                ) : (
                  <span className="item-list__thumb-placeholder" aria-hidden>
                    —
                  </span>
                )}
              </span>
              <span className="item-list__name">
                {item.name.trim() || 'Untitled'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
