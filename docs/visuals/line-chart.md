# Line Chart (`type: "line"`)

The line chart plots one or more numeric series against a shared X-axis of categories or dates. Each row of the dataset becomes one X position; each entry in `yColumns` becomes one line. Points are rendered as interactive markers with a hover tooltip (`<x label> / <series>: <value>`), and a collapsible legend below the chart lists each series with its total and percentage share.

The chart is responsive: `width` sets the initial width, but the SVG resizes to fill its container. The X-axis automatically thins its tick labels so that at most about 10 are shown, which keeps long time series readable.

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
                            "type": "line",
                            "id": "revenue-trend",
                            "datasetId": "monthly",
                            "xColumn": "Month",
                            "yColumns": ["Revenue"],
                            "title": "Monthly Revenue"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "monthly": {
            "format": "table",
            "columns": ["Month", "Revenue"],
            "data": [
                ["Jan", 4200],
                ["Feb", 4800],
                ["Mar", 5100],
                ["Apr", 4650]
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
| `xColumn` | `string \| number` | `0` | Column (name or index) for the X-axis. Values become categorical labels; `Date` values are printed as `YYYY-MM-DD` (UTC). |
| `yColumns` | `string \| string[]` | `[1]` | Column(s) for the Y-axis. A plain string is treated as a single series; each array entry becomes its own line, named after the column. |
| `title` | `string` | — | Heading rendered above the chart. |
| `description` | `string` | — | Description paragraph rendered under the title. |
| `width` | `number` | `600` | Initial chart width in pixels (the chart then tracks its container width). |
| `height` | `number` | `400` | Chart height in pixels. |
| `minY` | `number` | `0` | Fixed minimum for the Y-axis. |
| `maxY` | `number` | data max | Fixed maximum for the Y-axis. Defaults to the largest value across all series. |
| `xAxisLabel` | `string` | — | Bold label centered under the X-axis. |
| `yAxisLabel` | `string` | — | Bold label rotated alongside the Y-axis. |
| `chartMargin` | `object` | `{"top": 20, "right": 20, "bottom": 50, "left": 50}` | Partial override of the plot margins, e.g. `{"left": 80}`. |
| `colors` | `string \| string[]` | Tableau10 | Series colors. Accepts an array of CSS colors, a single color, or a D3 scheme/interpolator name such as `"Category10"`, `"Set2"`, `"viridis"`. |
| `smooth` | `boolean` | `false` | Use monotone cubic interpolation instead of straight segments. |
| `showLegend` | `boolean` | `true` | Show the collapsible legend table (series, total value, % share). |
| `legendTitle` | `string` | `"Legend"` | Custom heading for the legend. |
| `showLabels` | `boolean` | `false` | Print each point's value above its marker. |
| `threshold` | `ThresholdConfig` | — | Pass/fail coloring of lines and markers. See [Thresholds](../thresholds.md). |
| `otherElements` | `array` | — | Annotations: trend lines, reference axes, markers, labels. See [Visual Elements](../visual-elements.md). |
| `filter` | `FilterExpression` | — | Per-visual filter over the dataset. See [Filtering & Aggregation](../filtering-and-aggregation.md). |
| `aggregate` | `AggregateSpec` | — | Per-visual group/aggregate (applied after `filter`). |

Common styling properties (`padding` default `10`, `margin` default `0`, `border`, `shadow`, `flex` default `1`, `modalId`) also apply — see [Pages & Layouts](../pages-and-layouts.md).

## Examples

**Single series**

The simplest chart: one X column, one Y column. `yColumns` may be a plain string instead of an array.

```json
{
    "type": "line",
    "datasetId": "monthly",
    "xColumn": "Month",
    "yColumns": "Revenue",
    "title": "Revenue",
    "yAxisLabel": "USD"
}
```

**Multi-series with legend**

Each entry in `yColumns` becomes its own line, colored from the palette in order. The legend lists every series with its total and share.

```json
{
    "type": "line",
    "datasetId": "regionSales",
    "xColumn": "Quarter",
    "yColumns": ["North", "South", "West"],
    "title": "Sales by Region",
    "showLegend": true,
    "legendTitle": "Regions",
    "xAxisLabel": "Quarter",
    "yAxisLabel": "Units Sold"
}
```

with a dataset such as:

```json
{
    "regionSales": {
        "format": "table",
        "columns": ["Quarter", "North", "South", "West"],
        "data": [
            ["Q1", 120, 95, 140],
            ["Q2", 135, 110, 150],
            ["Q3", 128, 105, 165],
            ["Q4", 160, 130, 180]
        ]
    }
}
```

**Smooth curve with value labels**

`smooth` switches to monotone cubic interpolation (curves never overshoot the data), and `showLabels` prints each value above its point.

```json
{
    "type": "line",
    "datasetId": "monthly",
    "xColumn": "Month",
    "yColumns": ["Revenue"],
    "title": "Revenue (smoothed)",
    "smooth": true,
    "showLabels": true
}
```

**Fixed Y domain with custom colors**

Pin the Y-axis so the chart does not rescale between report runs, and assign explicit series colors. `colors` also accepts a D3 scheme name like `"Dark2"`.

```json
{
    "type": "line",
    "datasetId": "regionSales",
    "xColumn": "Quarter",
    "yColumns": ["North", "South"],
    "minY": 0,
    "maxY": 200,
    "colors": ["#2563eb", "#f59e0b"],
    "title": "North vs South"
}
```

**Date-axis time series**

Declare the X column as `"date"` (or `"datetime"`) in `dtypes` so ISO strings are parsed into real dates. The chart prints them as `YYYY-MM-DD` using UTC, which avoids off-by-one-day shifts across timezones.

```json
{
    "pages": [
        {
            "title": "Daily Traffic",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "line",
                            "datasetId": "traffic",
                            "xColumn": "Date",
                            "yColumns": ["Visitors"],
                            "title": "Daily Visitors",
                            "smooth": true
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "traffic": {
            "format": "table",
            "columns": ["Date", "Visitors"],
            "dtypes": ["date", "number"],
            "data": [
                ["2026-06-01", 1250],
                ["2026-06-02", 1310],
                ["2026-06-03", 1180],
                ["2026-06-04", 1420],
                ["2026-06-05", 1390]
            ]
        }
    }
}
```

**Threshold coloring**

Color the line green where values meet the target and red where they miss it, with a gradient blend at each crossing and a dashed reference line at the threshold value. Full option reference: [Thresholds](../thresholds.md).

```json
{
    "type": "line",
    "datasetId": "monthly",
    "xColumn": "Month",
    "yColumns": ["Revenue"],
    "title": "Revenue vs Target",
    "threshold": {
        "value": 5000,
        "mode": "above",
        "passColor": "#22c55e",
        "failColor": "#ef4444",
        "showLine": true,
        "blendWidth": 8
    }
}
```

**Trend-line annotation**

`otherElements` overlays annotations on the plot. A `trend` element draws a polynomial from `coefficients` (`[intercept, slope, ...]`); because the line chart's X axis is categorical, `x` is the 0-based category index — this example starts at 4100 on the first month and rises 180 per month. See [Visual Elements](../visual-elements.md) for markers, axis lines, and labels.

```json
{
    "type": "line",
    "datasetId": "monthly",
    "xColumn": "Month",
    "yColumns": ["Revenue"],
    "title": "Revenue with Trend",
    "otherElements": [
        {
            "visualElementType": "trend",
            "color": "#ef4444",
            "lineStyle": "dashed",
            "coefficients": [4100, 180]
        }
    ]
}
```

## Tips & gotchas

- **Misspelled column names fail silently.** If a string in `xColumn`/`yColumns` does not match any dataset column, the chart falls back to column 0 instead of erroring. If a series looks identical to your X values, check the spelling.
- **The Y-axis starts at 0 by default.** Negative values are drawn below the plot area unless you set `minY` explicitly.
- **`maxY` does not clip.** Values above `maxY` are still drawn (outside the top of the plot); use it to stabilize the axis, not to filter data.
- **Empty or missing datasets** render the chart frame with a "No data available." message rather than failing.
- **The X-axis is categorical**, not a continuous time scale: points are spaced evenly in row order regardless of gaps between dates. Sort your rows by date yourself; the chart draws them in dataset order.
- **Every row is a point.** Non-numeric Y values become `NaN` and break the line at that point.
- **Legend percentages** are each series' total as a share of the grand total across all series — meaningful for additive series, less so for e.g. two unrelated metrics.
- **Dense X-axes** drop tick labels (about 1 in N shown, max ~10) but every point keeps its marker and tooltip.

## Related

- [Area chart](area-chart.md) — the same chart with a filled region below each line
- [Bar charts](bar-charts.md), [Scatter plot](scatter-plot.md)
- [Thresholds](../thresholds.md) — full `threshold` reference
- [Visual Elements](../visual-elements.md) — `otherElements` reference
- [Filtering & Aggregation](../filtering-and-aggregation.md)
- Live examples: [test.html](../../test.html), [test-all-visuals.html](../../test-all-visuals.html)
