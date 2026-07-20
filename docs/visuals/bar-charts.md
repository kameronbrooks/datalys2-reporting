# Bar Charts (`type: "stackedBar"` and `type: "clusteredBar"`)

Datalys2 has two vertical bar chart visuals that share almost the same configuration:

- **Stacked bar** (`type: "stackedBar"`): for each X category, the series are stacked on top of each other into one bar. Use it when the series are **parts of a whole** and you care about the total — e.g. revenue composed of product lines over time.
- **Clustered bar** (`type: "clusteredBar"`): for each X category, the series are drawn side by side as a group of bars. Use it when you want to **compare series against each other** at each category — e.g. this year vs last year per region. Only the clustered bar supports `threshold` pass/fail coloring.

With a single Y column both types render an identical plain bar chart, so pick either; prefer `clusteredBar` if you may want a threshold.

Both charts are responsive (`width` is the initial width), show a hover tooltip per bar/segment (`<x label> / <series>: <value>`), and render a collapsible legend listing each series with its total and percentage share.

## Minimal example

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
                            "type": "clusteredBar",
                            "id": "units-by-quarter",
                            "datasetId": "quarterly",
                            "xColumn": "Quarter",
                            "yColumns": ["Units"],
                            "title": "Units Sold"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "quarterly": {
            "format": "table",
            "columns": ["Quarter", "Units"],
            "data": [
                ["Q1", 320],
                ["Q2", 410],
                ["Q3", 380],
                ["Q4", 450]
            ]
        }
    }
}
```

## Shared properties

These apply to both `stackedBar` and `clusteredBar`:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `datasetId` | `string` | required | Key of the dataset in the `datasets` object. |
| `id` | `string` | — | Unique identifier; enables in-document links and persistent view state. |
| `xColumn` | `string \| number` | `0` | Column (name or index) for the X-axis categories. `Date` values print as `YYYY-MM-DD` (UTC). |
| `yColumns` | `string \| string[]` | `[1]` | Column(s) for the bar values. Each entry is one series (one stack layer / one bar per cluster). A plain string is allowed for a single series. |
| `title` | `string` | — | Heading rendered above the chart. |
| `description` | `string` | — | Description paragraph rendered under the title. |
| `width` | `number` | `600` | Initial chart width in pixels (chart tracks its container width). |
| `height` | `number` | `400` | Chart height in pixels. |
| `minY` | `number` | `0` | Fixed minimum for the Y-axis. |
| `maxY` | `number` | data max | Fixed maximum for the Y-axis. For `stackedBar` the default is the largest **stack total**; for `clusteredBar` it is the largest single value. |
| `xAxisLabel` | `string` | — | Bold label centered under the X-axis. |
| `yAxisLabel` | `string` | — | Bold label rotated alongside the Y-axis. |
| `chartMargin` | `object` | `{"top": 20, "right": 20, "bottom": 50, "left": 50}` | Partial override of the plot margins. |
| `colors` | `string \| string[]` | Tableau10 | Series colors: array of CSS colors, single color, or a D3 scheme/interpolator name (`"Category10"`, `"Set2"`, `"viridis"`, ...). |
| `showLegend` | `boolean` | `true` | Show the collapsible legend table (series, total, % share). |
| `legendTitle` | `string` | `"Legend"` | Custom heading for the legend. |
| `showLabels` | `boolean` | `false` | Print each value inside its bar/segment (white text). Labels are skipped on segments shorter than 15px. |
| `otherElements` | `array` | — | Annotations: trend lines, reference axes, markers, labels. See [Visual Elements](../visual-elements.md). |
| `filter` | `FilterExpression` | — | Per-visual filter over the dataset. See [Filtering & Aggregation](../filtering-and-aggregation.md). |
| `aggregate` | `AggregateSpec` | — | Per-visual group/aggregate (applied after `filter`). |

Common styling properties (`padding` default `10`, `margin` default `0`, `border`, `shadow`, `flex` default `1`, `modalId`) also apply — see [Pages & Layouts](../pages-and-layouts.md).

### Clustered bar only

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `threshold` | `ThresholdConfig` | — | Pass/fail coloring: every bar is colored `passColor` or `failColor` by its own value, and an optional reference line is drawn at the threshold. `blendWidth` and `applyTo` have no effect on bars. See [Thresholds](../thresholds.md). |

`stackedBar` does **not** support `threshold`.

## Stacked bar (`type: "stackedBar"`)

Series are stacked bottom-up in `yColumns` order — the first column is the bottom layer. The Y-axis sizes to the tallest total by default.

**Composition over time**

```json
{
    "type": "stackedBar",
    "datasetId": "revenueMix",
    "xColumn": "Month",
    "yColumns": ["Hardware", "Software", "Services"],
    "title": "Revenue Mix",
    "xAxisLabel": "Month",
    "yAxisLabel": "Revenue (kUSD)",
    "legendTitle": "Product Line"
}
```

with a dataset such as:

```json
{
    "revenueMix": {
        "format": "table",
        "columns": ["Month", "Hardware", "Software", "Services"],
        "data": [
            ["Jan", 120, 80, 40],
            ["Feb", 110, 95, 45],
            ["Mar", 130, 100, 55],
            ["Apr", 125, 115, 60]
        ]
    }
}
```

**Labeled stacked bars with custom colors**

`showLabels` prints each segment's value inside the segment; segments under 15px tall skip their label to avoid clutter.

```json
{
    "type": "stackedBar",
    "datasetId": "revenueMix",
    "xColumn": "Month",
    "yColumns": ["Hardware", "Software", "Services"],
    "title": "Revenue Mix (labeled)",
    "showLabels": true,
    "colors": ["#1d4ed8", "#60a5fa", "#bfdbfe"]
}
```

## Clustered bar (`type: "clusteredBar"`)

Each category gets a group of side-by-side bars, one per Y column.

**Side-by-side comparison**

```json
{
    "type": "clusteredBar",
    "datasetId": "yearOverYear",
    "xColumn": "Region",
    "yColumns": ["Sales2025", "Sales2026"],
    "title": "Sales by Region, Year over Year",
    "legendTitle": "Year",
    "colors": ["#94a3b8", "#0ea5e9"]
}
```

with a dataset such as:

```json
{
    "yearOverYear": {
        "format": "records",
        "columns": ["Region", "Sales2025", "Sales2026"],
        "data": [
            { "Region": "North", "Sales2025": 410, "Sales2026": 480 },
            { "Region": "South", "Sales2025": 380, "Sales2026": 350 },
            { "Region": "West", "Sales2025": 290, "Sales2026": 400 }
        ]
    }
}
```

**Single-series bar chart**

One Y column gives a plain bar chart. `showLegend: false` drops the (single-row) legend.

```json
{
    "type": "clusteredBar",
    "datasetId": "quarterly",
    "xColumn": "Quarter",
    "yColumns": "Units",
    "title": "Units Sold",
    "showLegend": false,
    "showLabels": true
}
```

**Aggregate-fed bars**

The visual-level `aggregate` prop groups and sums raw rows client-side, without changing the dataset for other visuals. Aggregate output columns are named by `as` (default `"<fn>_<column>"`), and you reference those names in `yColumns`.

```json
{
    "type": "clusteredBar",
    "datasetId": "orders",
    "aggregate": {
        "groupBy": ["Region"],
        "aggregates": [
            { "column": "Amount", "fn": "sum", "as": "TotalAmount" }
        ]
    },
    "xColumn": "Region",
    "yColumns": ["TotalAmount"],
    "title": "Total Order Amount by Region",
    "showLegend": false
}
```

with a raw dataset such as:

```json
{
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
    }
}
```

The same spec can instead live on a derived dataset (`"source": "orders"` plus `aggregate`) if several visuals need the grouped data — see [Filtering & Aggregation](../filtering-and-aggregation.md).

**Threshold pass/fail bars**

With a `threshold`, every bar is colored green or red by its own value and a dashed reference line marks the target. `mode: "above"` passes values `>=` the threshold.

```json
{
    "type": "clusteredBar",
    "datasetId": "quarterly",
    "xColumn": "Quarter",
    "yColumns": ["Units"],
    "title": "Units vs Target (400)",
    "showLegend": false,
    "threshold": {
        "value": 400,
        "mode": "above",
        "passColor": "#22c55e",
        "failColor": "#ef4444",
        "showLine": true,
        "lineStyle": "dashed"
    }
}
```

## Tips & gotchas

- **`threshold` overrides `colors` on every bar** of a clustered chart — once a threshold is set, all bars use pass/fail colors and the `applyTo` option is ignored (there are no lines or markers to scope it to). The legend still shows the original series colors.
- **Stacked bars have no threshold support**; putting `threshold` on a `stackedBar` does nothing.
- **Stack order = `yColumns` order**, first column at the bottom.
- **Negative values don't stack meaningfully** in `stackedBar` and extend below the plot in `clusteredBar` unless you set a negative `minY` (the default Y minimum is 0).
- **`showLabels` skips short bars/segments** (under 15px) — with many small values you may see only some labels; that is by design.
- **Misspelled column names fall back to column 0** silently instead of erroring. If your bars mirror the X values, check the spelling of `yColumns`.
- **Many categories**: the X-axis thins tick labels to about 10, but every bar is still drawn; clusters get narrow quickly with several series, so prefer `stackedBar` or fewer series for long time ranges.
- **Empty or missing datasets** render "No data available." instead of failing.
- **`maxY` does not clip** — taller bars simply extend past the top of the plot; use it only to stabilize the axis.

## Related

- [Line chart](line-chart.md), [Area chart](area-chart.md) — trends over continuous ranges
- [Pie chart](pie-chart.md) — composition at a single point in time
- [Histogram](histogram.md) — distribution of a single numeric column
- [Thresholds](../thresholds.md) — full `threshold` reference (clusteredBar)
- [Filtering & Aggregation](../filtering-and-aggregation.md) — `filter`, `aggregate`, derived datasets
- [Visual Elements](../visual-elements.md) — `otherElements` reference
- Live examples: [test.html](../../test.html), [test-all-visuals.html](../../test-all-visuals.html)
