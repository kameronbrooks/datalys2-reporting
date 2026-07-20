# Plan — 0.4.1 "Tables Everywhere" ✅ SHIPPED 2026-07-20

> Implemented as planned (chart export stretch goal deferred to 0.5.0 candidates).
> See CHANGELOG.md 0.4.1 for the released feature list.

Theme: bring the checklist up to par with the 0.3/0.4 table work, and add the two
formatting features that make tables (and checklists) presentation-ready. All three
features reuse existing infrastructure (`useDataset`, `VisualContainer`, `sort-utility`,
`filter-utility`, `state-persistence`, `ContextMenu`, `export-utility`, template formatters).

Design principle (applies to this and future releases): datalys2 is a **presentation
layer**. Visuals never mutate data — the checklist stays read-only; no interactive
check-off. Completion state always comes from the dataset.

---

## 1. Checklist overhaul

`src/components/visuals/Checklist.tsx` is a fork of the pre-0.3 table: it hand-rolls
dataset normalization, container styling, naive string sorting, and pagination.
Rebuild it on the shared infrastructure, then layer checklist-specific UX on top.

### 1a. Re-platform (parity with Table)

- Replace hand-rolled normalization with `useDataset` hook; replace the inline
  container div with `VisualContainer`.
- Type-aware sorting via `sort-utility` (`compareValues` / `multiSort`) — the current
  sort compares raw values, so numbers/dates/nulls sort wrongly. Support Shift+click
  multi-column sort with priority indicators, same as Table.
- Column hide/show: `hiddenColumns` config prop + runtime Columns menu.
- Right-click context menus (shared `ContextMenu`): header → sort / hide / export;
  cell → copy cell / copy row / open details.
- CSV export + clipboard copy (TSV) of the current filtered/sorted view
  (`enableExport`, `exportFileName`). Export includes a derived `Status` column.
- Sticky header + scrollable body via `maxHeight` / `stickyHeader`.
- Row detail modals: `rowModal`, `rowModalId`, `rowModalColumns`, `rowModalTitle` —
  same behavior as Table (double-click / right-click → Open details, `{{ row.X }}`
  templates for custom modals).
- Persistent view state via `state-persistence` (`persistState`, default true):
  sort keys, hidden columns, active status filter, hide-completed toggle. Right-click
  header → Reset view; participates in the report-wide Reset view button.
- Validation: extend `validation-utility` checks to checklist props
  (`statusColumn` / `warningColumn` / `columns` existence, `rowModalId` known).

### 1b. Checklist-specific UX

- **Status filter chips** above the table: All / Pending / Due Soon / Overdue /
  Complete, each with a count. Clicking filters rows; active chip persisted.
- **Progress bar** next to the "12 / 40 Completed" summary (thin bar, completion %).
- **Default sort by urgency**: overdue first (most overdue at top), then due-soon by
  due date, then pending, complete last. Explicit user sort overrides. Expose as
  `defaultSort` like Table, with `'status'` as a sortable pseudo-column.
- **Status as a first-class column**: the checkbox column gets a header ("Status"),
  is sortable (urgency order), and renders the existing badge styling.
- **Hide-completed** convenience: config prop `hideCompleted?: boolean` for initial
  state; runtime toggle via the Complete chip.
- Read-only stays: checkbox remains `readOnly`; no `interactive` mode (see design
  principle above).

## 2. Per-column formatting (`columnFormats`) — Table + Checklist

New prop on Table and Checklist:

```json
"columnFormats": {
  "amount":  { "format": "currency", "symbol": "$", "digits": 0 },
  "rate":    { "format": "percent", "digits": 1 },
  "created": { "format": "date" }
}
```

- Formats: `number | currency | percent | date | hms` — same enum as the Card/KPI
  `format` prop; implement by reusing the `formatNumber` / `formatCurrency` /
  `formatPercent` helpers already exposed to the template engine (extract into a
  shared `format-utility` if needed so Card/KPI/Table share one code path).
- Applies to: body cells, total row, total column, group aggregate rows.
- CSV export exports **raw values** (unchanged); clipboard copy copies formatted
  display values (matches what the user sees).
- Validation: warn on unknown column names and unknown format kinds.

## 3. Conditional formatting (`conditionalFormats`) — Table + Checklist

New prop:

```json
"conditionalFormats": [
  { "when": { "column": "amount", "gt": 10000 }, "style": "success" },
  { "when": { "column": "region", "eq": "EU" }, "target": "row", "style": "info" },
  { "when": { "column": "margin", "lt": 0 }, "css": { "color": "var(--dl2-error)", "fontWeight": 600 } }
]
```

- `when` is the existing JSON filter grammar — evaluate per row with
  `filter-utility` (no new condition language).
- `target`: `'cell'` (default — the rule's `column`, or explicit `columns: []`) or
  `'row'`.
- Styling: named presets `success | warning | error | info | muted` (new
  `dl2-cf-*` CSS classes using existing CSS vars) or an inline `css` object.
  First matching rule wins per target; row rules and cell rules compose.
- Applies to data rows only (not totals/aggregate rows) in v1.
- Validation: warn on bad columns, bad filter ops, unknown preset names.

## 4. Stretch (only if the release feels thin): chart PNG/SVG export

- Charts are SVG; add "Save as SVG / PNG" via context menu on chart visuals.
  SVG: serialize + inline computed CSS vars. PNG: draw serialized SVG to canvas.
- If deferred, it slots into 0.5.0.

---

## Test & docs checklist

- Extend `test-table-features.html` with `columnFormats` + `conditionalFormats` cases.
- New `test-checklist.html` exercising: chips, urgency sort, hidden columns, export,
  row modals (built-in + custom), persistState + reset, `maxHeight`, formats.
- Update `test-all-visuals.html` and `test.html` checklist examples.
- DOCUMENTATION.md: rewrite the Checklist section (parity table with Table props),
  add `columnFormats` / `conditionalFormats` to Table + Checklist sections.
- CHANGELOG.md entry; version bump to 0.4.1; rebuild `dist/`.
- Note any old-behavior escape hatches (e.g. `contextMenu: false` etc. now apply to
  checklist too).
