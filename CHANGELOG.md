# Changelog

## 0.4.0 — Tables & Interactivity

### Table totals

- `totalRow`: grand-total row over the filtered data (all pages) — `true` sums numeric columns, or `{ label, fns }` for per-column aggregate fns. Sticky when `maxHeight` is set.
- `totalColumn`: per-row total column — `true` sums numeric visible columns, or `{ label, columns }`.
- Totals are display-only (CSV/clipboard exports contain data rows only).

### Row detail modals

- `rowModal: true`: double-click a row (or right-click → Open details) to open a built-in modal listing the row's values (`rowModalColumns`, `rowModalTitle` to customize).
- `rowModalId`: open a **custom modal** from `modals` instead; cards inside can use `{{ row.ColumnName }}` templates (full template engine, e.g. `{{ formatCurrency(row.amount) }}`).

### Persistent view state

- Runtime changes (table sort / hidden columns / grouping, tabs active tab) are saved to localStorage per report + visual `id` and restored on reload. Opt out with `persistState: false`.
- Per-visual reset: right-click header → **Reset view**. Report-wide reset: **Reset view** button in the headbar (appears only when the report has saved customizations).
- Reports are namespaced by `<meta name="report-id">` (falls back to title, then path).

### Links & navigation

- Every visual with an `id` is now a DOM anchor.
- New `link` visual (`targetId` or external `href`, `linkStyle: 'link' | 'button'`): switches to the containing page, activates containing tabs (nested included), scrolls to the visual, flashes it.
- Plain `#visual-id` hash links navigate too (markdown cards, deep links on page load).

### Validation

- New warnings: duplicate visual ids, unknown `rowModalId`, unknown link `targetId`, `rowModalColumns` column checks.
- Dataset `id` auto-fills from the datasets dictionary key.

### Housekeeping

- Dev CDN server and all test pages unified on port 8080.

## 0.3.0 — Breaking Update

Large usability release: layout fixes, per-visual filtering/aggregation, derived datasets, a tabs container visual, a table UX overhaul, and config validation.

### ⚠ Breaking rendering changes

Existing configs remain **functional**, but some rendering defaults changed (for the better):

1. **Spacing is now owned by layouts.** Row/column layouts default to `gap: 10px` (previously 0), and visuals default to `margin: 0` (previously 10). Reports that relied on the old implicit visual margins will show slightly different spacing; explicit `margin`/`gap` values are honored as before.
2. **`flex: 0` is respected.** Previously `flex: 0` on a child was silently coerced to `1`; now it keeps the element at its natural size.
3. **`padding: 0` / `margin: 0` work.** Previously zero values were coerced to the defaults.
4. **Layout titles render above the content** in all directions (previously they participated in the flex/grid flow).
5. **Untyped config objects with a `children` array render as layouts** instead of "Unknown component type: undefined".
6. **Grouped tables paginate by groups** (pageSize = groups per page while grouped).

### New: Layout system

- `wrap`, `align`, `justify` for row/column layouts.
- `minChildWidth` for responsive grids (`repeat(auto-fit, minmax(...))`).
- Layout `flex` is honored (previously ignored).
- Reliable nested-layout recursion regardless of `type` / `elementType` convention.

### New: Filtering & aggregation

- `filter` and `aggregate` props on any visual — several visuals can show different slices of one shared dataset, entirely client-side.
- JSON filter grammar: `eq/neq/gt/gte/lt/lte/in/nin/contains/startsWith/endsWith/between/isNull/notNull` with `and`/`or`/`not` composition; date-aware comparisons.
- Aggregates: `sum/avg/min/max/count/countDistinct/first/last` with `groupBy`.
- **Derived datasets**: a dataset may declare `source` (+ `filter`/`aggregate`) to be computed from another dataset at load time; chains supported, cycles warned.

### New: Tabs container visual

- `type: "tabs"` (alias `"tabgroup"`): a registered visual that holds tabs of arbitrary layouts/visuals. Works in rows, grids, and nested inside other tab groups.

### New: Table UX

- Type-aware sorting (numbers, dates, natural strings; nulls last); Shift+click multi-column sort with priority indicators.
- Column hide/show (config `hiddenColumns` + runtime Columns menu).
- Grouping with collapsible groups and per-group aggregates (config `groupBy`/`groupAggregates` or right-click → Group by).
- CSV export and clipboard copy (TSV) of the current filtered/sorted view.
- Right-click context menus on headers (sort/hide/group/export) and cells (copy cell/row).
- Sticky header + scrollable body via `maxHeight`.
- All previous props/behavior preserved; set `contextMenu: false`, `enableExport: false`, `allowColumnHiding: false`, `sortable: false` to fully restore the old behavior.

### New: Config validation

- On load, the config is validated and helpful `[datalys2]` console warnings are emitted for unknown visual types, missing datasets, bad column names, invalid filter ops, empty layouts, etc. Opt out with `<meta name="dl2-validate" content="false">`.
- Dataset `id` is auto-filled from the datasets dictionary key when omitted.

### Internal

- Shared `VisualContainer` component and `useDataset` hook; central `DataScope` wrapper applies per-visual filters with zero per-visual changes.
- New utilities: `filter-utility`, `aggregate-utility`, `sort-utility`, `export-utility`, `element-utility`, `validation-utility`; reusable `ContextMenu` and `TabStrip` components.
- New test pages: `test-layouts.html`, `test-filters.html`, `test-tabs.html`, `test-table-features.html`.
