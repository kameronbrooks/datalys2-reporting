# Visual Elements (`otherElements`)

Visual elements are annotations layered on top of a chart: reference lines, trend curves, markers, and text labels. You add them with the `otherElements` array on a chart visual's config. Elements are drawn above the data, never capture mouse events, and use the chart's own scales — so their `value`s are expressed in data units (a Y value, an X value, or a category name), not pixels.

## Which visuals render `otherElements`?

Verified against the source: the annotation layer is rendered by exactly these visuals —

| Visual | `trend` | `xAxis` / `yAxis` | `marker` | `label` |
|--------|---------|-------------------|----------|---------|
| [Scatter Plot](visuals/scatter-plot.md) (`scatter`) | Yes | Yes | Yes | Yes |
| [Line Chart](visuals/line-chart.md) (`line`) | Yes | Yes | Yes | Yes |
| [Area Chart](visuals/area-chart.md) (`area`) | Yes | Yes | Yes | Yes |
| [Bar Charts](visuals/bar-charts.md) (`stackedBar`, `clusteredBar`) | Yes | Yes | Yes | Yes |
| [Histogram](visuals/histogram.md) (`histogram`) | Yes | Yes | Yes | Yes |

All other visuals — pie, heatmap, box plot, gauge, table, KPI, card, checklist, tabs, link — ignore `otherElements` entirely.

`trend` coefficients are evaluated over a numeric X domain. On charts with a numeric X axis (scatter, histogram) that is the axis's own value range. On charts with a **categorical** X axis (line, area, bar charts), `x` is the **0-based category index** — the first category is `x = 0`, the second `x = 1`, and so on. Unknown `visualElementType` values are silently skipped.

## Common properties

Every element accepts these:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `visualElementType` | `string` | — | **Required.** One of `"trend"`, `"xAxis"`, `"yAxis"`, `"marker"`, `"label"`. |
| `color` | `string` | inherits text color | Stroke color for lines/shapes, fill color for label text. |
| `lineStyle` | `"solid" \| "dashed" \| "dotted"` | `"solid"` | Line pattern (dashed = `6 4`, dotted = `2 4`). Not used by `label`. |
| `lineWidth` | `number` | `2` for trend, `1` for others | Line stroke width in pixels. Not used by `label`. |
| `label` | `string` | — | Text attached to the element. For `xAxis`/`yAxis` it is drawn next to the line; for `label` elements it is the displayed text itself. |

## Element types

### Trend (`visualElementType: "trend"`)

Draws a polynomial curve `y = c0 + c1·x + c2·x² + …` across the chart's full X domain, sampled at 80 points.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `coefficients` | `number[]` | — | **Required.** Polynomial coefficients in ascending order: `[intercept, slope]` for a straight line, `[c0, c1, c2]` for a quadratic, and so on. Any degree is supported. |

On numeric X axes (scatter, histogram), `x` is the axis value. On categorical X axes (line, area, bar charts), `x` is the 0-based category index — so `"coefficients": [100, 5.5]` means "100 at the first category, rising 5.5 per category".

### Reference lines (`visualElementType: "xAxis"` / `"yAxis"`)

Straight reference lines across the whole plot area. Note the naming: **`xAxis` draws a horizontal line** (parallel to the X axis) at a **Y value**, and **`yAxis` draws a vertical line** at an **X value**.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number \| string` | `xAxis`: chart baseline; `yAxis`: left edge | Where to place the line, in data units. For `yAxis` on a category axis (line/area/bar charts), pass the category name as a string; the line is centered on that category's band. |

The optional `label` is drawn just above the right end of an `xAxis` line, or at the top of a `yAxis` line.

### Marker (`visualElementType: "marker"`)

A guide line across the chart plus a small solid symbol at its edge (top edge for X-axis markers, left edge for Y-axis markers).

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number \| string` | — | **Required.** Position in data units. Numbers are interpreted on the **Y axis** (horizontal marker line); strings (category names) and dates are interpreted on the **X axis** (vertical marker line). |
| `size` | `number` | `8` | Symbol size in pixels. |
| `shape` | `"circle" \| "square" \| "triangle"` | `"circle"` | Symbol shape. |

### Label (`visualElementType: "label"`)

