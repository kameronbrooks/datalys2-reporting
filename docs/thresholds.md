# Thresholds

A threshold colors chart elements by whether each value passes or fails a target, so viewers can see at a glance which points meet the goal. You configure it with a `threshold` object on the visual.

Thresholds are supported by three visuals:

| Visual | What gets colored |
|--------|-------------------|
| [Line chart](visuals/line-chart.md) (`type: "line"`) | The line (as a gradient that blends at each crossing) and/or the point markers. |
| [Area chart](visuals/area-chart.md) (`type: "area"`) | The area fill **and** line stroke (gradient), and/or the point markers. |
| [Clustered bar chart](visuals/bar-charts.md) (`type: "clusteredBar"`) | Every bar, solid pass/fail color by its own value. |

Stacked bars, pies, and the other visuals do not support thresholds.

## Minimal example

```json
{
    "pages": [
        {
            "title": "Performance",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "line",
                            "datasetId": "scores",
                            "xColumn": "Week",
                            "yColumns": ["Score"],
                            "title": "Weekly Score vs Target",
                            "threshold": { "value": 80 }
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "scores": {
            "format": "table",
            "columns": ["Week", "Score"],
            "data": [
                ["W1", 85],
                ["W2", 78],
                ["W3", 92],
                ["W4", 74],
                ["W5", 88]
            ]
        }
    }
}
```

Only `value` is required; everything else has sensible defaults (green/red, `mode: "above"`, dashed reference line).

## ThresholdConfig properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number` | **required** | The target value to compare each data value against. |
| `passColor` | `string` | `"#22c55e"` (green) | Color for values that pass. |
| `failColor` | `string` | `"#ef4444"` (red) | Color for values that fail. |
| `mode` | `string` | `"above"` | Pass condition: `"above"`, `"below"`, or `"equals"`. See below. |
| `showLine` | `boolean` | `true` | Draw a horizontal reference line at `value` across the plot. |
| `lineStyle` | `string` | `"dashed"` | Reference line style: `"solid"`, `"dashed"`, or `"dotted"`. |
| `blendWidth` | `number` | `5` | Line/area charts only. Width of the gradient blend zone at each threshold crossing, as a percentage of the chart width. Clamped to 0–50. `0` = hard color change exactly at the crossing. |
| `applyTo` | `string` | `"both"` | Line/area charts only. Which elements get threshold colors: `"both"`, `"markers"`, or `"lines"`. Ignored by `clusteredBar`. |

### `mode` semantics

The comparisons at the boundary are **inclusive** for `above` and `below`:

| Mode | Passes when | Fails when |
|------|-------------|------------|
| `"above"` | `value >= threshold` | `value < threshold` |
| `"below"` | `value <= threshold` | `value > threshold` |
| `"equals"` | `value === threshold` (exact) | anything else |

So with `{"value": 80, "mode": "above"}`, a data point of exactly 80 is colored with `passColor`. `"equals"` uses strict equality — floating-point results that are only approximately equal will fail.

### `applyTo` options (line and area charts)

| Value | Effect |
|-------|--------|
| `"both"` | Lines/areas get the pass/fail gradient and markers get per-point pass/fail colors. |
| `"markers"` | Only markers are recolored; lines/areas keep their series color from `colors`. Best for multi-series charts where you still need to tell the series apart. |
| `"lines"` | Only lines/areas get the gradient; markers keep their series color. |

On a **clustered bar chart** `applyTo` has no effect: as soon as `threshold` is present, every bar is colored by its own pass/fail result and the configured series `colors` are only used in the legend.

### Gradient blending (`blendWidth`, line and area charts)

Where a series crosses the threshold between two points, the crossing X position is found by linear interpolation and the stroke (and area fill) transitions from one color to the other through a gradient:

- `blendWidth: 0` — hard edge: the color flips exactly at the crossing point.
- `blendWidth: 5` (default) — subtle fade over 5% of the chart width on either side of the crossing.
- `blendWidth: 10`–`15` — a wide, clearly visible fade.

The blend zone is measured in percent of the **chart width**, not in data units, so the same setting looks wider on charts with few points. Clustered bar charts ignore `blendWidth` (bars are solid-colored).

### The reference line

