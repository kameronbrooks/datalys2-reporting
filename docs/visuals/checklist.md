# Checklist (`type: "checklist"`)

The Checklist visual renders a task list with a status column: a check box plus derived **Complete / Overdue / Due Soon / Pending** states, status filter chips with live counts, a completion progress bar, and urgency-aware sorting. On top of that it inherits nearly the entire [Table](table.md) feature set — type-aware sorting, search, pagination, column hiding, context menus, CSV export and clipboard copy, sticky headers, row detail modals, column and conditional formatting, and persistent view state.

> **Checklists are read-only by design.** Status is always derived from the dataset — a truthy `statusColumn` value means complete — and there is deliberately no interactive check-off. The check boxes cannot be clicked, and nothing the user does in the report ever changes the underlying data. To change a task's status, change the data and regenerate the report.

## Minimal example

A complete `report-data` config with one checklist:

```json
{
    "pages": [
        {
            "title": "Tasks",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "checklist",
                            "datasetId": "tasks",
                            "title": "Project Tasks",
                            "statusColumn": "done"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "tasks": {
            "format": "records",
            "columns": ["task", "owner", "done"],
            "dtypes": ["str", "str", "bool"],
            "data": [
                { "task": "Draft launch email", "owner": "Ana", "done": true },
                { "task": "Review billing report", "owner": "Ben", "done": false },
                { "task": "Ship export module", "owner": "Cody", "done": false }
            ]
        }
    }
}
```

The remaining examples show only the visual object; drop them into any page's `children` array with a matching dataset.

## Status derivation

Each row's status is computed from the data, in this order:

1. **Complete** — the row's `statusColumn` value is truthy.
2. Otherwise, when `warningColumn` is configured and the row has a due-date value:
   - **Overdue** — the due date is in the past (at least a full day ago).
   - **Due Soon** — the due date is within the next `warningThreshold` days (default 3). A task due **today** counts as Due Soon, not Overdue.
3. **Pending** — everything else, including rows with no due-date value.

Notes:

- Statuses are computed against the clock at render time, so the same report shows different urgency as time passes.
- Without a `warningColumn`, only **Pending** and **Complete** can occur, and only those two chips are shown.
- The urgency order used for sorting is: Overdue → Due Soon → Pending → Complete.
- In the row itself: the check box is checked only for Complete, and the due-date cell gains a **Due Soon** or **Overdue** badge when applicable.

## Properties

The checklist supports all common visual properties (`datasetId`, `id`, `description`, `filter`, `aggregate`, `padding`, `margin`, `border`, `shadow`, `flex` — see [Visual elements](../visual-elements.md)).

### Checklist-specific properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `statusColumn` | `string` | **required** | Column whose truthy value marks a task complete. Not displayed as a data column. |
| `warningColumn` | `string` | — | Due-date column used to derive Overdue / Due Soon. |
| `warningThreshold` | `number` | `3` | Days before the due date at which a task becomes Due Soon. |
| `columns` | `string[]` | all columns except `statusColumn` | Data columns to display, in order (shown after the Status column). |
| `showStatusFilter` | `boolean` | `true` | Show the status chips row: **All / Pending / Due Soon / Overdue / Complete**, each with a live count. Clicking a chip hides/shows that status; **All** resets. |
| `showProgress` | `boolean` | `true` | Show the completion progress bar next to the chips. |
| `hideCompleted` | `boolean` | `false` | Start with completed tasks hidden (the Complete chip toggled off). Users can toggle them back at runtime. |
| `defaultSort` | `{column, direction}[]` | urgency, then due date | Initial sort keys. The special column name `"status"` (case-insensitive) sorts by urgency — ascending puts the most urgent first. |
| `title` | `string` | — | Optional title rendered above the checklist. |

### Shared table properties

These behave exactly as on the [Table](table.md) visual — see that page for the full semantics:

| Property | Default | Notes |
|----------|---------|-------|
| `pageSize` | `10` | Rows per page (checklists have no grouping, so it is always rows). |
| `showSearch` | `true` | Search also matches the derived status label ("overdue", "due soon", ...). |
| `sortable` | `true` | Click-to-sort, Shift+click multi-sort with priority badges. |
| `hiddenColumns` | `[]` | Initially hidden; re-showable via the **Columns** menu. |
| `allowColumnHiding` | `true` | Columns button + Hide entries. The Status column cannot be hidden. |
| `enableExport` | `true` | Export button and menu entries. |
| `exportFileName` | title, else `datasetId`, else `"checklist"` | CSV file name. |
| `contextMenu` | `true` | Right-click menus on headers and cells. |
| `maxHeight` | — | Scrolling body with a sticky header. |
| `stickyHeader` | `true` when `maxHeight` is set | Pin the header while scrolling. |
| `rowModal` / `rowModalId` / `rowModalColumns` / `rowModalTitle` | — | Row detail modals, built-in or custom. |
| `persistState` | `true` when the visual has an `id` | Persists sort, hidden columns, **and the chip selection**. |
| `columnFormats` | — | Per-column display formats. See [Formatting](../formatting.md). |
| `conditionalFormats` | — | Cell/row highlight rules. See [Formatting](../formatting.md). |

