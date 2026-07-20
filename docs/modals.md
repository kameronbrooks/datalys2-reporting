# Modals

Modals display additional detail in an overlay without leaving the current page. A modal is a full-fledged mini-page: its `rows` hold the same layouts and visuals as report pages, so a modal can contain tables, charts, cards, tab groups — anything. Modals are defined once in the global `modals` array and can be opened from several kinds of triggers.

There are three ways to open a modal: a hover **expand icon** on any element (`modalId`), a dedicated **trigger button** (`type: "modal"`), and **row-detail modals** on tables and checklists (`rowModal` / `rowModalId`) — where cards inside the modal can reference the clicked row via `{{ row.* }}` templates. Clicking outside the modal (or its × button) closes it.

## Minimal example

```json
{
    "pages": [
        {
            "title": "Dashboard",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "kpi",
                            "datasetId": "kpiData",
                            "title": "Total Revenue",
                            "valueColumn": "Revenue",
                            "modalId": "revenue-details"
                        }
                    ]
                }
            ]
        }
    ],
    "modals": [
        {
            "id": "revenue-details",
            "title": "Revenue Breakdown",
            "description": "Detailed view of revenue by region.",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        { "type": "table", "datasetId": "regionalRevenue", "title": "Regional Data" }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "kpiData": {
            "format": "records",
            "columns": ["Revenue"],
            "dtypes": ["float"],
            "data": [{ "Revenue": 50000 }]
        },
        "regionalRevenue": {
            "format": "records",
            "columns": ["Region", "Revenue"],
            "dtypes": ["str", "float"],
            "data": [
                { "Region": "West", "Revenue": 30000 },
                { "Region": "East", "Revenue": 20000 }
            ]
        }
    }
}
```

## Modal definition (`modals` array)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | `string` | required | Unique identifier, referenced by triggers (`modalId`, `rowModalId`, modal buttons). |
| `title` | `string` | required | Shown in the modal header. |
| `description` | `string` | — | Optional text under the header. |
| `rows` | `Layout[]` | — | Layout rows rendered inside the modal body — same structure as page `rows`. A modal without rows shows "There are no rows in this modal." |
| `buttonLabel` | `string` | — | Label used when the modal is placed inline as a trigger button (see below). |

## Triggers

### 1. `modalId` on any element (hover expand icon)

Add `modalId` to any layout or visual element. Hovering the element reveals an expand icon in its top-right corner; clicking the icon opens the referenced modal.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `modalId` | `string` | — | Id of a modal from the `modals` array to open from the hover icon. |

### 2. Modal trigger button (`type: "modal"`)

Place a dedicated button anywhere a visual can go. The element references a global modal by `id` — or can carry its own `rows` inline.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `string` | required | Must be `"modal"`. |
| `id` | `string` | required* | Id of the global modal to open. (*Not needed when `rows` is defined inline on the trigger itself.) |
| `buttonLabel` | `string` | `title`, else "Open Modal" | The button text. |
| `title` | `string` | — | Fallback button text; also the header when the trigger defines the modal inline. |
| `rows` | `Layout[]` | — | Inline modal content — lets a one-off modal live right where its button is, without an entry in `modals`. |

### 3. Row-detail modals (tables and checklists)

Tables and checklists can open a modal for a clicked row — double-click the row, or right-click → **Open details**.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `rowModal` | `boolean` | `false` | Enable the **built-in** detail modal listing the row's values. |
| `rowModalId` | `string` | — | Open a **custom modal** from `modals` instead. Implies `rowModal`. Cards inside can use `{{ row.ColumnName }}` templates. |
| `rowModalColumns` | `string[]` | visible columns | Columns shown in the built-in modal — may include hidden or non-displayed dataset columns. |
| `rowModalTitle` | `string` | `"Details"` | Title of the built-in modal. |

## Examples

