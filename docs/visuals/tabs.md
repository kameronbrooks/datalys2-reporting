# Tabs (`type: "tabs"`, alias `type: "tabgroup"`)

Tabs is a **container visual**: it shows one child view at a time behind a tab strip. It is usable anywhere a visual can go — a row can contain a tab group that switches between a chart, a table, and a grid; a grid cell can hold its own tab group; and tabs can nest inside other tabs.

Tabs does **not** require a `datasetId`. The children inside each tab are ordinary visuals/layouts and reference their own datasets as usual.

Inactive tabs are **unmounted**, not hidden — when a tab becomes visible its contents mount fresh, so charts re-measure and render at the correct size every time.

## Minimal example

```json
{
    "pages": [
        {
            "title": "Overview",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "tabs",
                            "tabs": [
                                {
                                    "title": "Chart",
                                    "children": [
                                        { "type": "line", "datasetId": "metrics", "xColumn": "date", "yColumns": "score" }
                                    ]
                                },
                                {
                                    "title": "Data",
                                    "children": [
                                        { "type": "table", "datasetId": "metrics" }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "metrics": {
            "id": "metrics",
            "columns": ["date", "score"],
            "dtypes": ["date", "int"],
            "format": "records",
            "data": [
                { "date": "2026-05-01", "score": 78 },
                { "date": "2026-06-01", "score": 85 },
                { "date": "2026-07-01", "score": 59 }
            ]
        }
    }
}
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tabs` | `Tab[]` | **required** | The tabs to show. An empty or missing array renders an inline error (and the validator warns). |
| `defaultTab` | `number` | `0` | Index of the tab shown initially. Clamped into range. Ignored when a saved active tab is restored (see `id`). |
| `title` | `string` | — | Optional title rendered above the tab strip. |
| `description` | `string` | — | Optional description text. |
| `id` | `string` | — | Unique id. Enables active-tab persistence and makes the tab group a navigation anchor. |
| `persistState` | `boolean` | `true` when `id` is set | Set `false` to opt this tab group out of remembering its active tab. Has no effect without an `id`. |
| `padding` | `number` | `0` | Inner padding in pixels. |
| `margin` | `number` | — | Outer margin in pixels. |
| `border` | `boolean` | `false` | Standard 1px border around the whole tab group. |
| `shadow` | `boolean` | `false` | Standard drop shadow. |
| `flex` | `number` | `1` | Flex sizing within the parent row. |

### Tab objects

Each entry in `tabs` provides either `children` (simple) or `layout` (full control):

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | `"Tab N"` | The tab label. |
| `children` | `LayoutElement[]` | — | Visuals/layouts shown in this tab, rendered as a **row** layout. |
| `layout` | `Layout` | — | Alternative to `children`: a complete layout object (`direction`, `columns`, `gap`, nested `children`, ...) for full control. Takes precedence when both are set. |

A tab with neither `children` nor `layout` triggers a validation warning and renders empty.

## Navigation and persistence

- **Link navigation into tabs:** when a [link](link.md) (or `#hash` link) targets a visual id that lives inside one of the tabs, the tab group automatically activates the containing tab so the scroll can reach it — this works through nested tab groups too. See [../links-and-navigation.md](../links-and-navigation.md).
- **Active-tab persistence:** give the tab group an `id` and the active tab is saved in the browser and restored on the next load, overriding `defaultTab`. Set `persistState: false` to opt out. See [../persistent-view-state.md](../persistent-view-state.md).

## Examples

**Chart / table / grid switcher**

The first two tabs use the simple `children` form; the third uses a `layout` object to arrange cards in a 2-column grid.

```json
{
    "type": "tabs",
    "title": "Details",
    "border": true,
    "tabs": [
        {
            "title": "Trend",
            "children": [
                { "type": "line", "id": "score-trend-chart", "datasetId": "metrics", "xColumn": "date", "yColumns": "score", "title": "Score over time" }
            ]
        },
        {
            "title": "Data",
            "children": [
                { "type": "table", "datasetId": "metrics", "pageSize": 6 }
            ]
        },
        {
            "title": "Grid",
            "layout": {
                "direction": "grid",
                "columns": 2,
                "children": [
                    { "type": "card", "text": "Grid cell 1", "border": true },
                    { "type": "card", "text": "Grid cell 2", "border": true },
                    { "type": "card", "text": "Grid cell 3", "border": true },
                    { "type": "card", "text": "Grid cell 4", "border": true }
                ]
            }
        }
    ]
}
```

**Tabs beside a KPI in a row**

A tab group is just another row child — here a compact KPI (`flex: 0`) sits next to a wide tab group (`flex: 2`).

