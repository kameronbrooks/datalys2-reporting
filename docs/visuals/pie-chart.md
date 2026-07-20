# Pie Chart (`type: "pie"`)

The pie chart shows how a total splits into categories. Each dataset row becomes one slice: `categoryColumn` supplies the label and `valueColumn` the size. Slices keep the dataset's row order (they are not sorted by size).

Built-in behavior you get for free:

- **Slice labels with leader lines** are drawn automatically for every slice that is at least 2% of the total; smaller slices stay unlabeled to avoid clutter.
- **Hover tooltip** showing the label, value, and percentage; the hovered slice grows slightly and the others dim.
- **Collapsible legend** below the chart listing each category with its value and percentage.

Note that `innerRadius` defaults to `40`, so the default rendering is a small-holed donut. Set `innerRadius: 0` for a classic solid pie.

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
                            "type": "pie",
                            "id": "sales-share",
                            "datasetId": "byCategory",
                            "categoryColumn": "Category",
                            "valueColumn": "Sales",
                            "title": "Sales by Category"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "byCategory": {
            "format": "table",
            "columns": ["Category", "Sales"],
            "data": [
                ["Electronics", 4200],
                ["Clothing", 3100],
                ["Home", 1800],
                ["Toys", 900]
            ]
        }
    }
}
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `datasetId` | `string` | required | Key of the dataset in the `datasets` object. |
| `id` | `string` | — | Unique identifier; enables in-document links and persistent view state. |
| `categoryColumn` | `string \| number` | `0` | Column (name or index) for slice labels. `Date` values print as `YYYY-MM-DD` (UTC). |
| `valueColumn` | `string \| number` | `1` | Column for slice sizes (numeric). |
| `title` | `string` | — | Heading rendered above the chart. |
| `description` | `string` | — | Description paragraph rendered under the title. |
| `width` | `number` | `320` | Initial chart width in pixels (chart tracks its container width). |
| `height` | `number` | `320` | Chart height in pixels. |
| `innerRadius` | `number` | `40` | Hole radius in pixels. `0` = solid pie; larger values = donut. Clamped to the pie's outer radius. |
| `cornerRadius` | `number` | `0` | Rounds the corners of each slice, in pixels. |
| `padAngle` | `number` | `0` | Gap between slices, in radians (e.g. `0.02` for thin separators). |
| `chartMargin` | `object` | `{"top": 50, "right": 50, "bottom": 50, "left": 50}` | Partial override of the margins around the pie (labels render in this space). |
| `colors` | `string \| string[]` | Tableau10 | Slice colors: array of CSS colors, single color, or a D3 scheme/interpolator name (`"Set2"`, `"pastel1"`, `"viridis"`, ...). Colors are assigned to categories in order and repeat if there are more slices than colors. |
| `showLegend` | `boolean` | `true` | Show the collapsible legend table (category, value, %). |
| `legendTitle` | `string` | `"Legend"` | Custom heading for the legend. |
| `filter` | `FilterExpression` | — | Per-visual filter over the dataset. See [Filtering & Aggregation](../filtering-and-aggregation.md). |
| `aggregate` | `AggregateSpec` | — | Per-visual group/aggregate (applied after `filter`). |

Common styling properties (`padding` default `10`, `margin` default `0`, `border`, `shadow`, `flex`, `modalId`) also apply — see [Pages & Layouts](../pages-and-layouts.md).

## Examples

**Basic solid pie**

Set `innerRadius: 0` to remove the default hole.

```json
{
    "type": "pie",
    "datasetId": "byCategory",
    "categoryColumn": "Category",
    "valueColumn": "Sales",
    "innerRadius": 0,
    "title": "Sales by Category"
}
```

**Donut with slice separators**

A large `innerRadius` makes a donut; `padAngle` and `cornerRadius` give the modern segmented look.

```json
{
    "type": "pie",
    "datasetId": "byCategory",
    "categoryColumn": "Category",
    "valueColumn": "Sales",
    "innerRadius": 80,
    "padAngle": 0.03,
    "cornerRadius": 4,
    "title": "Sales Share"
}
```

**Legend styling and custom colors**

Give the legend a meaningful heading and pin brand colors per slice (assigned to categories in row order). Set `showLegend: false` to rely on the built-in slice labels and tooltip alone.

```json
{
    "type": "pie",
    "datasetId": "byCategory",
    "categoryColumn": "Category",
    "valueColumn": "Sales",
    "title": "Sales by Category",
    "legendTitle": "Product Category",
    "colors": ["#2563eb", "#f59e0b", "#10b981", "#ef4444"]
}
```

**Aggregate-fed pie from a derived dataset**

Pies want one row per category. Derive a grouped dataset from raw rows with `source` + `aggregate`, then point the pie at the aggregate output column (`as`, default `"<fn>_<column>"`).

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
                            "type": "pie",
                            "datasetId": "salesByRegion",
                            "categoryColumn": "Region",
                            "valueColumn": "TotalAmount",
                            "title": "Order Amount by Region"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "orders": {
            "format": "records",
            "columns": ["Region", "Amount"],
            "data": [
                { "Region": "North", "Amount": 120 },
                { "Region": "North", "Amount": 90 },
                { "Region": "South", "Amount": 200 },
                { "Region": "West", "Amount": 75 },
                { "Region": "West", "Amount": 130 }
            ]
        },
        "salesByRegion": {
            "source": "orders",
            "aggregate": {
                "groupBy": ["Region"],
                "aggregates": [
                    { "column": "Amount", "fn": "sum", "as": "TotalAmount" }
                ]
            }
        }
    }
}
```

The same `aggregate` spec can also be placed directly on the pie visual itself (alongside `datasetId: "orders"`) if no other visual needs the grouped data.

**Filtered pie**

A per-visual `filter` narrows the slices without affecting other visuals that share the dataset.

```json
{
    "type": "pie",
    "datasetId": "byCategory",
    "categoryColumn": "Category",
    "valueColumn": "Sales",
    "title": "Major Categories Only",
    "filter": { "column": "Sales", "op": "gte", "value": 1000 }
}
```

## Tips & gotchas

- **The default is a donut.** `innerRadius` defaults to `40`; set it to `0` if you expect a solid pie.
- **Aggregate first.** The pie does not merge duplicate categories — two rows with the same label become two separate slices. Group the data with an `aggregate` (visual-level or derived dataset) when the source has multiple rows per category.
- **Negative values are clamped to 0** (they render as zero-width slices), and rows whose value is not a finite number are dropped entirely. If every row is dropped you get "No data available."
- **Slices under 2% get no label**, but they still appear in the legend and tooltip. With many tiny categories, consider filtering or aggregating into an "Other" bucket upstream.
- **Labels need margin.** Slice labels and their leader lines are drawn outside the pie, inside the 50px default `chartMargin`. If long labels are clipped, increase the relevant margins or the visual `width`.
- **Misspelled column names fall back to column 0** silently instead of erroring — a pie whose slice sizes look like row labels usually means `valueColumn` is misspelled.
- **Slice order is row order**; sort the dataset rows if you want largest-first slices.
- **No `otherElements` or `threshold`** — the pie chart does not support annotation overlays or threshold coloring.

## Related

- [Bar charts](bar-charts.md) — better than multiple pies for comparing composition across groups
- [Gauge](gauge.md), [KPI](kpi.md) — single-value alternatives
- [Filtering & Aggregation](../filtering-and-aggregation.md) — derived datasets, `filter`, `aggregate`
- Live examples: [test.html](../../test.html), [test-all-visuals.html](../../test-all-visuals.html)
