# Pages & Layouts

A report is a set of **pages** (one tab per page), and each page is a vertical stack of **rows**. Every row is a layout — a flex row, flex column, or CSS grid — whose children are visuals, other layouts, or modal trigger buttons. Layouts nest to any depth, so a row can contain a column that contains a grid, and so on.

Since 0.3.0, spacing is owned by layouts: children are separated by the layout's `gap` (default 10px), visuals default to `margin: 0`, and `flex: 0` is respected (it keeps an element at its natural size instead of stretching).

## Minimal example

A complete `pages` value — one page with a two-visual row:

```json
{
    "pages": [
        {
            "title": "Overview",
            "description": "Headline numbers.",
            "lastUpdated": "2026-07-20",
            "rows": [
                {
                    "direction": "row",
                    "children": [
                        { "type": "kpi", "datasetId": "kpiData", "valueColumn": "revenue", "title": "Revenue", "flex": 0 },
                        { "type": "table", "datasetId": "sales", "title": "Sales" }
                    ]
                }
            ]
        }
    ]
}
```

## Pages

Each entry in the top-level `pages` array becomes a tab in the report.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | — | The tab label and the page heading. |
| `description` | string | — | Optional paragraph shown under the page heading. |
| `lastUpdated` | string | — | Optional text shown next to the page heading as `Last Updated: ...`. Displayed verbatim (not parsed). This is separate from the report-wide `last-updated` meta tag. |
| `rows` | Layout[] | — | The page content: an array of layouts stacked vertically. A page without rows shows "There are no rows on this page." and the validator warns. |

Entries in `rows` are always treated as layouts — you may omit `"type": "layout"` on them.

## Layouts (`type: "layout"`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `direction` | `"row"` \| `"column"` \| `"grid"` | `"row"` | How children flow: horizontal flex, vertical flex, or CSS grid. |
| `children` | array | — | The child elements: visuals, nested layouts, or modal triggers. Required (the validator warns on empty layouts). |
| `gap` | number \| string | `10` (px) | Space between children, all directions. A number is pixels; a string is any CSS gap value (e.g. `"1rem"`, `"20px 10px"`). |
| `wrap` | boolean | `false` | Row/column only: allow children to wrap onto multiple lines when space runs out. |
| `align` | string | — | Row/column only: CSS `align-items` (`"center"`, `"stretch"`, `"flex-start"`, ...). |
| `justify` | string | — | Row/column only: CSS `justify-content` (`"center"`, `"space-between"`, ...). |
| `columns` | number | `3` | Grid only: fixed number of columns. |
| `minChildWidth` | number \| string | — | Grid only: makes the grid **responsive**. Columns become `repeat(auto-fit, minmax(minChildWidth, 1fr))` instead of a fixed count — as many columns as fit, each at least this wide. A number is pixels. Overrides `columns`. |
| `title` | string | — | Optional heading rendered **above** the layout's content, in all directions (it does not participate in the flex/grid flow). |

Layouts also accept the common element properties below (for layouts, `padding` and `margin` default to `0`).

## Common element properties (all elements)