Table-only props (`tableStyle`, `groupBy`, `groupAggregates`, `groupsCollapsed`, `totalRow`, `totalColumn`) do not apply to checklists.

## Built-in user interactions

Sorting, context menus, the Columns menu, search, pagination, and row modals work exactly like the [Table](table.md); checklist-specific behavior:

- **Status filter chips** — one chip per possible status, each showing its count. Clicking a lit chip hides that status; clicking a dark chip shows it again; **All** shows everything. Counts (and the progress bar) are computed over the **search-filtered** data *before* the chip filter, so hiding Complete never zeroes the progress bar. The chip selection persists across reloads (with an `id`).
- **Progress bar** — completed ÷ searched rows, with a rounded percent label. The toolbar always shows the `X / Y Completed` summary, even with `showProgress: false`.
- **Status header** — clicking the **Status** header sorts by urgency (Overdue → Due Soon → Pending → Complete), cycling like any other header, and it participates in Shift+click multi-sorts. Its right-click menu offers **Sort by urgency** and **Sort by urgency (reversed)** instead of ascending/descending. The Status header has no Hide entry.
- **Default urgency sort** — with no `defaultSort`, rows sort by urgency, then by the due date ascending (most overdue first within Overdue), so the most pressing work is always on page 1.
- **Search** — matches the visible columns *plus* the derived status label, so typing "overdue" filters to overdue tasks.
- **Exports** — CSV download and clipboard copy both prepend a derived `Status` column (`Complete` / `Pending` / `Due Soon` / `Overdue`) before the visible columns, and contain the chip-filtered, sorted view across all pages. CSV keeps raw data values; clipboard copy matches the formatted on-screen view. The cell menu's **Copy row** also leads with the status label.
- **Row modals** — the built-in detail modal leads with a **Status** row, then the columns (`rowModalColumns` or the visible columns). Custom `rowModalId` modals receive the clicked row via `{{ row.* }}` templates, exactly like tables (see [Modals](../modals.md)); the row passed to the modal contains only real dataset columns.
- **Reset view** (right-click any header) clears the persisted sort, hidden columns, and chip selection back to the config defaults; the report headbar's report-wide reset does the same for every visual.

## Examples

**Minimal checklist**

Complete/Pending only (no due dates), all defaults.

```json
{
    "type": "checklist",
    "datasetId": "tasks",
    "title": "Project Tasks",
    "statusColumn": "done"
}
```

**Due-date tracking**

Adds Overdue and Due Soon states. Tasks due within 5 days go amber; the default sort surfaces the most overdue work first.

```json
{
    "type": "checklist",
    "id": "chk-main",
    "datasetId": "tasks",
    "title": "Project Tasks",
    "statusColumn": "done",
    "warningColumn": "due",
    "warningThreshold": 5,
    "columnFormats": { "due": "date" }
}
```

**Hide-completed sprint board**

Starts with the Complete chip toggled off so only open work shows; readers can flip it back on. A trimmed column set keeps it scannable.

```json
{
    "type": "checklist",
    "id": "chk-open-work",
    "datasetId": "tasks",
    "title": "Open Work",
    "statusColumn": "done",
    "warningColumn": "due",
    "hideCompleted": true,
    "columns": ["task", "owner", "due"],
    "columnFormats": { "due": "date" },
    "pageSize": 8
}
```

**Formatted and conditionally highlighted**

Dates and one-decimal estimates via `columnFormats`; High-priority cells red and big estimates bold via `conditionalFormats`. See [Formatting](../formatting.md) for the rule grammar.

```json
{
    "type": "checklist",
    "id": "chk-condfmt",
    "datasetId": "tasks",
    "title": "Prioritized Tasks",
    "statusColumn": "done",
    "warningColumn": "due",
    "columns": ["task", "priority", "due", "estHours"],
    "columnFormats": {
        "due": "date",
        "estHours": { "format": "number", "digits": 1 }
    },
    "conditionalFormats": [
        { "when": { "column": "priority", "op": "eq", "value": "High" }, "style": "error" },
        { "when": { "column": "estHours", "op": "gt", "value": 16 }, "css": { "fontWeight": 700 } }
    ]
}
```

**Custom row modal**

