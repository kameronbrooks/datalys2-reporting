# Gauge (`type: "gauge"`)

The gauge reads a single numeric value from a dataset cell and displays it on an arc scale, with an animated needle, an optional set of colored range bands, a formatted center value, min/max labels, and an optional legend. On first render the needle sweeps from the scale minimum to the value over about 0.8 s (ease-out). Hovering the gauge shows a tooltip with the value, its position as a percentage of the scale, and the active range; hovering a range band highlights it.

The value is read from one cell: `valueColumn` picks the column, `rowIndex` picks the row.

## Minimal example

A complete `report-data` document with one gauge:

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
                            "type": "gauge",
                            "id": "scoreGauge",
                            "datasetId": "scoreData",
                            "valueColumn": "Score",
                            "title": "Performance Score",
                            "minValue": 0,
                            "maxValue": 100,
                            "unit": "pts"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "scoreData": {
            "format": "records",
            "columns": ["Score"],
            "dtypes": ["number"],
            "data": [
                { "Score": 72.5 }
            ]
        }
    }
}
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `datasetId` | `string` | — | **Required.** Key of the dataset in `datasets`. |
| `valueColumn` | `string \| number` | `0` | Column (name or index) to read the value from. |
| `rowIndex` | `number` | `0` | Row to read the value from. Negative values count from the end (`-1` = last row — handy for "latest value" datasets). |
| `minValue` | `number` | `0` | Scale minimum. |
| `maxValue` | `number` | `100` | Scale maximum. Values outside `[minValue, maxValue]` are clamped. |
| `title` | `string` | — | Title centered above the gauge. |
| `description` | `string` | — | Description text below the title. |
| `width` | `number` | `360` | Initial width in pixels; the gauge resizes responsively. |
| `height` | `number` | `240` | Height in pixels. |
| `thickness` | `number` | `24` | Arc thickness in pixels. |
| `startAngle` | `number` | `-1.5708` (-π/2) | Start angle in **radians**. 0 is 12 o'clock; positive is clockwise. The default -π/2 is 9 o'clock. |
| `endAngle` | `number` | `1.5708` (π/2) | End angle in radians. The default π/2 is 3 o'clock, giving a half-circle gauge. |
| `ranges` | `GaugeRange[]` | — | Colored range bands (see below). When set, the bands replace the track and value arc. |
| `trackColor` | `string` | `"var(--dl2-border-table)"` | Background track color (drawn at 25% opacity) when no ranges are defined. |
| `valueColor` | `string` | active range color, else palette, else `"#4c9aff"` | Color of the value arc (no-ranges mode) and of the center value text. |
| `needleColor` | `string` | `"var(--dl2-text-main)"` | Needle and hub color. |
| `showNeedle` | `boolean` | `true` | Show the needle. |
| `showValue` | `boolean` | `true` | Show the formatted value (plus `unit` and active range label) near the center. |
| `showLegend` | `boolean` | `false` | Show a legend of the ranges below the gauge (only when `ranges` is set). The active range is highlighted. |
| `showMinMax` | `boolean` | `true` | Show formatted min/max labels at the arc ends. |
| `format` | `"number" \| "currency" \| "percent"` | `"number"` | Value display format. `percent` multiplies by 100, so store fractions (0-1). |
| `roundingPrecision` | `number` | `1` | Maximum decimal places for the formatted value. |
| `currencySymbol` | `string` | `"$"` | Symbol prefix used when `format` is `"currency"`. |
| `unit` | `string` | — | Unit text displayed under the value. |
| `colors` | `string \| string[]` | — | Palette used for range bands without an explicit `color`, and as the value-arc fallback. Accepts an array or a D3 scheme/interpolator name. |
| `chartMargin` | `object` | `{ "top": 20, "right": 20, "bottom": 20, "left": 20 }` | Partial override of the chart margins. |
| `filter` / `aggregate` | `object` | — | Per-visual data transforms. See [Filtering & Aggregation](../filtering-and-aggregation.md). |
| `padding`, `margin`, `border`, `shadow`, `flex` | — | — | Common container styling. See [Pages & Layouts](../pages-and-layouts.md). |

### GaugeRange objects

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `from` | `number \| null` | open (−∞) | Start of the band. Omit or set `null` for an open lower end; the band is drawn from `minValue`. |
| `to` | `number \| null` | open (+∞) | End of the band. Omit or set `null` for an open upper end; the band is drawn to `maxValue`. |
| `color` | `string` | from `colors` palette, else `trackColor` | Band color. |
| `label` | `string` | — | Band name — shown in the legend, in the tooltip, and under the center value when the value falls inside this band. |

Open-ended ranges display as `100+` or `< 50` in the legend and tooltip. Bands whose effective `to` is not greater than their effective `from` (after clamping to the scale) are dropped.

## Examples

**Simple gauge**

Value arc plus needle on a plain track:

```json
{
    "type": "gauge",
    "datasetId": "scoreData",
    "valueColumn": "Score",
    "title": "Performance Score",
    "minValue": 0,
    "maxValue": 100,
    "unit": "pts"
}
```

**Range bands with open-ended ranges and a legend**