Every element in a layout tree — layouts and visuals alike — supports these:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | string | — | The element type: `"layout"`, `"modal"`, or a visual type key (`"table"`, `"kpi"`, `"pie"`, `"tabs"`, ...). See [How element types are resolved](#how-element-types-are-resolved). |
| `id` | string | — | Visuals only: a unique id that makes the visual a navigation anchor ([Links & Navigation](links-and-navigation.md)) and enables [persistent view state](persistent-view-state.md). The validator warns on duplicates. |
| `padding` | number | `10` (visuals), `0` (layouts) | Inner padding in pixels. `0` is honored. |
| `margin` | number | `0` | Outer margin in pixels. Spacing between siblings should normally come from the parent layout's `gap` instead. |
| `border` | boolean \| string | off | `true` renders the standard theme border (`1px solid` in the theme's border color); a string is applied verbatim as the CSS `border` value, e.g. `"2px dashed #f59e0b"`. |
| `shadow` | boolean \| string | off | `true` renders the standard theme drop shadow; a string is applied verbatim as the CSS `box-shadow` value. |
| `flex` | number | `1` | Flex grow factor relative to siblings. `flex: 0` keeps the element at its **natural size** (it does not stretch). Higher numbers take proportionally more space. |
| `modalId` | string | — | Id of a global modal to open from this element: an expand icon appears in the element's top-right corner on hover. See [Modals](modals.md). |
| `filter` | FilterExpression | — | Visuals only: a client-side filter over this visual's view of its dataset. Other visuals sharing the `datasetId` are unaffected. See [Filtering & Aggregation](filtering-and-aggregation.md). |
| `aggregate` | AggregateSpec | — | Visuals only: group/aggregate this visual's view (applied after `filter`). See [Filtering & Aggregation](filtering-and-aggregation.md). |

Most visuals additionally support `title` and `description` (rendered above and below the visual's content), plus their own type-specific properties — see [Visual Elements](visual-elements.md).

## How element types are resolved

The preferred key is `type`. For backward compatibility, older conventions still work; resolution order:

1. A string `type` always wins: `"type": "layout"` is a layout, `"type": "modal"` is a modal trigger button, anything else is looked up as a visual type.
2. Without a `type`, the legacy `elementType` key is used the same way — including bare visual keys like `"elementType": "pie"`. (`"elementType": "visual"` together with `"type": "gauge"` also works, since `type` wins.)
3. **Fallback:** an object with a `children` array and no resolved visual type is treated as a layout. This is why top-level `rows` entries and nested layouts can omit `"type": "layout"` entirely.
4. Anything else that resolves to an unknown visual type renders an inline red error box ("Unknown component type: ...") and the [validator](validation.md) emits a `[datalys2]` console warning listing the known types.

## Examples

**KPI row**

Four KPIs sharing a row equally. `border` gives each card the standard theme border; the default `gap: 10` separates them:

```json
{
    "direction": "row",
    "title": "Today at a glance",
    "children": [
        { "type": "kpi", "datasetId": "kpis", "valueColumn": "revenue", "title": "Revenue", "format": "currency", "border": true },
        { "type": "kpi", "datasetId": "kpis", "valueColumn": "orders", "title": "Orders", "border": true },
        { "type": "kpi", "datasetId": "kpis", "valueColumn": "aov", "title": "Avg Order", "format": "currency", "border": true },
        { "type": "kpi", "datasetId": "kpis", "valueColumn": "uptime", "title": "Uptime", "format": "percent", "border": true }
    ]
}
```

**Responsive card grid**

With `minChildWidth`, the grid fits as many 240px-plus columns as the viewport allows and reflows on resize — no fixed column count:

```json
{
    "direction": "grid",
    "minChildWidth": 240,
    "gap": 16,
    "title": "Team status",
    "children": [
        { "type": "card", "title": "Core", "text": "All systems normal.", "border": true },
        { "type": "card", "title": "Web", "text": "Deploy scheduled 15:00.", "border": true },
        { "type": "card", "title": "Data", "text": "Backfill running.", "border": true },
        { "type": "card", "title": "Infra", "text": "2 open incidents.", "border": true },
        { "type": "card", "title": "Support", "text": "Queue at 12 tickets.", "border": true }
    ]
}
```

**Fixed-column grid**

Without `minChildWidth`, a grid uses a fixed `columns` count (default 3):

```json
{
    "direction": "grid",
    "columns": 4,
    "children": [
        { "type": "card", "text": "1", "border": true },
        { "type": "card", "text": "2", "border": true },
        { "type": "card", "text": "3", "border": true },
        { "type": "card", "text": "4", "border": true },
        { "type": "card", "text": "5", "border": true },
        { "type": "card", "text": "6", "border": true }
    ]
}
```

**Sidebar-style row with flex ratios**

Flex values size children proportionally: the chart takes three times the sidebar's width. `flex: 0` on the third child keeps it at its natural width:

```json
{
    "direction": "row",
    "children": [
        {
            "type": "layout",
            "direction": "column",
            "flex": 1,
            "children": [
                { "type": "kpi", "datasetId": "kpis", "valueColumn": "revenue", "title": "Revenue", "border": true },
                { "type": "kpi", "datasetId": "kpis", "valueColumn": "orders", "title": "Orders", "border": true }
            ]
        },
        { "type": "line", "datasetId": "trend", "xColumn": "date", "yColumns": "revenue", "title": "Revenue trend", "flex": 3 },
        { "type": "card", "text": "Notes", "flex": 0, "border": true }
    ]
}
```

**Nested column-in-row dashboard**

A classic dashboard shell: a wide chart beside a narrow column of summaries, above a full-width table. Two rows on the page, the first nesting a column inside a row:

```json
[
    {
        "direction": "row",
        "children": [
            { "type": "area", "datasetId": "trend", "xColumn": "date", "yColumns": "revenue", "title": "Revenue", "flex": 2 },
            {
                "type": "layout",
                "direction": "column",
                "flex": 1,
                "children": [
                    { "type": "gauge", "datasetId": "kpis", "valueColumn": "csat", "title": "CSAT", "minValue": 0, "maxValue": 100 },
                    { "type": "pie", "datasetId": "byRegion", "categoryColumn": "region", "valueColumn": "total", "title": "By region" }
                ]
            }
        ]
    },
    {
        "direction": "row",
        "children": [
            { "type": "table", "datasetId": "orders", "title": "Recent orders" }
        ]
    }
]
```

**Wrapping chip row**

`wrap: true` lets `flex: 0` children flow onto multiple lines like chips or badges instead of squeezing into one row. `align`/`justify` control cross-axis and main-axis placement:

```json
{
    "direction": "row",
    "wrap": true,
    "align": "center",
    "gap": 8,
    "children": [
        { "type": "card", "text": "region: West", "flex": 0, "border": true },
        { "type": "card", "text": "period: Q2", "flex": 0, "border": true },
        { "type": "card", "text": "currency: USD", "flex": 0, "border": true },
        { "type": "link", "targetId": "orders-table", "label": "Jump to orders", "flex": 0 }
    ]
}
```

**Header-style row with justify**

`flex: 0` on every child plus `justify: "space-between"` pins children to the edges:

```json
{
    "direction": "row",
    "align": "center",
    "justify": "space-between",
    "children": [
        { "type": "card", "text": "Sales Report", "flex": 0 },
        { "type": "link", "href": "https://example.com/methodology", "label": "Methodology", "flex": 0 }
    ]
}
```

**Per-visual filters: three views of one dataset**

Any visual can carry `filter`/`aggregate` — each child sees its own slice of the shared dataset:

```json
{
    "direction": "row",
    "title": "Same dataset, three views",
    "children": [
        { "type": "table", "datasetId": "sales", "title": "All" },
        {
            "type": "table",
            "datasetId": "sales",
            "title": "West only",
            "filter": { "column": "region", "op": "eq", "value": "West" }
        },
        {
            "type": "clusteredBar",
            "datasetId": "sales",
            "title": "Total by region",
            "aggregate": {
                "groupBy": ["region"],
                "aggregates": [{ "column": "amount", "fn": "sum", "as": "total" }]
            },
            "xColumn": "region",
            "yColumns": "total"
        }
    ]
}
```

**Untyped layout and legacy keys**

Both of these render as layouts — the first through the `children` fallback, the second through the legacy `elementType` key:

```json
{
    "direction": "row",
    "children": [
        { "type": "card", "text": "No type key needed when children[] is present", "border": true },
        { "elementType": "pie", "datasetId": "byRegion", "categoryColumn": "region", "valueColumn": "total" }
    ]
}
```

## Tips & gotchas

- Spacing comes from the layout's `gap` (default 10px), not from element margins. If spacing looks doubled, check for explicit `margin` values left over from pre-0.3.0 configs.
- `flex: 0` is meaningful: the element keeps its natural size. Pre-0.3.0 it was silently coerced to `1`; if an old config relied on that, set `flex: 1` explicitly. Likewise `padding: 0` and `margin: 0` are honored, not replaced by defaults.
- `border` and `shadow` accept `true` for the standard theme style or a CSS string for custom styling (`"border": "2px dashed #f59e0b"`, `"shadow": "0 4px 12px rgba(0,0,0,0.25)"`). Prefer `true` when you want the consistent theme look across light and dark modes.
- `wrap`, `align`, and `justify` only apply to `row`/`column` directions; `columns` and `minChildWidth` only apply to `grid`. In a grid, children's `flex` values have no effect — every cell is sized by the grid template.
- A layout `title` renders above the content in all directions and does not consume a grid cell or flex slot.
- The validator warns about layouts with no children, unknown `direction` values (anything other than `row`, `column`, `grid`), pages with no rows, unknown visual types, and duplicate visual `id`s — watch the console for `[datalys2]` messages while authoring. See [Validation](validation.md).
- Elements with `modalId` (and visuals with an `id`) are wrapped in an extra flex container that carries the element's `flex` value — sizing behaves the same, but keep it in mind when inspecting the DOM.
- Tabs (`type: "tabs"`) are a container **visual**, not a layout: each tab holds its own `children` or a full `layout` object. Use them anywhere a visual can go — see [visuals/tabs.md](visuals/tabs.md).
- Modal trigger buttons inside layouts (`"type": "modal"` with an `id` and `buttonLabel`) default to `flex: 0` — they size like buttons, not panels. See [Modals](modals.md).

## Related

- [Getting Started](getting-started.md) — the HTML skeleton around `pages`
- [Visual Elements](visual-elements.md) — every visual you can place in a layout ([visuals/kpi.md](visuals/kpi.md), [visuals/table.md](visuals/table.md), [visuals/card.md](visuals/card.md), [visuals/tabs.md](visuals/tabs.md), [visuals/link.md](visuals/link.md), ...)
- [Filtering & Aggregation](filtering-and-aggregation.md) — the per-visual `filter`/`aggregate` props
- [Modals](modals.md) — `modalId` and trigger buttons
- [Links & Navigation](links-and-navigation.md) — visual `id`s as anchors
- [Validation](validation.md) — layout-related console warnings
- Working test pages: [../test-layouts.html](../test-layouts.html), [../test-tabs.html](../test-tabs.html), [../test-filters.html](../test-filters.html)
