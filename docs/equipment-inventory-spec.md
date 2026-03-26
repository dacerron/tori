# Equipment inventory application — product & technical spec

This document records decisions for a **Vite + React (JavaScript)** equipment inventory app: **camera-first UI**, **ZIP-based import/export**, **plain CSS** (no third-party design/UI libraries), and **inventory state via React Context** (not only lifted state from a single parent).

---

## 1. Tech stack & code organization

| Decision | Choice |
|----------|--------|
| Runtime / bundler | Node.js, **Vite** |
| UI library | **React** (function components + hooks for UI) |
| Styling | **`.css` files** only; no Tailwind, MUI, Chakra, etc. |
| Non-UI logic | **Classes** encouraged where appropriate (e.g. CSV/ZIP services, domain models) |
| Inventory state | **React Context** (`InventoryProvider` + `useInventory` hook) |

### 1.1 Development, deployment, and browser support

| Topic | Decision |
|-------|----------|
| **Local development** | **`npm run dev`** (Vite dev server) for now. |
| **Future hosting** | **Static hosting** (e.g. **GitHub Pages**). Production build is a static site (`vite build`); configure Vite **`base`** to the repo path if the app is served from a subpath (e.g. `https://user.github.io/repo-name/`). |
| **HTTPS** | Required for **camera** (`getUserMedia`) on non-`localhost` origins. GitHub Pages serves over HTTPS, which satisfies this. |
| **Browser support (v1)** | **Latest Google Chrome** only; no commitment to Safari/Firefox/Edge for the initial implementation. |

---

## 2. Data contracts

### 2.1 In-memory item shape

Each inventory row maps to an item with at least:

| Field | Notes |
|-------|--------|
| `id` | Stable internal identifier (e.g. UUID) |
| `name` | **Required** |
| `makeModel` | Single text field (make + model combined) |
| `serial` | Should be **unique** when non-empty; app **warns** on duplicates |
| `description` | Short description |
| `storageLocation` | Text |
| `assignedEmployee` | Text |
| `assignedProject` | Text |
| Thumbnail | Held in memory for UI (e.g. object URL or data URL derived from imported image or camera capture); **not** persisted across sessions |

Exact storage type for thumbnails in memory is an implementation detail; export must write binary files under `images/` and set `thumbnail` in CSV accordingly.

### 2.2 Export archive (ZIP)

- **Single `.zip` file** is the export artifact.
- **Root must contain** a file named exactly **`inventory.csv`** (see §3).
- **Images directory:** `images/` at the ZIP root (or paths relative to `inventory.csv` as agreed below—typically `images/<filename>`).
- Every **non-empty** `thumbnail` cell must point to a **relative path** that exists inside the ZIP (same archive).
- Use **safe, unique** filenames under `images/` (e.g. include `id` in the filename) to avoid collisions.

### 2.2.1 Exported images (`images/*`)

Images embedded in the export ZIP are **always JPEG** (e.g. `.jpg` extension in `thumbnail` paths).

| Rule | Value |
|------|--------|
| **Max height** | **720 px** — output image height must not exceed 720 pixels. |
| **Aspect ratio** | **Preserved** (no stretching). |
| **Scaling** | If the source height is **greater than 720 px**, scale **down** so the output height is **720 px** and width is `round(720 × (sourceWidth / sourceHeight))`. If the source height is **already ≤ 720 px**, keep **natural** width and height (do **not** upscale). |
| **Quality** | **Fixed** JPEG quality, implemented as a **single named constant** in code. Documented default: **`0.85`** on the usual Canvas `0–1` scale (adjust only by changing that constant). |

Imported ZIPs may still contain non-JPEG images from older exports or hand-edited archives; import should accept common browser-decodable formats. New exports and re-encoded thumbnails from capture/file follow the rules above.

### 2.3 Import archive (ZIP) — version 1

- Import accepts **only** a **ZIP** file (not a bare CSV in v1).
- The ZIP **must** include **`inventory.csv` at the root**. If missing, fail with a clear error.
- Parse `inventory.csv` with the **locked headers** (§3).
- For each row, if `thumbnail` is non-empty, resolve the file **relative to the location of `inventory.csv` inside the ZIP** (for root-placed CSV, paths are root-relative, e.g. `images/foo.jpg`).
- **Replace behavior:** a successful import **replaces the entire in-memory inventory** with the imported rows (no merge-by-`id` in v1).

### 2.4 Session persistence

- **No** `localStorage` (or other) persistence of inventory **between browser sessions**.
- Closing the tab or refreshing clears in-memory state unless the implementation adds explicit “unsaved” warnings (optional product choice).
- To resume work later, the user **re-imports the same ZIP** (or a new export).

### 2.5 Future extension: loose CSV + images folder

- Not required for v1.
- **Same CSV headers and semantics** as `inventory.csv`.
- Internal architecture should allow a shared loader, e.g. `loadInventoryFromBundle({ csvText, resolveImage(relativePath) })`, where ZIP import implements `resolveImage` from archive entries and a future flow implements it from user-selected files.

---

## 3. CSV contract (`inventory.csv`)

### 3.1 File name and location

- Inside the ZIP, the file name is **always** **`inventory.csv`** at the **root** of the archive.

