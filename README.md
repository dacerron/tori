# Equipment Inventory App

Camera-first equipment inventory web app built with `Vite + React (JavaScript)`.

## What the app does

- Manages an in-memory inventory of equipment items.
- Lets you create, select, edit, and delete items.
- Captures thumbnails from the camera or accepts image file upload fallback.
- Imports inventory from a ZIP bundle and replaces current in-memory state.
- Exports inventory to a ZIP bundle for later re-import.

## Current behavior

- **State model:** inventory is managed through React Context (`InventoryProvider` + `useInventory`).
- **Persistence:** no automatic persistence between sessions; refreshing/closing clears state.
- **Duplicate serial handling:** duplicate non-empty serials are shown as warnings (not blocking).
- **Validation policy:** `name` is required before export; other fields are optional.
- **Import format (v1):**
  - ZIP only
  - must include `inventory.csv` at ZIP root
  - `thumbnail` values point to relative file paths inside the same ZIP
  - successful import replaces all current in-memory inventory items
- **Export format (v1):**
  - single ZIP download
  - root contains `inventory.csv`
  - thumbnails written under `images/`
  - export images are JPEG with max height `720px`, aspect ratio preserved, no upscale
  - JPEG quality is fixed by a single constant (`0.85` by default)

## CSV contract (`inventory.csv`)

Header row must match this exact order:

1. `id`
2. `name`
3. `makeModel`
4. `serial`
5. `description`
6. `storageLocation`
7. `assignedEmployee`
8. `assignedProject`
9. `thumbnail`

## Tech stack

- `React` (function components + hooks)
- `Vite`
- `JSZip` for browser ZIP import/export
- Plain `.css` styling (no third-party UI design system)

## Setup

### Prerequisites

- `Node.js` 20+ recommended
- `npm` (bundled with Node.js)

### Install

```bash
npm install
```

### Run development server

```bash
npm run dev
```

Then open the local URL shown in the terminal (usually `http://localhost:5173`).

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Browser notes

- v1 target is latest Google Chrome.
- Camera capture requires HTTPS on non-localhost deployments.

## Project docs

- Product/technical spec: `docs/equipment-inventory-spec.md`