Three risk bands; the first and last are open-ended. The legend lists them as `< 50`, `50 - 100`, and `100+`, highlighting the band the value falls in (this mirrors `test-gauge-ranges.html`):

```json
{
    "type": "gauge",
    "datasetId": "gaugeData",
    "valueColumn": "ValMid",
    "minValue": 0,
    "maxValue": 200,
    "title": "Risk Level",
    "format": "currency",
    "showLegend": true,
    "ranges": [
        { "to": 50, "color": "#e74c3c", "label": "Low Risk" },
        { "from": 50, "to": 100, "color": "#f1c40f", "label": "Medium Risk" },
        { "from": 100, "color": "#2ecc71", "label": "High Risk" }
    ]
}
```

**Donut-style full circle**

Angles are plain radians, so a full circle is just `-π` to `π`. Hide the needle for a clean donut/progress look — the value arc fills clockwise from the start angle:

```json
{
    "type": "gauge",
    "datasetId": "progressData",
    "valueColumn": "Complete",
    "minValue": 0,
    "maxValue": 100,
    "startAngle": -3.14159,
    "endAngle": 3.14159,
    "thickness": 30,
    "showNeedle": false,
    "showMinMax": false,
    "valueColor": "#4c9aff",
    "title": "Migration Progress",
    "unit": "%"
}
```

**Currency gauge**

`format: "currency"` prefixes the symbol and applies thousands separators to the value and the min/max labels:

```json
{
    "type": "gauge",
    "datasetId": "revenueData",
    "valueColumn": "MRR",
    "rowIndex": -1,
    "minValue": 0,
    "maxValue": 500000,
    "format": "currency",
    "currencySymbol": "$",
    "roundingPrecision": 0,
    "title": "Monthly Recurring Revenue",
    "valueColor": "#27ae60"
}
```

Note `rowIndex: -1` — the gauge reads the **last** row, so appending new months to the dataset keeps the gauge current.

**Percent gauge with pass/fail bands**

With `format: "percent"` the data must be a fraction; a stored `0.85` displays as `85.0%` (from `test-gauge-ranges.html`):

```json
{
    "type": "gauge",
    "datasetId": "gaugePercent",
    "valueColumn": "Score",
    "minValue": 0,
    "maxValue": 1,
    "title": "Percentage Score",
    "format": "percent",
    "showLegend": true,
    "ranges": [
        { "to": 0.5, "color": "#e74c3c", "label": "Fail" },
        { "from": 0.5, "color": "#2ecc71", "label": "Pass" }
    ]
}
```

**Wider sweep with palette-colored bands**

A 270° gauge (−3π/4 to 3π/4). The bands have no explicit colors, so they take consecutive colors from the `colors` palette:

```json
{
    "type": "gauge",
    "datasetId": "tempData",
    "valueColumn": "Celsius",
    "minValue": -20,
    "maxValue": 40,
    "startAngle": -2.35619,
    "endAngle": 2.35619,
    "colors": ["#3b82f6", "#22c55e", "#ef4444"],
    "showLegend": true,
    "unit": "°C",
    "title": "Outside Temperature",
    "ranges": [
        { "to": 0, "label": "Freezing" },
        { "from": 0, "to": 25, "label": "Comfortable" },
        { "from": 25, "label": "Hot" }
    ]
}
```

## Tips & gotchas

- **The needle is clamped, the text is not.** A value outside `[minValue, maxValue]` pins the needle (and value arc) at the end of the scale, but the center text and tooltip still display the actual value — so an over-range value is visible as, say, `120` on a 0-100 gauge.
- **Ranges replace the value arc.** With `ranges` set, the gauge draws only the bands and the needle — there is no separate filled value arc, so keep `showNeedle: true` (or rely on the center text/legend) or the value has no visual indicator.
- **Angles are radians**, measured from 12 o'clock, clockwise positive. Useful values: `-1.5708`/`1.5708` (default half circle), `-2.35619`/`2.35619` (270°), `-3.14159`/`3.14159` (full circle).
- **Percent means fraction.** `format: "percent"` multiplies by 100. This also applies to the min/max labels, so use `minValue: 0, maxValue: 1`.
- The active range's `label` appears under the center value, and its `color` becomes the value text color when `valueColor` is not set.
- Overlapping ranges: the value is attributed to the containing range with the greatest `from` (tightest fit first on ties).
- If the referenced cell is missing or not numeric, the gauge renders "No data available." — check `valueColumn`/`rowIndex` and the dataset `format`.
- For `"list"`-format datasets each row **is** the value, so `valueColumn` is ignored.
- A subtle background is drawn behind the center text whenever the needle points near 12 o'clock, keeping the value readable.
- The needle animation runs once per page load, starting at `minValue` (not 0).

## Related

- [KPI](kpi.md) — plain numeric callout without an arc
- [Filtering & Aggregation](../filtering-and-aggregation.md)
- [Pie Chart](pie-chart.md), [Bar Charts](bar-charts.md)
- Live examples: [test-gauge-ranges.html](../../test-gauge-ranges.html)
- [Datasets](../datasets.md)
