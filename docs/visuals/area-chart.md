# Area Chart (`type: "area"`)

The area chart is a line chart with the region between each line and the X-axis filled in. It supports every line-chart property (multi-series, smoothing, labels, thresholds, annotations) plus three of its own: `fillOpacity`, `showLine`, and `showMarkers`.

**Multi-series areas are not stacked.** Each series is drawn independently from the baseline up to its own values, so series overlap and show through each other via the translucent fill (`fillOpacity` defaults to `0.3`). If you want parts to sum to a whole, use a [stacked bar chart](bar-charts.md) instead.

Like the line chart, the area chart is responsive (`width` is only the initial width), shows a hover tooltip on each marker, and renders a collapsible legend with per-series totals and percentages.

## Minimal example

```json
{
    "pages": [
        {
            "title": "Traffic",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "area",
                            "id": "visitors-area",
                            "datasetId": "daily",
                            "xColumn": "Day",
                            "yColumns": ["Visitors"],
                            "title": "Daily Visitors"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "daily": {
            "format": "table",
            "columns": ["Day", "Visitors"],
            "data": [
                ["Mon", 320],
                ["Tue", 410],
                ["Wed", 380],
                ["Thu", 450],
                ["Fri", 390]
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
| `xColumn` | `string \| number` | `0` | Column (name or index) for the X-axis. `Date` values are printed as `YYYY-MM-DD` (UTC). |
| `yColumns` | `string \| string[]` | `[1]` | Column(s) for the Y-axis; each entry becomes one area series. |
| `fillOpacity` | `number` | `0.3` | Opacity of the area fill, clamped to 0–1. `0` hides the fill entirely (line-only chart). |
| `showLine` | `boolean` | `true` | Draw the 2px line stroke on top of the fill. |
| `showMarkers` | `boolean` | `true` | Draw the interactive point markers (and their tooltips). |
| `title` | `string` | — | Heading rendered above the chart. |
| `description` | `string` | — | Description paragraph rendered under the title. |
| `width` | `number` | `600` | Initial chart width in pixels (chart tracks its container width). |
| `height` | `number` | `400` | Chart height in pixels. |
| `minY` | `number` | `0` | Fixed minimum for the Y-axis (also the fill baseline). |
| `maxY` | `number` | data max | Fixed maximum for the Y-axis. |
| `xAxisLabel` | `string` | — | Bold label centered under the X-axis. |
| `yAxisLabel` | `string` | — | Bold label rotated alongside the Y-axis. |
| `chartMargin` | `object` | `{"top": 20, "right": 20, "bottom": 50, "left": 50}` | Partial override of the plot margins. |
| `colors` | `string \| string[]` | Tableau10 | Series colors: array of CSS colors, single color, or a D3 scheme/interpolator name (`"Set2"`, `"viridis"`, ...). |
| `smooth` | `boolean` | `false` | Monotone cubic interpolation for both the line and the fill edge. |
| `showLegend` | `boolean` | `true` | Show the collapsible legend table. |
| `legendTitle` | `string` | `"Legend"` | Custom heading for the legend. |
| `showLabels` | `boolean` | `false` | Print each point's value above its marker. Requires `showMarkers: true`. |
| `threshold` | `ThresholdConfig` | — | Pass/fail coloring of fill, line, and markers. See [Thresholds](../thresholds.md). |
| `otherElements` | `array` | — | Annotations: trend lines, reference axes, markers, labels. See [Visual Elements](../visual-elements.md). |
| `filter` | `FilterExpression` | — | Per-visual filter over the dataset. See [Filtering & Aggregation](../filtering-and-aggregation.md). |
| `aggregate` | `AggregateSpec` | — | Per-visual group/aggregate (applied after `filter`). |

Common styling properties (`padding` default `10`, `margin` default `0`, `border`, `shadow`, `flex` default `1`, `modalId`) also apply — see [Pages & Layouts](../pages-and-layouts.md).

## Examples

**Basic single series, smoothed**

```json
{
    "type": "area",
    "datasetId": "daily",
    "xColumn": "Day",
    "yColumns": ["Visitors"],
    "title": "Visitors",
    "smooth": true,
    "yAxisLabel": "Visitors"
}
```

**Multi-series overlapping areas**

Both series are drawn from the baseline, so the translucent fills overlap. Keep `fillOpacity` low so the smaller series stays visible.

```json
{
    "type": "area",
    "datasetId": "channels",
    "xColumn": "Week",
    "yColumns": ["Organic", "Paid"],
    "title": "Traffic by Channel",
    "fillOpacity": 0.25,
    "legendTitle": "Channels"
}
```

with a dataset such as:

```json
{
    "channels": {
        "format": "table",
        "columns": ["Week", "Organic", "Paid"],
        "data": [
            ["W1", 900, 400],
            ["W2", 1050, 520],
            ["W3", 980, 610],
            ["W4", 1200, 580]
        ]
    }
}
```

**Styled fills with custom colors**

Heavier fill, custom palette, and a fixed Y domain for a bold "mountain" look.

```json
{
    "type": "area",
    "datasetId": "channels",
    "xColumn": "Week",
    "yColumns": ["Organic", "Paid"],
    "title": "Traffic (styled)",
    "smooth": true,
    "fillOpacity": 0.55,
    "colors": ["#0ea5e9", "#f97316"],
    "minY": 0,
    "maxY": 1500
}
```

**Threshold with `applyTo`**

`applyTo: "markers"` keeps the series color on the fill and line but recolors each marker green/red by pass/fail. Use `"lines"` for the opposite, or `"both"` (the default) for everything. Full reference: [Thresholds](../thresholds.md).

```json
{
    "type": "area",
    "datasetId": "daily",
    "xColumn": "Day",
    "yColumns": ["Visitors"],
    "title": "Visitors vs Target",
    "minY": 0,
    "maxY": 500,
    "threshold": {
        "value": 400,
        "mode": "above",
        "applyTo": "markers",
        "showLine": true,
        "lineStyle": "dotted"
    }
}
```

**Markers off**

Hide the point circles for a clean filled silhouette. Note that hover tooltips and `showLabels` are attached to the markers, so both disappear with them.

```json
{
    "type": "area",
    "datasetId": "daily",
    "xColumn": "Day",
    "yColumns": ["Visitors"],
    "title": "Visitors (clean)",
    "smooth": true,
    "showMarkers": false,
    "fillOpacity": 0.4
}
```

**Fill only, no line**

Turn off the stroke for a soft band; or set `fillOpacity: 0` with `showLine: true` to get a plain line chart with the area chart's marker toggles.

```json
{
    "type": "area",
    "datasetId": "daily",
    "xColumn": "Day",
    "yColumns": ["Visitors"],
    "title": "Visitors (band)",
    "showLine": false,
    "fillOpacity": 0.5,
    "showMarkers": false
}
```

## Tips & gotchas

- **`showLabels` needs `showMarkers`.** Value labels are rendered as part of the marker layer, so `showLabels: true` has no effect when `showMarkers` is `false`. The same goes for hover tooltips.
- **Series are not stacked.** With multiple `yColumns`, later series can visually hide earlier ones if `fillOpacity` is high. Order `yColumns` largest-first or keep opacity low.
- **The fill baseline is the bottom of the plot** (the `minY` value, default 0). Raising `minY` visually truncates the fill, which can exaggerate differences.
- **Misspelled column names fall back to column 0** silently rather than erroring.
- **Negative values** extend below the plot area unless you set a negative `minY`.
- **Empty or missing datasets** render "No data available." instead of failing.
- **Date X values**: declare the column dtype as `"date"`/`"datetime"` so ISO strings and epoch values are parsed; they print as `YYYY-MM-DD` in UTC. The axis is categorical and evenly spaced regardless of gaps between dates.
- With a threshold and `applyTo: "both"` or `"lines"`, the pass/fail gradient is applied to **both the fill and the stroke**; the series color from `colors` is only visible on markers when `applyTo` is `"lines"`.

## Related

- [Line chart](line-chart.md) — same chart without the fill
- [Bar charts](bar-charts.md) — use `stackedBar` when parts should sum to a whole
- [Thresholds](../thresholds.md) — full `threshold` reference
- [Visual Elements](../visual-elements.md) — `otherElements` reference
- Live examples: [test-area-chart-threshold.html](../../test-area-chart-threshold.html), [test-all-visuals.html](../../test-all-visuals.html)
