# Scatter Plot (`type: "scatter"`)

The scatter plot draws one point per row of the dataset, plotting one numeric column against another. You can color points by a third column, overlay a linear regression trendline, and display correlation statistics (r, r², and the regression equation). Points show a tooltip on hover and grow slightly when hovered.

Rows where either the X or Y value is not numeric are silently dropped. Both axes are linear numeric scales, and a 5% padding is added around the data extent (or around any `minX`/`maxX`/`minY`/`maxY` you supply) for visual breathing room.

## Minimal example

A complete `report-data` document with one scatter plot:

```json
{
    "pages": [
        {
            "title": "Study Results",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "scatter",
                            "id": "hoursVsScore",
                            "datasetId": "examData",
                            "xColumn": "HoursStudied",
                            "yColumn": "Score",
                            "title": "Hours Studied vs. Exam Score",
                            "xAxisLabel": "Hours Studied",
                            "yAxisLabel": "Exam Score"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "examData": {
            "format": "records",
            "columns": ["HoursStudied", "Score"],
            "dtypes": ["number", "number"],
            "data": [
                { "HoursStudied": 2, "Score": 55 },
                { "HoursStudied": 4, "Score": 62 },
                { "HoursStudied": 5, "Score": 71 },
                { "HoursStudied": 7, "Score": 80 },
                { "HoursStudied": 9, "Score": 88 }
            ]
        }
    }
}
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `datasetId` | `string` | — | **Required.** Key of the dataset in `datasets`. |
| `xColumn` | `string \| number` | `0` | Column (name or index) for X values. Must be numeric. |
| `yColumn` | `string \| number` | `1` | Column (name or index) for Y values. Must be numeric. |
| `categoryColumn` | `string \| number` | — | Optional column used to color points by category. Date values are printed as dates. |
| `title` | `string` | — | Title centered above the chart. |
| `description` | `string` | — | Description text below the title. |
| `width` | `number` | `600` | Initial chart width in pixels. The chart then resizes responsively to its container. |
| `height` | `number` | `400` | Chart height in pixels. |
| `minX` | `number` | data min | Lower bound of the X domain (5% padding is still added). |
| `maxX` | `number` | data max | Upper bound of the X domain. |
| `minY` | `number` | data min | Lower bound of the Y domain. |
| `maxY` | `number` | data max | Upper bound of the Y domain. |
| `xAxisLabel` | `string` | — | Bold label under the X axis. |
| `yAxisLabel` | `string` | — | Bold label beside the Y axis (rotated). |
| `chartMargin` | `object` | `{ "top": 20, "right": 20, "bottom": 50, "left": 50 }` | Partial override of the inner chart margins, e.g. `{ "left": 70 }`. |
| `colors` | `string \| string[]` | Tableau10 | Category palette: a single color, an array of colors, or a D3 scheme/interpolator name (e.g. `"Category10"`, `"Viridis"`). |
| `showLegend` | `boolean` | `true` | Show the category legend. The legend only appears when `categoryColumn` is set and at least one category exists. |
| `legendTitle` | `string` | — | Optional title above the legend. |
| `pointSize` | `number` | `5` | Radius of each point in pixels (grows by 3px on hover). |
| `showTrendline` | `boolean` | `false` | Draw a linear regression trendline (red, dashed) across the full X domain. |
| `showCorrelation` | `boolean` | `false` | Show a stats box (top-right) with Pearson r, r², and the regression equation `y = mx + b`. |
| `otherElements` | `object[]` | — | Annotation layer (trend, reference lines, markers, labels). See [Visual Elements](../visual-elements.md). |
| `filter` | `object` | — | Per-visual filter over the dataset. See [Filtering & Aggregation](../filtering-and-aggregation.md). |
| `aggregate` | `object` | — | Per-visual group/aggregate, applied after `filter`. |
| `padding`, `margin`, `border`, `shadow`, `flex` | — | — | Common container styling. See [Pages & Layouts](../pages-and-layouts.md). |

## Examples

**Basic scatter**

Two numeric columns, referenced by name. Axis labels make the chart self-explanatory:

```json
{
    "type": "scatter",
    "datasetId": "adSpend",
    "xColumn": "Spend",
    "yColumn": "Conversions",
    "title": "Ad Spend vs. Conversions",
    "xAxisLabel": "Spend (USD)",
    "yAxisLabel": "Conversions"
}
```

**Categorized scatter with a custom palette**

Points are colored by `Region`; the legend appears automatically because `categoryColumn` is set. `colors` accepts an array or a D3 scheme name:

```json
{
    "type": "scatter",
    "datasetId": "storeMetrics",
    "xColumn": "FootTraffic",
    "yColumn": "Revenue",
    "categoryColumn": "Region",
    "colors": ["#4c9aff", "#f97316", "#22c55e"],
    "legendTitle": "Region",
    "title": "Foot Traffic vs. Revenue by Region",
    "xAxisLabel": "Daily Foot Traffic",
    "yAxisLabel": "Revenue (USD)"
}
```

**Trendline with correlation statistics**

`showTrendline` overlays a red dashed linear regression line; `showCorrelation` adds a box with r, r², and the fitted equation:

```json
{
    "type": "scatter",
    "datasetId": "examData",
    "xColumn": "HoursStudied",
    "yColumn": "Score",
    "showTrendline": true,
    "showCorrelation": true,
    "pointSize": 6,
    "title": "Study Time Correlation",
    "xAxisLabel": "Hours Studied",
    "yAxisLabel": "Exam Score"
}
```

**Filtered scatter**

The per-visual `filter` restricts this chart's view of the shared dataset without affecting other visuals that use the same `datasetId`:

```json
{
    "type": "scatter",
    "datasetId": "storeMetrics",
    "xColumn": "FootTraffic",
    "yColumn": "Revenue",
    "filter": { "column": "Region", "op": "eq", "value": "West" },
    "title": "West Region Only",
    "xAxisLabel": "Daily Foot Traffic",
    "yAxisLabel": "Revenue (USD)"
}
```

**Fixed axis domains and a target line annotation**

Pin the domains with `minX`/`maxX`/`minY`/`maxY` so multiple charts are comparable, and add a horizontal reference line at a revenue target via `otherElements`:

```json
{
    "type": "scatter",
    "datasetId": "storeMetrics",
    "xColumn": "FootTraffic",
    "yColumn": "Revenue",
    "minX": 0,
    "maxX": 1000,
    "minY": 0,
    "maxY": 50000,
    "otherElements": [
        {
            "visualElementType": "xAxis",
            "value": 30000,
            "color": "#ef4444",
            "lineStyle": "dashed",
            "label": "Revenue target"
        }
    ],
    "title": "Revenue vs. Target"
}
```

## Tips & gotchas

- Rows with a non-numeric X or Y value are dropped before plotting; they also do not affect the axis domains or the regression.
- The trendline and correlation stats are always computed over **all** plotted points, ignoring `categoryColumn`. To fit per category, use separate filtered scatter plots.
- The trendline styling is fixed (red, dashed, 2px). For a styled or polynomial fit line, use a `trend` element in `otherElements` instead — on the scatter plot its coefficients are in real X-axis units.
- The trendline only renders when there are at least 2 points. If all X values are identical (or all Y values), r is reported as 0.
- `showLegend: true` has no effect unless `categoryColumn` is set.
- When `categoryColumn` is omitted, every point gets the first palette color (internally the category is `"Default"`).
- Axis domains get 5% padding beyond the data (or your explicit min/max), so points never sit exactly on the chart edge. Values outside explicit `minX`/`maxX`/`minY`/`maxY` are not clipped out of the data — they draw outside the plot area.
- Date values in `categoryColumn` are formatted as date strings; dates in `xColumn`/`yColumn` are coerced with `Number(...)` and will usually be dropped as NaN unless already numeric — use numeric columns for both axes.

## Related

- [Visual Elements](../visual-elements.md) — trend lines, reference lines, markers, labels
- [Filtering & Aggregation](../filtering-and-aggregation.md)
- [Line Chart](line-chart.md), [Bar Charts](bar-charts.md), [Histogram](histogram.md), [Heatmap](heatmap.md)
- [Datasets](../datasets.md)
