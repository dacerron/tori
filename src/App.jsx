import { DuplicateSerialBanner } from './components/DuplicateSerialBanner.jsx'
import { Toolbar } from './components/Toolbar.jsx'
import { CameraPanel } from './components/CameraPanel.jsx'
import { ItemList } from './components/ItemList.jsx'
import { ItemForm } from './components/ItemForm.jsx'
import { useInventory } from './context/InventoryContext.jsx'
import './App.css'

function AppContent() {
  const { duplicateSerialGroups } = useInventory()

  return (
    <>
      <Toolbar />
      <DuplicateSerialBanner groups={duplicateSerialGroups} />
      <div className="app__body">
        <div className="app__camera">
          <CameraPanel />
        </div>
        <aside className="app__side">
          <ItemList />
          <ItemForm />
        </aside>
      </div>
    </>
  )
}

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Equipment inventory</h1>
      </header>
      <AppContent />
    </div>
  )
}
