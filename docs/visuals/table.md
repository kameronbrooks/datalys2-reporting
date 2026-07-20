# Table (`type: "table"`)

The Table visual renders a dataset as an interactive data grid. Out of the box it gives your readers type-aware sorting (single and multi-column), text search, pagination, column hiding, row grouping with aggregates, grand totals, CSV export and clipboard copy, right-click context menus, row detail modals, per-column display formats, conditional highlighting, and persistent view state — all driven by the JSON config, with no code.

Everything the user changes at runtime (sort, hidden columns, grouping) is presentation-only: the table never mutates the dataset.

## Minimal example

A complete `report-data` config with one table:

```json
{
    "pages": [
        {
            "title": "Sales",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        { "type": "table", "datasetId": "orders", "title": "Orders" }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "orders": {
            "format": "records",
            "columns": ["date", "region", "rep", "units", "amount"],
            "dtypes": ["date", "str", "str", "int", "float"],
            "data": [
                { "date": "2026-06-01", "region": "West", "rep": "Ana", "units": 12, "amount": 431.5 },
                { "date": "2026-06-02", "region": "East", "rep": "Ben", "units": 3, "amount": 78.25 },
                { "date": "2026-06-03", "region": "West", "rep": "Cody", "units": 21, "amount": 1204.0 },
                { "date": "2026-06-04", "region": "North", "rep": "Ana", "units": 7, "amount": 260.75 }
            ]
        }
    }
}
```

The remaining examples on this page show only the visual object; drop them into any page's `children` array with a matching dataset.

## Properties

