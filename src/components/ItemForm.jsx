import { useInventory } from '../context/InventoryContext.jsx'
import './ItemForm.css'

const fields = [
  { key: 'name', label: 'Name', required: true, multiline: false },
  { key: 'makeModel', label: 'Make / model', required: false, multiline: false },
  { key: 'serial', label: 'Serial', required: false, multiline: false },
  {
    key: 'description',
    label: 'Description',
    required: false,
    multiline: true,
  },
  {
    key: 'storageLocation',
    label: 'Storage location',
    required: false,
    multiline: false,
  },
  {
    key: 'assignedEmployee',
    label: 'Assigned employee',
    required: false,
    multiline: false,
  },
  {
    key: 'assignedProject',
    label: 'Assigned project',
    required: false,
    multiline: false,
  },
]

export function ItemForm() {
  const { selectedItem, updateItem } = useInventory()

  if (!selectedItem) {
    return (
      <div className="item-form item-form--empty">
        <p className="item-form__hint">
          Select an item from the strip or create one with New.
        </p>
      </div>
    )
  }

  const onChange = (key) => (e) => {
    updateItem(selectedItem.id, { [key]: e.target.value })
  }

  return (
    <form className="item-form" onSubmit={(e) => e.preventDefault()}>
      <h2 className="item-form__heading">Details</h2>
      {fields.map(({ key, label, required, multiline }) =>
        multiline ? (
          <label key={key} className="item-form__field">
            <span className="item-form__label">
              {label}
              {required ? (
                <span className="item-form__req" aria-hidden>
                  {' '}
                  *
                </span>
              ) : null}
            </span>
            <textarea
              className="item-form__input item-form__textarea"
              rows={3}
              value={selectedItem[key]}
              onChange={onChange(key)}
              autoComplete="off"
            />
          </label>
        ) : (
          <label key={key} className="item-form__field">
            <span className="item-form__label">
              {label}
              {required ? (
                <span className="item-form__req" aria-hidden>
                  {' '}
                  *
                </span>
              ) : null}
            </span>
            <input
              className="item-form__input"
              type="text"
              value={selectedItem[key]}
              onChange={onChange(key)}
              autoComplete="off"
            />
          </label>
        ),
      )}
    </form>
  )
}