Double-clicking a task opens a modal defined in the report's `modals` array; its cards read the clicked row via `{{ row.* }}`.

```json
{
    "pages": [
        {
            "title": "Tasks",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "checklist",
                            "id": "chk-modal",
                            "datasetId": "tasks",
                            "title": "Tasks",
                            "statusColumn": "done",
                            "warningColumn": "due",
                            "rowModalId": "task-detail-modal"
                        }
                    ]
                }
            ]
        }
    ],
    "modals": [
        {
            "id": "task-detail-modal",
            "title": "Task",
            "rows": [
                {
                    "type": "layout",
                    "direction": "column",
                    "children": [
                        {
                            "type": "card",
                            "title": "{{ row.task }}",
                            "contentType": "md",
                            "text": "**Owner:** {{ row.owner }}\n**Priority:** {{ row.priority }}\n**Due:** {{ row.due }}\n**Estimate:** {{ formatNumber(row.estHours, 1) }} h\n**Done:** {{ row.done }}"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "tasks": {
            "format": "records",
            "columns": ["task", "owner", "priority", "due", "estHours", "done"],
            "dtypes": ["str", "str", "str", "date", "float", "bool"],
            "data": [
                { "task": "Draft launch email", "owner": "Ana", "priority": "High", "due": "2026-07-22", "estHours": 4.5, "done": false },
                { "task": "Review billing report", "owner": "Ben", "priority": "Low", "due": "2026-07-30", "estHours": 2.0, "done": true }
            ]
        }
    }
}
```

Prefer the built-in modal instead? Use `"rowModal": true` with optional `rowModalColumns`/`rowModalTitle` — it lists Status first, then the row's values.

**Sticky compact list**

A dense, fixed-height list with a pinned header, custom sort (latest due date first), and a hidden estimate column.

```json
{
    "type": "checklist",
    "id": "chk-compact",
    "datasetId": "tasks",
    "title": "All Tasks",
    "statusColumn": "done",
    "warningColumn": "due",
    "defaultSort": [{ "column": "due", "direction": "desc" }],
    "hiddenColumns": ["estHours"],
    "pageSize": 20,
    "maxHeight": 360,
    "exportFileName": "tasks-export"
}
```

To sort by urgency explicitly (for example urgency first, then owner), use the special `"status"` column: `"defaultSort": [{ "column": "status", "direction": "asc" }, { "column": "owner", "direction": "asc" }]`.

**Locked-down checklist**

A fully static list: no chips, progress bar, search, sorting, menus, export, or column hiding.

```json
{
    "type": "checklist",
    "datasetId": "tasks",
    "title": "Task Snapshot",
    "statusColumn": "done",
    "warningColumn": "due",
    "columns": ["task", "owner", "due"],
    "showStatusFilter": false,
    "showProgress": false,
    "showSearch": false,
    "sortable": false,
    "contextMenu": false,
    "enableExport": false,
    "allowColumnHiding": false
}
```

## Tips & gotchas

- **There is no check-off.** If a reviewer asks for clickable check boxes, that is a data change, not a report feature — the checklist is a presentation of dataset state by design.
- **Truthy means truthy.** `true`, `1`, or a non-empty string in `statusColumn` all count as complete; `false`, `0`, `null`, and `""` do not.
- **A task due today is Due Soon, not Overdue.** Overdue requires the due date to be at least a full day in the past.
- **No `warningColumn`, no urgency.** Without it every incomplete task is Pending, the Overdue/Due Soon chips disappear, and the default sort has no due-date tiebreaker.
- **`statusColumn` is not a data column.** It is excluded from the default column list; the rendered Status column (check box) stands in for it. Add it to `rowModalColumns` if you want the raw value visible in the built-in modal.
- **Progress ignores the chips but follows the search.** Searching recomputes counts and the progress bar; toggling chips does not.
- **Statuses drift with time.** Urgency is computed when the report is viewed, so a static HTML file naturally shows more Overdue items as it ages — usually what you want for a report of record.
- **Give it an `id`** so the sort, hidden columns, and chip selection persist across reloads and can be reset per-visual.
- A live playground for every feature on this page: [test-checklist.html](../../test-checklist.html).

## Related

- [Table](table.md) — full reference for the shared interactions (sorting, menus, export, modals).
- [Formatting](../formatting.md) — `columnFormats` and `conditionalFormats` reference.
- [Filtering & aggregation](../filtering-and-aggregation.md) — the filter grammar used by `conditionalFormats.when`, plus per-visual `filter`.
- [Modals](../modals.md) — defining custom modals for `rowModalId`.
- [Templates & expressions](../templates-and-expressions.md) — the `{{ row.* }}` syntax in custom row modals.
- [Persistent view state](../persistent-view-state.md) — how per-visual state is stored and reset.