```json
{
    "type": "layout",
    "direction": "row",
    "children": [
        {
            "type": "kpi",
            "datasetId": "metrics",
            "valueColumn": "score",
            "rowIndex": 0,
            "title": "Latest Score",
            "flex": 0,
            "border": true
        },
        {
            "type": "tabs",
            "title": "Details",
            "flex": 2,
            "border": true,
            "tabs": [
                { "title": "Trend", "children": [ { "type": "line", "datasetId": "metrics", "xColumn": "date", "yColumns": "score" } ] },
                { "title": "Data", "children": [ { "type": "table", "datasetId": "metrics" } ] }
            ]
        }
    ]
}
```

**Nested tab groups**

Tabs may contain any layout or visual config — including more tabs. Navigating to an id inside the inner group activates both the outer and inner tabs.

```json
{
    "type": "tabs",
    "border": true,
    "tabs": [
        {
            "title": "Outer 1",
            "children": [
                {
                    "type": "tabs",
                    "id": "nested-tabs-inner",
                    "tabs": [
                        { "title": "Nested 1", "children": [ { "type": "card", "text": "Deeply nested content 1" } ] },
                        { "title": "Nested 2", "children": [ { "type": "card", "text": "Deeply nested content 2" } ] }
                    ]
                }
            ]
        },
        { "title": "Outer 2", "children": [ { "type": "card", "text": "Outer tab 2 content" } ] }
    ]
}
```

**Filtered slices of one dataset, one per tab**

Combine tabs with per-visual `filter` props so each tab shows a different view of the same dataset. `defaultTab: 1` opens on the second tab. See [../filtering-and-aggregation.md](../filtering-and-aggregation.md).

```json
{
    "type": "tabs",
    "title": "Scores by band",
    "defaultTab": 1,
    "border": true,
    "tabs": [
        {
            "title": "All",
            "children": [ { "type": "table", "datasetId": "metrics", "pageSize": 8 } ]
        },
        {
            "title": "High (75 and up)",
            "children": [
                { "type": "table", "datasetId": "metrics", "filter": { "column": "score", "op": "gte", "value": 75 }, "pageSize": 8 }
            ]
        },
        {
            "title": "Low (under 75)",
            "children": [
                { "type": "table", "id": "low-scores-table", "datasetId": "metrics", "filter": { "column": "score", "op": "lt", "value": 75 }, "pageSize": 8 }
            ]
        }
    ]
}
```

**Tab group that remembers its active tab**

With an `id`, the selected tab survives page reloads. The report-wide "Reset view" button (or `persistState: false`) restores `defaultTab`.

```json
{
    "type": "tabs",
    "id": "region-detail-tabs",
    "defaultTab": 0,
    "tabs": [
        { "title": "North", "children": [ { "type": "table", "datasetId": "metrics", "filter": { "column": "team", "op": "eq", "value": "Alpha" } } ] },
        { "title": "South", "children": [ { "type": "table", "datasetId": "metrics", "filter": { "column": "team", "op": "eq", "value": "Beta" } } ] }
    ]
}
```

## Tips & gotchas

- `"tabgroup"` is an exact alias of `"tabs"` — both keys render the same component.
- The `children` form always lays its contents out as a **row**. For a column or grid inside a tab, use the `layout` form with an explicit `direction`.
- Because inactive tabs are unmounted, any transient state inside a tab is discarded on switch unless the child persists it itself (e.g. a table with an `id` keeps its sort/hidden columns — see [../persistent-view-state.md](../persistent-view-state.md)).
- Table/tab ids inside tabs must still be **unique across the whole report**; the validator warns about duplicates.
- A saved active tab (or `defaultTab`) that is out of range after you remove tabs is clamped to the last tab rather than erroring.
- A tab without a `title` gets an automatic label like `Tab 1`, `Tab 2`.
- Don't confuse this visual with report **pages** (the top-level page strip); tabs live inside a page's layout and can be mixed freely with other visuals. See [../pages-and-layouts.md](../pages-and-layouts.md).

## Related

- [../persistent-view-state.md](../persistent-view-state.md) — how the active tab is saved and reset
- [../links-and-navigation.md](../links-and-navigation.md) — navigating into (nested) tabs by visual id
- [../pages-and-layouts.md](../pages-and-layouts.md) — layout objects usable in the `layout` form
- [../filtering-and-aggregation.md](../filtering-and-aggregation.md) — per-visual filters for per-tab slices
- [link.md](link.md) — the link visual that can target content inside tabs
- Live example: [../../test-tabs.html](../../test-tabs.html)
