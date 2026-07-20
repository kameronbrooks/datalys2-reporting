# Histogram (`type: "histogram"`)

The histogram shows the distribution of a single numeric column by grouping its values into bins and drawing one bar per bin. Bar height is the count (frequency) of values in that bin. Hovering a bar shows a tooltip with the bin's value range and count.

Binning is done with D3's bin generator over the domain `[min, max]` of the data, using your `bins` value as the target number of thresholds.

## Minimal example

A complete `report-data` document with one histogram:

```json
{
    "pages": [
        {
            "title": "Distribution",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "histogram",
                            "id": "responseTimes",
                            "datasetId": "latency",
                            "column": "ResponseMs",
                            "bins": 8,
                            "title": "Response Time Distribution",
                            "xAxisLabel": "Response time (ms)",
                            "yAxisLabel": "Requests"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "latency": {
            "format": "records",
            "columns": ["ResponseMs"],
            "dtypes": ["number"],
            "data": [
                { "ResponseMs": 120 },
                { "ResponseMs": 135 },
                { "ResponseMs": 140 },
                { "ResponseMs": 155 },
                { "ResponseMs": 160 },
                { "ResponseMs": 180 },
                { "ResponseMs": 210 },
                { "ResponseMs": 240 },
                { "ResponseMs": 310 },
                { "ResponseMs": 420 }
            ]
        }
    }
}
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `datasetId` | `string` | — | **Required.** Key of the dataset in `datasets`. |
| `column` | `string \| number` | `0` | Column (name or index) containing the numeric values to bin. |
| `bins` | `number` | `10` | Target number of bins. This is a hint: D3 chooses "nice" round bin edges, so the actual number of bars can differ slightly. |
| `title` | `string` | — | Title centered above the chart. |
| `description` | `string` | — | Description text below the title. |
| `width` | `number` | `600` | Initial chart width in pixels; the chart resizes responsively. |
| `height` | `number` | `400` | Chart height in pixels. |
| `xAxisLabel` | `string` | — | Bold label under the X axis. |
| `yAxisLabel` | `string` | — | Bold label beside the Y axis (rotated). |
| `chartMargin` | `object` | `{ "top": 20, "right": 20, "bottom": 50, "left": 50 }` | Partial override of the inner chart margins. |
| `color` | `string \| string[]` | `"#69b3a2"` | Bar color. Accepts a single color, an array of colors, or a D3 scheme/interpolator name (e.g. `"Tableau10"`, `"Viridis"`). With multiple colors, bars cycle through the palette left to right. |
| `showLabels` | `boolean` | `false` | Show the count above each non-empty bar. |
| `otherElements` | `object[]` | — | Annotation layer (reference lines, markers, labels). See [Visual Elements](../visual-elements.md). |
| `filter` | `object` | — | Per-visual filter over the dataset. See [Filtering & Aggregation](../filtering-and-aggregation.md). |
| `aggregate` | `object` | — | Per-visual group/aggregate, applied after `filter`. |
| `padding`, `margin`, `border`, `shadow`, `flex` | — | — | Common container styling. See [Pages & Layouts](../pages-and-layouts.md). |

## Examples

**Basic histogram**

Default 10 bins over an order-value column:

```json
{
    "type": "histogram",
    "datasetId": "orders",
    "column": "OrderValue",
    "title": "Order Value Distribution",
    "xAxisLabel": "Order value (USD)",
    "yAxisLabel": "Orders"
}
```

**Fine-grained bins with count labels**

More bins for a detailed view, with the frequency printed above each bar:

```json
{
    "type": "histogram",
    "datasetId": "latency",
    "column": "ResponseMs",
    "bins": 20,
    "showLabels": true,
    "color": "#4c9aff",
    "title": "Response Times (Detailed)",
    "xAxisLabel": "Response time (ms)",
    "yAxisLabel": "Requests"
}
```

**Palette-colored bars**

`color` accepts D3 scheme or interpolator names; bars cycle through the resolved palette:

```json
{
    "type": "histogram",
    "datasetId": "scores",
    "column": "Score",
    "bins": 12,
    "color": "Viridis",
    "title": "Score Distribution",
    "xAxisLabel": "Score",
    "yAxisLabel": "Students"
}
```

**Filtered histogram**

Bin only the rows matching a per-visual filter — other visuals sharing `datasetId` are unaffected:

```json
{
    "type": "histogram",
    "datasetId": "orders",
    "column": "OrderValue",
    "bins": 15,
    "filter": { "column": "Region", "op": "eq", "value": "EU" },
    "title": "EU Order Values",
    "xAxisLabel": "Order value (USD)",
    "yAxisLabel": "Orders"
}
```

**Histogram with a reference line annotation**

Mark an SLA threshold on the value axis with a vertical `yAxis` element (a vertical line at an X value):

```json
{
    "type": "histogram",
    "datasetId": "latency",
    "column": "ResponseMs",
    "bins": 10,
    "otherElements": [
        {
            "visualElementType": "yAxis",
            "value": 250,
            "color": "#ef4444",
            "lineStyle": "dashed",
            "lineWidth": 2,
            "label": "SLA limit"
        }
    ],
    "title": "Response Times vs. SLA"
}
```

## Tips & gotchas

- **Bin count is approximate.** `bins` is passed to D3 as a threshold hint; D3 picks round ("nice") bin edges, so asking for 10 bins may produce 9 or 11 bars. Bins are half-open ranges `[x0, x1)`, except the last bin, which includes the maximum value.
- **Non-numeric values are dropped.** Each value is parsed with `parseFloat`; anything that parses to NaN is excluded from binning entirely.
- **Dates are binned by timestamp.** Date values are converted to epoch milliseconds before binning, and the X-axis ticks show those raw millisecond numbers — usually not what you want. Prefer pre-computing a numeric column (e.g. day-of-month, hours elapsed) for date-based distributions.
- **Empty data.** If the dataset id is unknown, the visual renders "Dataset not found". If the dataset exists but has no numeric values in the column, the chart renders axes with no bars.
- `showLabels` skips empty bins (no "0" labels).
- The X axis draws roughly one tick per requested bin (`bins` is also used as the tick-count hint), so very high `bins` values can crowd the tick labels.
- `trend` elements in `otherElements` render over the histogram's numeric X domain (the binned value range), as do reference lines, markers, and labels. See [Visual Elements](../visual-elements.md).

## Related

- [Visual Elements](../visual-elements.md)
- [Filtering & Aggregation](../filtering-and-aggregation.md)
- [Box Plot](box-plot.md) — quartile view of a distribution
- [Bar Charts](bar-charts.md), [Scatter Plot](scatter-plot.md)
- [Datasets](../datasets.md)
