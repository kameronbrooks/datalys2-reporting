# Persistent View State

When a reader customizes a visual at runtime — re-sorting a table, hiding columns, switching tabs — those changes are saved in the browser's `localStorage` and restored the next time the report loads. The report config itself is **never modified**; persistence is purely a per-browser convenience layer on top of your configured defaults.

Persistence is keyed by the visual's `id`, so it only works for visuals that have one, and it is on by default whenever an `id` is present. Readers can undo their customizations per visual (right-click → **Reset view**) or for the whole report (the headbar **Reset view** button).

## Minimal example

Give the visuals stable, unique ids — that is all it takes:

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
                            "id": "orders-table",
                            "datasetId": "orders",
                            "defaultSort": [{ "column": "amount", "direction": "desc" }]
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "orders": {
            "format": "records",
            "columns": ["region", "amount"],
            "dtypes": ["str", "float"],
            "data": [
                { "region": "West", "amount": 620.5 },
                { "region": "East", "amount": 310.0 }
            ]
        }
    }
}
```

If the reader re-sorts by `region`, that sort survives a reload. `defaultSort` remains the fallback whenever no saved state exists (and after a reset).

## What persists, per visual

| Visual | Persisted state |
|--------|-----------------|
| Table | Sort keys (including multi-sort order), hidden columns, active grouping column. |
| Checklist | Sort keys, hidden columns, hidden status chips (the All / Pending / Due Soon / Overdue / Complete selection). |
| Tabs (`tabs` / `tabgroup`) | The active tab index. |

Everything else is deliberately session-only: table/checklist **search text**, the **current page** of pagination, and **collapsed group** state reset on every load.

## Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | `string` | — | Required for persistence (and for link anchors). Must be **unique** across the report — the validator warns about duplicates because two visuals sharing an id would overwrite each other's saved state. |
| `persistState` | `boolean` | `true` when `id` is set | Set `false` on a table, checklist, or tabs visual to opt that visual out of persistence. Without an `id`, nothing persists regardless. |

## How storage is keyed

Each visual's state is stored under the `localStorage` key:

```
dl2state:<report-namespace>:<visual-id>
```

The report namespace is resolved once per load, first match wins:

1. `<meta name="report-id" content="...">` in the HTML head,
2. else the document `<title>`,
3. else the URL path (`location.pathname`).

The namespace is trimmed and capped at 120 characters. If your report titles change between publishes (for example they embed a date), give the report a stable `report-id` so readers keep their customizations:

```html
<meta name="report-id" content="quarterly-sales">
```

## Resetting

- **One visual:** right-click a table or checklist header and choose **Reset view**. This clears that visual's saved state and restores the config-defined defaults (`defaultSort`, `hiddenColumns`, `groupBy`, chips), and also clears the search box and returns to page 1. Tabs visuals have no context menu; their saved tab is cleared by the report-wide reset.
- **Whole report:** a **Reset view** button appears at the right of the headbar whenever the report has *any* saved customizations (it hides itself otherwise, and appears live as soon as something is saved). Clicking it removes every `dl2state` entry for this report's namespace and reloads the page so all visuals return to their configured defaults.

## Examples

**Stable namespace across republishes.** The title changes every quarter, but `report-id` keeps saved state attached:

```html
<head>
    <title>Sales Report — Q3 2026</title>
    <meta name="report-id" content="quarterly-sales">
</head>
```

**Opting one visual out.** A curated "executive" table that should always render exactly as configured:

```json
{
    "type": "table",
    "id": "exec-summary",
    "datasetId": "summary",
    "persistState": false,
    "defaultSort": [{ "column": "priority", "direction": "asc" }],
    "sortable": false,
    "allowColumnHiding": false
}
```

**Tabs that remember their last tab:**

```json
{
    "type": "tabs",
    "id": "detail-tabs",
    "tabs": [
        { "title": "Trend", "children": [ { "type": "line", "datasetId": "metrics", "xColumn": "date", "yColumns": "score" } ] },
        { "title": "Data", "children": [ { "type": "table", "id": "metrics-table", "datasetId": "metrics" } ] }
    ]
}
```

Without an `id`, the same tab group would open on `defaultTab` (index 0 by default) on every load.

**Checklist with persisted chips.** A reader who toggles the Complete chip off keeps that preference; `hideCompleted` remains the default for first-time viewers and after a reset:

```json
{
    "type": "checklist",
    "id": "chk-tasks",
    "datasetId": "tasks",
    "statusColumn": "done",
    "warningColumn": "due",
    "hideCompleted": true
}
```

**Grouped table whose grouping the reader may change.** The saved grouping (including "ungrouped", which is stored explicitly) wins over `groupBy` on reload:

```json
{
    "type": "table",
    "id": "orders-by-region",
    "datasetId": "orders",
    "groupBy": "region",
    "groupAggregates": [{ "column": "amount", "fn": "sum", "as": "total" }],
    "hiddenColumns": ["internal_id"]
}
```

## Tips & gotchas

- **No `id`, no persistence** — silently. If customizations are not sticking, check that the visual has an `id` first.
- **Duplicate ids corrupt each other's state.** The validator warns: `Visual id "<id>" is used N times — ids must be unique for links and view-state persistence to work correctly.`
- **Renaming an `id` orphans its saved state** — readers fall back to defaults, and the old entry lingers until a report-wide reset. Treat ids as stable identifiers.
- **Untouched visuals write nothing.** State is saved only after the reader actually changes something, so pristine reports leave no storage entries.
- **State is per browser and per device** — it lives in `localStorage`, is never sent anywhere, and does not follow readers across machines.
- **Private/incognito modes may block storage.** The library degrades gracefully: everything works, nothing persists.
- **Two reports served from the same path with no `report-id` and identical titles share a namespace** — their same-id visuals would collide. Distinct `report-id` values avoid this.
- **Saved state beats config defaults** on load: if you ship a new `defaultSort` in a republished report, readers with saved sort state will not see it until they reset.
- **The config is never written to.** Resetting only deletes browser storage; your JSON is untouched by anything readers do.

## Related

- [Table](visuals/table.md) and [Checklist](visuals/checklist.md) — the interactions that generate view state
- [Tabs](visuals/tabs.md) — active-tab persistence
- [Links & Navigation](links-and-navigation.md) — the other reason visuals need unique ids
- [Validation](validation.md) — the duplicate-id warning
- Live example pages: [../test-table-features.html](../test-table-features.html), [../test-checklist.html](../test-checklist.html)