**Hover expand icon on a chart.** The pie chart gets an expand icon that opens a modal with the full data table:

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
                        {
                            "type": "pie",
                            "datasetId": "salesByRegion",
                            "title": "Sales by region",
                            "categoryColumn": "region",
                            "valueColumn": "total",
                            "modalId": "sales-detail"
                        }
                    ]
                }
            ]
        }
    ],
    "modals": [
        {
            "id": "sales-detail",
            "title": "Sales detail",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        { "type": "table", "datasetId": "salesByRegion", "pageSize": 10 }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "salesByRegion": {
            "format": "records",
            "columns": ["region", "total"],
            "dtypes": ["str", "float"],
            "data": [
                { "region": "West", "total": 1740.8 },
                { "region": "East", "total": 1021.4 },
                { "region": "North", "total": 778.0 }
            ]
        }
    }
}
```

**Trigger button referencing a global modal:**

```json
{
    "type": "modal",
    "id": "revenue-details",
    "buttonLabel": "View Detailed Breakdown"
}
```

**Trigger button with inline rows.** No entry in `modals` needed — the trigger carries its own content:

```json
{
    "type": "modal",
    "id": "method-notes",
    "title": "Methodology",
    "buttonLabel": "How is this computed?",
    "rows": [
        {
            "type": "layout",
            "direction": "column",
            "children": [
                {
                    "type": "card",
                    "contentType": "md",
                    "text": "Figures are **client-side aggregates** of the shared sales dataset.\nSee the datasets section of the config for the raw rows."
                }
            ]
        }
    ]
}
```

**Built-in row modal.** Double-clicking a row shows selected columns — including columns not displayed in the table itself:

```json
{
    "type": "table",
    "id": "tbl-rowmodal-default",
    "datasetId": "orders",
    "title": "Default row modal",
    "columns": ["date", "region", "rep", "amount"],
    "rowModal": true,
    "rowModalColumns": ["id", "date", "region", "category", "rep", "units", "amount", "returned"],
    "rowModalTitle": "Order Details"
}
```

**Custom row modal with `{{ row.* }}` templates.** The table opens a normal report modal; the card inside reads the clicked row:

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
                            "title": "Custom row modal",
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
                            "text": "**Rep:** {{ row.rep }}\n**Category:** {{ row.category }}\n**Amount:** {{ formatCurrency(row.amount) }}"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "orders": {
            "format": "records",
            "columns": ["id", "date", "region", "category", "rep", "units", "amount", "returned"],
            "dtypes": ["int", "date", "str", "str", "str", "int", "float", "str"],
            "data": [
                { "id": 1, "date": "2026-01-05", "region": "West", "category": "Electronics", "rep": "Ana", "units": 12, "amount": 620.5, "returned": "no" },
                { "id": 2, "date": "2026-01-12", "region": "East", "category": "Furniture", "rep": "Ben", "units": 4, "amount": 310.0, "returned": "yes" }
            ]
        }
    }
}
```

**A modal containing a full dashboard layout.** Modals accept any layout — grids, filtered visuals, even tab groups:

```json
{
    "id": "region-deep-dive",
    "title": "Region deep dive",
    "description": "West-region slice of the shared sales dataset.",
    "rows": [
        {
            "type": "layout",
            "direction": "grid",
            "columns": 2,
            "children": [
                {
                    "type": "clusteredBar",
                    "datasetId": "sales",
                    "title": "West by category",
                    "filter": { "column": "region", "op": "eq", "value": "West" },
                    "aggregate": {
                        "groupBy": ["category"],
                        "aggregates": [{ "column": "amount", "fn": "sum", "as": "total" }]
                    },
                    "xColumn": "category",
                    "yColumns": "total"
                },
                {
                    "type": "table",
                    "datasetId": "sales",
                    "title": "West rows",
                    "filter": { "column": "region", "op": "eq", "value": "West" }
                }
            ]
        }
    ]
}
```

## Tips & gotchas

- **Unknown modal ids warn.** Opening a modal id that is not defined logs `[datalys2] Modal "<id>" not found.`; the load-time validator also warns about `modalId` / `rowModalId` / modal-trigger references that do not match any entry in `modals` (inline-`rows` triggers are exempt).
- **Modal `rows` are validated like page rows** — bad column names, unknown types, or missing datasets inside a modal produce the same console warnings as on pages.
- **Checklist rows work the same way** — `rowModal`, `rowModalId`, `rowModalColumns`, `rowModalTitle` behave identically to tables; the checklist's built-in modal additionally leads with the derived status.
- **`{{ row.* }}` only resolves inside a row-opened modal.** The same modal opened via `modalId` or a trigger button has no clicked row, so `row.x` renders empty.
- **Column display formats carry into the built-in row modal** (`columnFormats` on the table/checklist). Custom modals format via template helpers like `{{ formatCurrency(row.amount) }}`.
- **Navigation closes modals** — following a link (or `#hash`) to a visual closes any open modal before switching pages.
- **Modal triggers may reuse a modal's id** — the duplicate-id validator only checks *visual* ids, so a button and its modal sharing an id is fine.
- **One modal, many triggers.** Any number of elements can point at the same modal id; define shared detail views once.

## Related

- [Templates & Expressions](templates-and-expressions.md) — the `{{ row.* }}` template engine
- [Table](visuals/table.md) and [Checklist](visuals/checklist.md) — row-modal interactions in context
- [Pages & Layouts](pages-and-layouts.md) — the layout structure modal `rows` reuse
- [Validation](validation.md) — modal-related warnings
- Live example page: [../test-table-features.html](../test-table-features.html)