A standalone piece of text anchored at a value.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number \| string` | — | **Required.** Anchor position. Numbers anchor on the **Y axis** (text near the left edge, just above that Y value); strings/dates anchor on the **X axis** (text centered on the category, near the bottom of the plot). |
| `fontSize` | `number` | `12` | Font size in pixels. |
| `fontWeight` | `"normal" \| "bold" \| "bolder" \| "lighter"` | `"normal"` | Font weight. |

The displayed text is the common `label` property; if omitted, the `value` itself is printed.

## Examples

**Target reference line on a line chart**

A dashed horizontal line at the revenue target. On line/area/bar charts, `xAxis` (horizontal at a Y value) is the workhorse element:

```json
{
    "type": "line",
    "datasetId": "salesData",
    "xColumn": "Month",
    "yColumns": ["Revenue"],
    "otherElements": [
        {
            "visualElementType": "xAxis",
            "value": 5000,
            "color": "#ef4444",
            "lineStyle": "dashed",
            "lineWidth": 2,
            "label": "Target"
        }
    ]
}
```

**Vertical event line on a category axis**

`yAxis` with a string value draws a vertical line centered on that category — for example, marking a product launch month:

```json
{
    "type": "area",
    "datasetId": "trafficData",
    "xColumn": "Month",
    "yColumns": ["Visits"],
    "otherElements": [
        {
            "visualElementType": "yAxis",
            "value": "Apr",
            "color": "#8b5cf6",
            "lineStyle": "dotted",
            "label": "v2 launch"
        }
    ]
}
```

**Marker and label annotations on a bar chart**

A triangle marker line at last year's best month, with a bold label pinned to the same value:

```json
{
    "type": "clusteredBar",
    "datasetId": "monthlySales",
    "xColumn": "Month",
    "yColumns": ["Sales"],
    "otherElements": [
        {
            "visualElementType": "marker",
            "value": 8200,
            "shape": "triangle",
            "size": 10,
            "color": "#f59e0b",
            "lineStyle": "dashed",
            "label": "2025 record"
        },
        {
            "visualElementType": "label",
            "value": 8200,
            "label": "2025 record: 8,200",
            "color": "#f59e0b",
            "fontSize": 12,
            "fontWeight": "bold"
        }
    ]
}
```

**Trend line on a scatter plot**

A quadratic fit supplied as coefficients (`y = 40 + 2.5x - 0.05x²`) — use this instead of `showTrendline` when you want a styled or non-linear fit computed offline:

```json
{
    "type": "scatter",
    "datasetId": "examData",
    "xColumn": "HoursStudied",
    "yColumn": "Score",
    "otherElements": [
        {
            "visualElementType": "trend",
            "coefficients": [40, 2.5, -0.05],
            "color": "#0ea5e9",
            "lineStyle": "dashed",
            "lineWidth": 2,
            "label": "Fitted curve"
        }
    ]
}
```

**Combined: band of context on one chart**

Multiple elements stack in array order (later elements draw on top). Here a line chart gets a target line, a warning floor, an event line, and a label:

```json
{
    "type": "line",
    "datasetId": "uptimeData",
    "xColumn": "Week",
    "yColumns": ["UptimePct"],
    "minY": 95,
    "maxY": 100,
    "otherElements": [
        {
            "visualElementType": "xAxis",
            "value": 99.9,
            "color": "#22c55e",
            "lineStyle": "dashed",
            "label": "SLA 99.9%"
        },
        {
            "visualElementType": "xAxis",
            "value": 99.0,
            "color": "#ef4444",
            "lineStyle": "dotted",
            "label": "Alert floor"
        },
        {
            "visualElementType": "yAxis",
            "value": "W14",
            "color": "#94a3b8",
            "lineStyle": "dotted",
            "label": "Region failover"
        },
        {
            "visualElementType": "label",
            "value": 99.95,
            "label": "Best quarter yet",
            "fontWeight": "bold",
            "color": "#22c55e"
        }
    ]
}
```

## Tips & gotchas

- **Data units, not pixels.** All `value`s go through the chart's scales. A value outside the chart's current domain places the element off-plot (it may be invisible or clipped).
- **Axis-direction naming is inverted from what you might expect:** `xAxis` = horizontal line at a Y value; `yAxis` = vertical line at an X value.
- **Marker/label axis inference is by value type.** A numeric `value` means "on the Y axis"; a string (or date) means "on the X axis". To mark a numeric X position on a scatter plot, use a `yAxis` reference line instead of a marker — a numeric marker value is always read as a Y value.
- **Category values must match exactly.** For `yAxis`/marker/label on a category axis, the string must equal the category label as rendered (dates are compared against their printed form). A non-matching value renders nothing.
- **Trend x-units differ by axis type.** On numeric X axes the coefficients are in data units; on categorical X axes (line, area, bars) they are in category-index units (`x = 0` is the first category). A fit computed against real X values (e.g. years) must be re-expressed in index terms before it will line up on a categorical chart.
- Omitting `value` on `xAxis` draws the line along the chart bottom; omitting it on `yAxis` draws it along the left edge — mostly useful for re-styling the chart frame.
- Elements never capture the mouse, so tooltips and hover effects of the underlying chart keep working through them.
- If an element does not appear, check the visual support table above first — visuals without the annotation layer ignore `otherElements` without any warning.

## Related

- [Scatter Plot](visuals/scatter-plot.md), [Line Chart](visuals/line-chart.md), [Area Chart](visuals/area-chart.md), [Bar Charts](visuals/bar-charts.md), [Histogram](visuals/histogram.md)
- [Thresholds](thresholds.md) — automatic pass/fail coloring with a built-in threshold line
- [Formatting](formatting.md)
- [Getting Started](getting-started.md)
