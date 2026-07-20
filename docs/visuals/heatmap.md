# Heatmap (`type: "heatmap"`)

The heatmap renders a matrix of colored cells across two categorical dimensions. Each row of the dataset supplies one cell: `xColumn` picks the column of the grid, `yColumn` picks the row, and `valueColumn` determines the cell's color intensity. A gradient legend from the minimum to the maximum value is drawn automatically below the grid, and hovering a cell shows a tooltip with its labels and value.

## Minimal example

A complete `report-data` document with one heatmap:

```json
{
    "pages": [
        {
            "title": "Sales Matrix",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "heatmap",
                            "id": "salesHeatmap",
                            "datasetId": "salesMatrix",
                            "xColumn": "Month",
                            "yColumn": "Region",
                            "valueColumn": "Sales",
                            "title": "Sales by Region and Month"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "salesMatrix": {
            "format": "records",
            "columns": ["Month", "Region", "Sales"],
            "dtypes": ["string", "string", "number"],
            "data": [
                { "Month": "Jan", "Region": "North", "Sales": 120 },
                { "Month": "Feb", "Region": "North", "Sales": 150 },
                { "Month": "Mar", "Region": "North", "Sales": 90 },
                { "Month": "Jan", "Region": "South", "Sales": 200 },
                { "Month": "Feb", "Region": "South", "Sales": 170 },
                { "Month": "Mar", "Region": "South", "Sales": 220 }
            ]
        }
    }
}
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `datasetId` | `string` | — | **Required.** Key of the dataset in `datasets`. |
| `xColumn` | `string \| number` | `0` | Column for the X-axis (grid column) categories. Dates are printed as date strings. |
| `yColumn` | `string \| number` | `1` | Column for the Y-axis (grid row) categories. |
| `valueColumn` | `string \| number` | `2` | Numeric column mapped to cell color. Rows with a non-finite value are skipped. |
| `title` | `string` | — | Title above the chart. |
| `description` | `string` | — | Description text below the title. |
| `width` | `number` | `700` | Initial chart width in pixels; the chart resizes responsively. |
| `height` | `number` | `420` | Chart height in pixels. |
| `chartMargin` | `object` | `{ "top": 20, "right": 20, "bottom": 70, "left": 90 }` | Partial override of the inner chart margins. Increase `left`/`bottom` for long category labels. |
| `minValue` | `number` | data min | Fixed lower end of the color scale. Values below it are clamped to the low end color. |
| `maxValue` | `number` | data max | Fixed upper end of the color scale. Values above it are clamped to the high end color. |
| `showAxisLabels` | `boolean` | `true` | Show the per-category tick labels on both axes (and the `xAxisLabel`/`yAxisLabel` titles). |
| `xAxisLabel` | `string` | — | Bold axis title below the X categories. |
| `yAxisLabel` | `string` | — | Bold axis title beside the Y categories (rotated). |
| `showCellLabels` | `boolean` | `false` | Print the value inside each cell. Labels are skipped automatically when cells are smaller than 28×18 px. |
| `emptyLabel` | `string` | `"No data available."` | Text shown when the dataset is missing or produces no cells. |
| `color` | `string \| string[]` | `"YlOrRd"` | Color scale. See [Color scales](#color-scales) below. |
| `filter` | `object` | — | Per-visual filter over the dataset. See [Filtering & Aggregation](../filtering-and-aggregation.md). |
| `aggregate` | `object` | — | Per-visual group/aggregate, applied after `filter`. |
| `padding`, `margin`, `border`, `shadow`, `flex` | — | — | Common container styling. See [Pages & Layouts](../pages-and-layouts.md). |

### Color scales

The `color` property resolves to a continuous interpolator, in this order:

1. **D3 interpolator name** — with or without the `interpolate` prefix: `"Viridis"`, `"Magma"`, `"Plasma"`, `"Inferno"`, `"YlOrRd"`, `"Blues"`, `"RdYlGn"`, `"Turbo"`, `"interpolateCool"`, and any other `d3-scale-chromatic` interpolator.
2. **D3 scheme name** — e.g. `"schemeBlues"`; the scheme's colors are blended into a smooth gradient.
3. **Array of colors** — e.g. `["#ffffff", "#4c9aff", "#0b2e6b"]`; values are interpolated smoothly through the array from low to high.
4. **Single CSS color** — e.g. `"#e74c3c"`; produces a white-to-that-color ramp.

If nothing matches, the default `YlOrRd` (yellow-orange-red) scale is used.

## Examples

**Basic matrix**

Categories on both axes, defaults for everything else (YlOrRd scale, auto min/max, gradient legend):

```json
{
    "type": "heatmap",
    "datasetId": "salesMatrix",
    "xColumn": "Month",
    "yColumn": "Region",
    "valueColumn": "Sales",
    "title": "Sales by Region and Month"
}
```

**Custom D3 interpolator with cell labels**

A perceptually uniform `Viridis` scale, with values printed inside the cells:

```json
{
    "type": "heatmap",
    "datasetId": "activity",
    "xColumn": "Hour",
    "yColumn": "Weekday",
    "valueColumn": "Visits",
    "color": "Viridis",
    "showCellLabels": true,
    "title": "Site Visits by Hour and Weekday",
    "xAxisLabel": "Hour of day",
    "yAxisLabel": "Weekday"
}
```

**Custom color array**

Interpolate through your own brand colors, low to high:

```json
{
    "type": "heatmap",
    "datasetId": "salesMatrix",
    "xColumn": "Month",
    "yColumn": "Region",
    "valueColumn": "Sales",
    "color": ["#f1f5f9", "#93c5fd", "#1d4ed8", "#172554"],
    "title": "Sales (Custom Palette)"
}
```

**Clamped color scale**

Pin the scale to a fixed range so outliers do not wash out the rest of the grid — values outside `[0, 100]` are clamped to the end colors:

```json
{
    "type": "heatmap",
    "datasetId": "cpuUsage",
    "xColumn": "Host",
    "yColumn": "Metric",
    "valueColumn": "Percent",
    "minValue": 0,
    "maxValue": 100,
    "color": "RdYlGn",
    "title": "Utilization (fixed 0-100 scale)"
}
```

**Aggregate-fed heatmap**

Build the matrix on the fly from transactional rows with a per-visual `aggregate`: group by both axes and sum a measure. This also guarantees exactly one cell per (x, y) pair:

```json
{
    "type": "heatmap",
    "datasetId": "transactions",
    "aggregate": {
        "groupBy": ["Month", "Region"],
        "aggregates": [
            { "column": "Amount", "fn": "sum", "as": "TotalAmount" }
        ]
    },
    "xColumn": "Month",
    "yColumn": "Region",
    "valueColumn": "TotalAmount",
    "color": "Magma",
    "showCellLabels": true,
    "title": "Total Amount by Region and Month"
}
```

## Tips & gotchas

- **Category order is first-appearance order.** Axes list categories in the order they first occur in the data, not sorted. Sort your rows (or your aggregate source) if you need a specific order.
- **One row = one cell.** If several rows share the same (x, y) pair, all of their cells are drawn on top of each other and only the last one is visible. Pre-aggregate (see the aggregate-fed example) to avoid this.
- **Missing combinations stay blank.** There is no automatic zero-fill; a pair with no row simply has no cell.
- **Flat data renders mid-scale.** If every value is identical (or `maxValue <= minValue`), all cells get the same color at 70% of the scale rather than the low end.
- **Cell labels disappear on dense grids.** `showCellLabels` only draws text when a cell is at least 28 px wide and 18 px tall.
- Non-finite values (`null`, text, `NaN`) in `valueColumn` skip the entire row.
- The gradient legend always reflects the effective scale ends (`minValue`/`maxValue` or the data extent).
- The heatmap does **not** render `otherElements` annotations.
- Long Y labels get about 90 px by default; raise `chartMargin.left` if they truncate. X labels are rotated -35°.

## Related

- [Filtering & Aggregation](../filtering-and-aggregation.md) — building matrices from raw rows
- [Table](table.md) — exact values with conditional formatting
- [Bar Charts](bar-charts.md), [Histogram](histogram.md), [Scatter Plot](scatter-plot.md)
- [Datasets](../datasets.md)