When `showLine` is `true` (default), a horizontal line is drawn at `value` in a muted gray (it does not use `passColor`/`failColor`), styled by `lineStyle`. If `value` lies outside the Y-axis range, the line is drawn outside the plot — set `minY`/`maxY` on the visual so the threshold is inside the visible domain.

## Examples

**Line chart — target floor**

Revenue must be at or above 5000. Points at exactly 5000 pass (`above` is inclusive).

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
        "lineStyle": "dashed",
        "blendWidth": 8
    }
}
```

**Area chart — upper limit**

`mode: "below"` inverts the test: values at or under 75 are good. Both the fill and the stroke take the gradient.

```json
{
    "type": "area",
    "datasetId": "temps",
    "xColumn": "Date",
    "yColumns": ["Temperature"],
    "title": "Server Temperature",
    "minY": 0,
    "maxY": 100,
    "threshold": {
        "value": 75,
        "mode": "below",
        "passColor": "#22c55e",
        "failColor": "#ef4444",
        "showLine": true,
        "applyTo": "both"
    }
}
```

**Clustered bar chart — pass/fail bars**

Each bar is solid green or red by its own value. `blendWidth` and `applyTo` would be ignored here.

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
        "showLine": true,
        "lineStyle": "solid"
    }
}
```

**Multi-series, markers only**

With several series, a full gradient makes every line green/red and you can no longer tell the series apart. `applyTo: "markers"` keeps each line's own color and flags only the points.

```json
{
    "type": "line",
    "datasetId": "regionSales",
    "xColumn": "Quarter",
    "yColumns": ["North", "South", "West"],
    "title": "Regional Sales vs Target",
    "colors": ["#2563eb", "#f59e0b", "#10b981"],
    "threshold": {
        "value": 130,
        "mode": "above",
        "applyTo": "markers"
    }
}
```

**Blend-width comparison**

Two copies of the same chart, side by side: a hard edge versus a wide fade.

```json
{
    "type": "layout",
    "direction": "row",
    "children": [
        {
            "type": "area",
            "datasetId": "scores",
            "xColumn": "Week",
            "yColumns": ["Score"],
            "title": "Hard edge (blendWidth: 0)",
            "minY": 0,
            "maxY": 100,
            "threshold": { "value": 80, "blendWidth": 0 }
        },
        {
            "type": "area",
            "datasetId": "scores",
            "xColumn": "Week",
            "yColumns": ["Score"],
            "title": "Wide fade (blendWidth: 15)",
            "minY": 0,
            "maxY": 100,
            "threshold": { "value": 80, "blendWidth": 15 }
        }
    ]
}
```

## Tips & gotchas

- **Boundary values pass.** Both `above` and `below` are inclusive (`>=` / `<=`). If you need "strictly above 100", use a threshold like `100.0001` or restate the goal.
- **One threshold per visual, applied to every series.** All `yColumns` are tested against the same `value`; there is no per-series threshold.
- **`equals` is exact.** It compares with strict equality, so computed or floating-point values rarely match; it is mainly useful for integer status codes.
- **Bars ignore `applyTo` and `blendWidth`.** On `clusteredBar`, setting a threshold always recolors all bars; the legend keeps the original series colors, which can look inconsistent — consider `showLegend: false` for single-series threshold bars.
- **The reference line is always gray**, independent of `passColor`/`failColor`, at 70% opacity.
- **Keep the threshold inside the Y domain.** The line/area default Y range is `[0, data max]`; if `value` is above every data point the reference line sits at/above the top edge. Set `maxY` a bit above the threshold.
- **Crossings are interpolated linearly** even when `smooth: true`, so on strongly curved smooth lines the color change can sit slightly off the visual crossing point. Smaller `blendWidth` values make this more noticeable.
- **Blend zones can overlap** when data crosses the threshold repeatedly within a short span; use a smaller `blendWidth` (or `0`) for noisy data.

## Related

- [Line chart](visuals/line-chart.md), [Area chart](visuals/area-chart.md), [Bar charts](visuals/bar-charts.md)
- [Visual Elements](visual-elements.md) — `xAxis`/`yAxis` reference lines for charts without threshold support
- [Gauge](visuals/gauge.md) — range-based coloring for single values
- Live examples: [test-area-chart-threshold.html](../test-area-chart-threshold.html), [test.html](../test.html)