The table supports all common visual properties (`datasetId`, `id`, `description`, `filter`, `aggregate`, `padding`, `margin`, `border`, `shadow`, `flex` — see [Visual elements](../visual-elements.md)). Its own properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | `string[]` | all dataset columns | Columns to display, in order. Omit to show every column. |
| `pageSize` | `number` | `10` | Rows per page. **When grouped, this is the number of groups per page** (a large group can still span many rows). |
| `tableStyle` | `'plain' \| 'bordered' \| 'alternating'` | `'plain'` | Visual style of the grid. |
| `showSearch` | `boolean` | `true` | Show the search input above the table. |
| `title` | `string` | — | Optional title rendered above the table. |
| `sortable` | `boolean` | `true` | Enable click-to-sort on headers (and the sort entries in context menus). |
| `defaultSort` | `{column, direction}[]` | `[]` | Initial sort keys in priority order. `direction` is `"asc"` or `"desc"`. |
| `hiddenColumns` | `string[]` | `[]` | Columns hidden initially. Users can re-show them via the **Columns** menu. |
| `allowColumnHiding` | `boolean` | `true` | Show the **Columns** toolbar button and the Hide entry in the header menu. |
| `groupBy` | `string` | — | Group rows by this column initially. Users can also group/ungroup via right-click. |
| `groupAggregates` | `{column, fn, as?}[]` | — | Aggregates shown in each group header row. Fns: `sum`, `avg`, `min`, `max`, `count`, `countDistinct`, `first`, `last`. `as` names the value in the header. |
| `groupsCollapsed` | `boolean` | `false` | Start with all groups collapsed. |
| `enableExport` | `boolean` | `true` | Show the **Export** button and the export/copy context-menu entries. |
| `exportFileName` | `string` | title, else `datasetId`, else `"table"` | File name for the CSV download (`.csv` is appended if missing). |
| `contextMenu` | `boolean` | `true` | Enable the right-click context menus on headers and cells. |
| `maxHeight` | `number` | — | Max body height in px. The body scrolls, and the header becomes sticky by default. |
| `stickyHeader` | `boolean` | `true` when `maxHeight` is set, else `false` | Keep the header row pinned while the body scrolls. |
| `totalRow` | `boolean \| { label?, fns? }` | — | Grand-total row at the bottom. See [Totals](#totals). |
| `totalColumn` | `boolean \| { label?, columns? }` | — | Per-row total column appended on the right. See [Totals](#totals). |
| `rowModal` | `boolean` | `false` | Let users open a row (double-click, or right-click → **Open details**) in a built-in detail modal. |
| `rowModalId` | `string` | — | Open rows in a custom modal from the report's `modals` array instead of the built-in one. Implies `rowModal`. |
| `rowModalColumns` | `string[]` | visible columns | Columns listed in the built-in detail modal. May include any dataset column, including hidden ones. |
| `rowModalTitle` | `string` | `"Details"` | Title of the built-in detail modal. |
| `persistState` | `boolean` | `true` when the visual has an `id` | Persist runtime view changes (sort keys, hidden columns, grouping) in the browser across reloads. See [Persistent view state](../persistent-view-state.md). |
| `columnFormats` | `object` | — | Per-column display formats (`number`, `currency`, `percent`, `date`, `hms`). See [Formatting](../formatting.md). |
| `conditionalFormats` | `object[]` | — | Cell/row highlight rules evaluated per row with the standard filter grammar. See [Formatting](../formatting.md). |

If `columns` is omitted, the column list comes from the dataset's `columns` array, falling back to the keys of the first record.

## Built-in user interactions

### Sorting

- **Click a header** — sorts by that column, cycling ascending → descending → no sort on repeated clicks. Clicking a different column (or clicking while a multi-sort is active) replaces the sort with ascending on that column.
- **Shift+click a header** — adds the column as an additional sort key at the end of the priority list; Shift+click again flips it to descending; a third Shift+click removes it. Each sorted header shows an arrow plus a small priority number when more than one key is active.
- Sorting is **type-aware**: dates sort by time, numbers (and numeric-looking strings, or columns with a numeric `dtype`) sort numerically, booleans false-before-true, and other strings sort case-insensitively with natural number handling (`"item2"` before `"item10"`). Null, undefined, and empty values always sort **last**, in both directions.
- The sort is stable: rows equal on every key keep their relative order.

### Context menus (right-click)

**On a column header:**

| Entry | Notes |
|-------|-------|
| Sort ascending / Sort descending | Replaces the current sort. A check mark shows the active single-column sort. Hidden when `sortable: false`. |
| Clear sort | Disabled when nothing is sorted. |
| Hide "column" | Hidden when `allowColumnHiding: false`; disabled when it is the last visible column. |
| Group by "column" / Ungroup | Toggles grouping on that column. |
| Export CSV / Copy table to clipboard | Hidden when `enableExport: false`. |
| Reset view | Clears saved view state and restores the config-defined defaults (sort, hidden columns, grouping, search, page). |

**On a body cell:**

| Entry | Notes |
|-------|-------|
| Open details | Only when `rowModal`/`rowModalId` is configured. |
| Copy cell | Copies the formatted cell text. |
| Copy row | Copies the visible cells of the row, tab-separated, formatted. |
| Export CSV | Hidden when `enableExport: false`. |

Set `contextMenu: false` to disable both menus entirely.

### Toolbar

- **Search box** — case-insensitive substring match across the **visible** columns (hidden columns are not searched). Typing resets to page 1. The record count on the right always reflects the filtered view (`Showing N records`, or `N groups · M records` when grouped).
- **Columns ▾** — a checklist of every column; check/uncheck to show/hide. You cannot hide the last visible column.
- **Export** — downloads the current view as CSV: search-filtered, sorted, **all pages**, **visible columns only**. Values are raw (numbers unformatted; dates rendered as date text). The file is UTF-8 with a BOM so Excel opens it correctly. **Copy table to clipboard** (in the header menu) instead copies a TSV of the same rows using the on-screen **formatted** values — it pastes cleanly into spreadsheets.

### Grouping

- Group with `groupBy` in the config, or at runtime via right-click → **Group by "column"**. A `Grouped by column ✕` chip appears in the toolbar; click the ✕ (or right-click → Ungroup) to remove it.
- Each group renders a header row: a collapse caret, the group value, the row count, and any `groupAggregates` values. **Click the group header** to collapse/expand that group; `groupsCollapsed: true` starts everything collapsed.
- While grouped, **pagination is by groups**: `pageSize` groups per page, and the pager reads `Page 1 of N (by group)`.
- Aggregate values in group headers are formatted by `columnFormats` when the aggregate's `as` name matches a formatted column name.

### Rows and cells

- **Double-click a row** opens its detail modal when `rowModal`/`rowModalId` is set (the row also gets a pointer cursor and a tooltip).
- `null` and `undefined` values render as empty cells, never as the text "null".
- Dates render in the library's standard date format.

## Totals

### `totalRow`

Adds a grand-total footer row. Totals are computed over the **entire filtered dataset** (every page, after search filtering), not just the visible page.

- `true` — sums every numeric visible column (numeric by `dtype`, falling back to sampling values).
- `{ "label": "Grand Total", "fns": { "amount": "sum", "units": "avg" } }` — aggregate only the listed columns, each with its own function (`sum`, `avg`, `min`, `max`, `count`, `countDistinct`, `first`, `last`). `label` defaults to `"Total"` and appears in the first visible column that has no total value.
- The footer is **sticky** at the bottom of the scroll area when the header is sticky (i.e. when `maxHeight` is set, unless overridden by `stickyHeader`).
- Total values use the matching column's `columnFormats` entry.

### `totalColumn`

Appends a per-row total column on the right.

- `true` — each row's total is the sum of its numeric visible columns.
- `{ "label": "Sum", "columns": ["units", "amount"] }` — sum only the listed columns. `label` defaults to `"Total"`.
- Non-numeric values in a summed column count as 0.
- The total column uses a `columnFormats` format only when **every** summed source column shares the exact same format spec (e.g. all currency with the same digits).
- The bottom-right grand total of the total column renders **only when `totalRow` is also configured** — with `totalColumn` alone there is no footer row.

### Totals are display-only

CSV export and clipboard copy contain data rows only; total rows/columns are never exported. Conditional formats also never apply to total or group-header rows.

## Row detail modals

Two flavors:

1. **Built-in modal** (`rowModal: true`) — a simple two-column view of the row's values. Customize with `rowModalTitle` and `rowModalColumns` (which may include columns hidden from the table). Cell values use `columnFormats`.
2. **Custom modal** (`rowModalId`) — opens a modal you define in the report's top-level `modals` array. Cards inside the modal can reference the clicked row through the `row` template variable: `{{ row.ColumnName }}`, including template functions like `{{ formatCurrency(row.amount) }}`. See [Modals](../modals.md) and [Templates & expressions](../templates-and-expressions.md).

Both open via double-click or right-click → **Open details**. See the [row modal examples](#examples) below.

## Examples

**Basic table**

All columns, defaults everywhere: sortable headers, search, 10 rows per page, export, context menus.

```json
{ "type": "table", "datasetId": "orders", "title": "Orders" }
```

**Styled and paginated**

Alternating row stripes, 25 rows per page, selected columns, custom export file name.

```json
{
    "type": "table",
    "id": "tbl-orders-main",
    "datasetId": "orders",
    "title": "Orders",
    "columns": ["date", "region", "rep", "units", "amount"],
    "pageSize": 25,
    "tableStyle": "alternating",
    "exportFileName": "orders-export",
    "border": true
}
```

**Pre-sorted with multiple keys**

Sorted by region A→Z, then amount high→low within each region. Users see priority badges `1` and `2` on the two headers and can still re-sort.

```json
{
    "type": "table",
    "datasetId": "orders",
    "title": "Orders by Region, Largest First",
    "defaultSort": [
        { "column": "region", "direction": "asc" },
        { "column": "amount", "direction": "desc" }
    ]
}
```

**Grouped with aggregates, initially collapsed**

Groups by region; each group header shows the summed amount and average units. `pageSize: 4` means four groups per page.

```json
{
    "type": "table",
    "id": "tbl-grouped",
    "datasetId": "orders",
    "title": "Grouped Orders",
    "pageSize": 4,
    "groupBy": "region",
    "groupAggregates": [
        { "column": "amount", "fn": "sum", "as": "total" },
        { "column": "units", "fn": "avg", "as": "avg units" }
    ],
    "groupsCollapsed": true,
    "tableStyle": "bordered"
}
```

**Total row and total column**

A footer with summed units and amount, plus a per-row total of those two columns. Because both `totalRow` and `totalColumn` are present, the bottom-right cell shows the grand total of the total column.

```json
{
    "type": "table",
    "id": "tbl-totals",
    "datasetId": "orders",
    "title": "Totals",
    "columns": ["region", "category", "units", "amount"],
    "totalRow": { "label": "Grand Total", "fns": { "units": "sum", "amount": "sum" } },
    "totalColumn": { "label": "Row Sum", "columns": ["units", "amount"] },
    "tableStyle": "bordered"
}
```

Shorthand: `"totalRow": true` sums every numeric column automatically.

**Sticky-header scroll table**

A fixed-height body that scrolls; the header pins to the top and (with a total row) the footer pins to the bottom.

```json
{
    "type": "table",
    "datasetId": "orders",
    "title": "Scrolling Orders",
    "pageSize": 50,
    "maxHeight": 420,
    "totalRow": true
}
```

**Hidden columns**

`internal_id` starts hidden but stays available in the **Columns** menu; the search box only scans the visible columns.

```json
{
    "type": "table",
    "datasetId": "orders",
    "title": "Orders",
    "hiddenColumns": ["internal_id"],
    "defaultSort": [{ "column": "amount", "direction": "desc" }]
}
```

**Formatted columns**

Currency and date formats apply to cells, the total row, the total column (all summed columns share the currency format), and group aggregates. See [Formatting](../formatting.md) for the full spec.

```json
{
    "type": "table",
    "id": "tbl-colformats",
    "datasetId": "orders",
    "title": "Formatted Columns",
    "columns": ["date", "region", "units", "amount"],
    "columnFormats": {
        "amount": { "format": "currency", "digits": 2 },
        "date": "date"
    },
    "totalRow": { "fns": { "units": "sum", "amount": "sum" } },
    "totalColumn": { "columns": ["amount"] }
}
```

**Conditional highlighting**

Returned orders mute the whole row; big amounts go green, tiny ones red; high unit counts get bold inline CSS. The first matching rule wins per target, and a row rule plus a cell rule can combine on the same row.

```json
{
    "type": "table",
    "id": "tbl-condformats",
    "datasetId": "orders",
    "title": "Highlighted Orders",
    "columns": ["date", "region", "rep", "units", "amount", "returned"],
    "columnFormats": { "amount": "currency", "date": "date" },
    "conditionalFormats": [
        { "when": { "column": "returned", "op": "eq", "value": "yes" }, "target": "row", "style": "muted" },
        { "when": { "column": "amount", "op": "gt", "value": 1200 }, "style": "success" },
        { "when": { "column": "amount", "op": "lt", "value": 100 }, "style": "error" },
        { "when": { "column": "units", "op": "gte", "value": 30 }, "css": { "fontWeight": 700 } }
    ],
    "tableStyle": "alternating"
}
```

**Built-in row detail modal**

The table shows four columns, but double-clicking a row opens a modal listing every column of the order.

```json
{
    "type": "table",
    "id": "tbl-rowmodal-default",
    "datasetId": "orders",
    "title": "Orders (double-click a row)",
    "columns": ["date", "region", "rep", "amount"],
    "rowModal": true,
    "rowModalColumns": ["id", "date", "region", "category", "rep", "units", "amount", "returned"],
    "rowModalTitle": "Order Details"
}
```

**Custom row modal with `{{ row.* }}` templates**

Point `rowModalId` at a modal in the report's `modals` array. Cards inside can read the clicked row.

```json
{
    "pages": [
        {
            "title": "Orders",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "table",
                            "id": "tbl-rowmodal-custom",
                            "datasetId": "orders",
                            "columns": ["date", "region", "rep", "amount"],
                            "rowModalId": "order-detail-modal"
                        }
                    ]
                }
            ]
        }
    ],
    "modals": [
        {
            "id": "order-detail-modal",
            "title": "Order",
            "rows": [
                {
                    "type": "layout",
                    "direction": "column",
                    "children": [
                        {
                            "type": "card",
                            "title": "Order #{{ row.id }} — {{ row.region }}",
                            "contentType": "md",
                            "text": "**Rep:** {{ row.rep }}\n**Category:** {{ row.category }}\n**Units:** {{ row.units }}\n**Amount:** {{ formatCurrency(row.amount) }}"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "orders": {
            "format": "records",
            "columns": ["id", "date", "region", "category", "rep", "units", "amount"],
            "dtypes": ["int", "date", "str", "str", "str", "int", "float"],
            "data": [
                { "id": 1, "date": "2026-06-01", "region": "West", "category": "Electronics", "rep": "Ana", "units": 12, "amount": 431.5 },
                { "id": 2, "date": "2026-06-02", "region": "East", "category": "Office", "rep": "Ben", "units": 3, "amount": 78.25 }
            ]
        }
    }
}
```

**Locked-down table**

Restore a fully static table by turning the interactive features off.

```json
{
    "type": "table",
    "datasetId": "orders",
    "title": "Static Table",
    "sortable": false,
    "showSearch": false,
    "contextMenu": false,
    "enableExport": false,
    "allowColumnHiding": false
}
```

## Tips & gotchas

- **Give interactive tables an `id`.** View state (sort, hidden columns, grouping) only persists across reloads when the visual has an `id`; it is also what row-modal validation, links, and the report-wide reset key off. Ids must be unique per report.
- **`pageSize` changes meaning when grouped** — it counts groups, not rows, so a page can hold many rows if groups are large.
- **Totals follow the search filter.** Filtering the table via the search box recomputes `totalRow` and the total-column grand total over the filtered rows only.
- **The total-column grand total needs `totalRow`.** Without a `totalRow`, no footer renders, so the total column has per-row values but no bottom sum.
- **Exports are raw, clipboard is formatted.** The CSV keeps raw numbers (dates as date text); "Copy table to clipboard" copies what's on screen, including `columnFormats` output.
- **Search only scans visible columns.** Hiding a column also removes it from search matching.
- **Nulls sort last** in both ascending and descending order, and render as empty cells.
- To feed a table a pre-filtered or aggregated view of a dataset, use the visual-level `filter`/`aggregate` props or a derived dataset — see [Filtering & aggregation](../filtering-and-aggregation.md). The table's own search box filters on top of that.
- A live playground for every feature on this page: [test-table-features.html](../../test-table-features.html).

## Related

- [Checklist](checklist.md) — a status-aware sibling that shares almost all table props.
- [Formatting](../formatting.md) — full `columnFormats` and `conditionalFormats` reference.
- [Filtering & aggregation](../filtering-and-aggregation.md) — the filter grammar used by `conditionalFormats.when`, plus per-visual `filter`/`aggregate`.
- [Modals](../modals.md) — defining the custom modals `rowModalId` points at.
- [Templates & expressions](../templates-and-expressions.md) — the `{{ row.* }}` syntax in custom row modals.
- [Persistent view state](../persistent-view-state.md) — how per-visual state is stored and reset.
- [Links & navigation](../links-and-navigation.md) — linking to a table by its `id`.