### 3.2 Header row (exact order)

The first row must be these column names, in order:

1. `id`  
2. `name`  
3. `makeModel`  
4. `serial`  
5. `description`  
6. `storageLocation`  
7. `assignedEmployee`  
8. `assignedProject`  
9. `thumbnail`  

### 3.3 Column semantics

| Column | Semantics |
|--------|-----------|
| `id` | Stable id for the item (round-trips through export/import) |
| `name` | **Required** on create/edit before treating row as valid for export (policy: enforce in UI) |
| `makeModel`, `serial`, `description`, `storageLocation`, `assignedEmployee`, `assignedProject` | Optional text; empty allowed |
| `thumbnail` | **Relative path** from `inventory.csv` to an image file inside the ZIP, e.g. `images/abc.jpg`, or **empty** if no image |

### 3.4 CSV robustness

- Use standard CSV escaping for commas, quotes, and newlines in cells.
- UTF-8 encoding for `inventory.csv`.

### 3.5 Duplicate serials

- After import and while editing, if **non-empty** `serial` values are duplicated across items, the app **warns** (does not need to block import unless product changes later).

---

## 4. Desired user flow

1. **Start** — App loads with an **empty** inventory (or optional empty state messaging).
2. **Import (optional)** — User selects a **ZIP**; inventory is **replaced** with parsed items and images resolved from the archive; show **duplicate-serial warnings** if applicable.
3. **Work** — User creates or selects items, edits text fields, captures or updates thumbnails via **camera** (with file fallback acceptable for no camera / denied permission).
4. **Export** — User downloads a **ZIP** containing `inventory.csv` + `images/` with consistent relative paths.
5. **Continue later** — User **re-imports** that ZIP in a new session; there is **no** automatic restore from previous sessions.

**Validation:** Only **`name`** is required; other fields optional.

---

## 5. UI & layout (responsive)

### 5.1 Principles

- **Camera-first:** the live camera (or preview) is the **dominant** visual element.
- **Works on desktop and phone/tablet** using responsive CSS (no separate apps).
- **Touch-friendly:** primary controls roughly **44×44px** minimum; adequate spacing between tappable list rows.
- **No third-party design libraries**; use semantic HTML and custom CSS.

### 5.2 Viewport

- `index.html` should include a standard viewport meta tag, e.g. `width=device-width, initial-scale=1`.

### 5.3 Breakpoints (initial targets)

| Range | Typical devices |
|-------|----------------|
| **&lt; 640px** | Phones (portrait primary) |
| **640px – 1024px** | Large phones (landscape), small tablets |
| **≥ 1024px** | Tablets (landscape), desktops |

Tune after testing on real hardware.

### 5.4 Layout behavior

**Narrow (stacked)**

1. **Toolbar** — New, Import ZIP, Export ZIP, Delete; sticky top if helpful. Compact or overflow pattern if space is tight.  
2. **Camera panel** — Full width; constrained aspect ratio (e.g. 4:3 or 16:9) and sensible `max-height` so list + form remain reachable.  
3. **Item list** — Thumbnail + name; **horizontal scrolling strip** under the camera is recommended to save vertical space; vertical list is acceptable if preferred.  
4. **Item form** — Full-width fields below.

**Wide (split)**

- **CSS Grid** recommended: e.g. one column ~60% for **camera**, sidebar ~40% for **form** and **scrollable list** (order: form then list, or list then form—pick one and stay consistent).
- Example pattern: `grid-template-columns: 1fr` by default; from **min-width: 1024px**, `1fr minmax(280px, 380px)` (values adjustable).

### 5.5 Component-level CSS notes

- **Video:** `width: 100%`, `height: auto`, `object-fit: cover` inside a wrapper with fixed aspect ratio to reduce layout shift.  
- **Scroll regions:** use `min-height: 0` on flex/grid children that scroll.  
- **Notched devices:** optional `padding` using `env(safe-area-inset-*)` on fixed toolbars.

### 5.6 Major UI regions (conceptual)

- **Toolbar** — global actions.  
- **Camera panel** — stream, capture, optional file input fallback.  
- **Item list** — selection drives the form.  
- **Item form** — all metadata fields as simple text inputs / textarea as needed.

---

## 6. Implementation dependencies (non-UI)

- **ZIP read/write in the browser** requires a small binary-focused library (e.g. JSZip or fflate). This is **not** a design library and is expected for ZIP export/import.

---

## 7. Open items (not yet locked)

These were discussed as optional follow-ups; implement only when decided:

- **Employee / project** fields: stay plain text vs `<datalist>` / recent values without a design system.  
- **Loose CSV import:** when added, whether the file **must** be named `inventory.csv` or only match column schema.  
- **Unsaved changes** warning before close/refresh (optional).

---

## 8. Revision history

| Date | Change |
|------|--------|
| 2025-03-25 | Initial spec from agreed decisions (ZIP contract, CSV headers, Context, responsive layout, validation, no session persistence). |
| 2026-03-25 | Locked dev (`npm run dev`), future GitHub Pages static hosting + Vite `base`, HTTPS note; browser support latest Chrome only; export images: JPEG, max height 720px preserve aspect ratio, fixed quality default 0.85. |
