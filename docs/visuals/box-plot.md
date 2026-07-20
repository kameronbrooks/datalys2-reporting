# Box Plot (`type: "boxplot"`)

The box plot summarizes a distribution with its quartiles: a box from Q1 to Q3, a median line, and whiskers. It supports two mutually exclusive input modes:

- **Data Mode** — point the visual at a raw numeric column (`dataColumn`); it computes min, Q1, median, Q3, max, and mean itself, optionally grouped by a category column, and can flag outliers.
- **Pre-calculated Mode** — supply one column for each statistic (`minColumn`, `q1Column`, `medianColumn`, `q3Column`, `maxColumn`, optionally `meanColumn`); each dataset row becomes one box.

Hovering a box shows a tooltip with all of its statistics (including the mean, when available, and the outlier count).

## Minimal example

A complete `report-data` document with a Data Mode box plot grouped by department:

```json
{
    "pages": [
        {
            "title": "Survey",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "boxplot",
                            "id": "scoresByDept",
                            "datasetId": "surveyResults",
                            "dataColumn": "Score",
                            "categoryColumn": "Department",
                            "title": "Satisfaction Score by Department",
                            "yAxisLabel": "Score"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "surveyResults": {
            "format": "records",
            "columns": ["Department", "Score"],
            "dtypes": ["string", "number"],
            "data": [
                { "Department": "Sales", "Score": 62 },
                { "Department": "Sales", "Score": 70 },
                { "Department": "Sales", "Score": 74 },
                { "Department": "Sales", "Score": 81 },
                { "Department": "Sales", "Score": 95 },
                { "Department": "Support", "Score": 55 },
                { "Department": "Support", "Score": 60 },
                { "Department": "Support", "Score": 66 },
                { "Department": "Support", "Score": 71 },
                { "Department": "Support", "Score": 90 }
            ]
        }
    }
}
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `datasetId` | `string` | — | **Required.** Key of the dataset in `datasets`. |
| `dataColumn` | `string \| number` | — | **Data Mode.** Raw numeric column to compute statistics from. When set, the pre-calculated columns are ignored. |
| `categoryColumn` | `string \| number` | — | Data Mode: groups values into one box per category (otherwise a single box labeled "All"). Pre-calculated Mode: labels each row's box (otherwise "Row 1", "Row 2", ...). Date values are printed as dates. |
| `minColumn` | `string \| number` | — | **Pre-calculated Mode.** Column for the lower whisker end. |
| `q1Column` | `string \| number` | — | **Pre-calculated Mode.** Column for the first quartile. |
| `medianColumn` | `string \| number` | — | **Pre-calculated Mode.** Column for the median. |
| `q3Column` | `string \| number` | — | **Pre-calculated Mode.** Column for the third quartile. |
| `maxColumn` | `string \| number` | — | **Pre-calculated Mode.** Column for the upper whisker end. |
| `meanColumn` | `string \| number` | — | Pre-calculated Mode only, optional. Column for the mean (shown in the tooltip). |
| `direction` | `"vertical" \| "horizontal"` | `"vertical"` | Vertical: categories on X, values on Y. Horizontal: categories on Y, values on X. |
| `showOutliers` | `boolean` | `true` | Data Mode only. Detect outliers with the 1.5 × IQR rule and draw them as red rhombus points. |
| `title` | `string` | — | Title above the chart. |
| `description` | `string` | — | Description text below the title. |
| `width` | `number` | `600` | Initial chart width in pixels; the chart resizes responsively. |
| `height` | `number` | `400` | Chart height in pixels. |
| `xAxisLabel` | `string` | — | Label under the X axis. |
| `yAxisLabel` | `string` | — | Label beside the Y axis (rotated). |
| `chartMargin` | `object` | `{ "top": 20, "right": 20, "bottom": 50, "left": 50 }` | Partial override of the inner chart margins. |
| `color` | `string \| string[]` | `"#69b3a2"` | Box fill: a single color, an array of colors, or a D3 scheme name (e.g. `"Category10"`, `"Tableau10"`, `"Set2"`) or interpolator name (e.g. `"Viridis"`, sampled to 10 colors). Boxes cycle through the palette in order. |
| `otherElements` | — | — | **Not supported** — the box plot does not render the annotation layer. |
| `filter` | `object` | — | Per-visual filter over the dataset. See [Filtering & Aggregation](../filtering-and-aggregation.md). |
| `aggregate` | `object` | — | Per-visual group/aggregate, applied after `filter`. |
| `padding`, `margin`, `border`, `shadow`, `flex` | — | — | Common container styling. See [Pages & Layouts](../pages-and-layouts.md). |

### How the statistics are computed (Data Mode)

- Values are parsed with `parseFloat`; non-numeric values are dropped.
- Q1, median, and Q3 use D3's `quantile` (linear interpolation) at 0.25 / 0.5 / 0.75; the mean is the arithmetic average.
- With `showOutliers: true` (the default), the fences are `Q1 - 1.5 × IQR` and `Q3 + 1.5 × IQR`. Whiskers extend to the most extreme data points **inside** the fences; anything outside is drawn as an individual red rhombus.
- With `showOutliers: false`, whiskers span the full min-max of the data and no points are drawn.

## Examples

**Raw grouped data (Data Mode)**

One box per department, quartiles and outliers computed automatically:

```json
{
    "type": "boxplot",
    "datasetId": "surveyResults",
    "dataColumn": "Score",
    "categoryColumn": "Department",
    "title": "Score Distribution by Department",
    "yAxisLabel": "Score"
}
```

**Horizontal box plot**

Horizontal orientation reads better with many categories or long category names:

```json
{
    "type": "boxplot",
    "datasetId": "surveyResults",
    "dataColumn": "Score",
    "categoryColumn": "Department",
    "direction": "horizontal",
    "color": "Tableau10",
    "title": "Score Distribution (Horizontal)",
    "xAxisLabel": "Score"
}
```

**Pre-calculated statistics**

When the quartiles come from an upstream system, map each statistic to a column. Every dataset row becomes one box; the dataset ships the five required stats plus the optional mean:

```json
{
    "pages": [
        {
            "title": "SLA",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "boxplot",
                            "datasetId": "latencyStats",
                            "categoryColumn": "Service",
                            "minColumn": "Min",
                            "q1Column": "P25",
                            "medianColumn": "P50",
                            "q3Column": "P75",
                            "maxColumn": "Max",
                            "meanColumn": "Mean",
                            "title": "Latency Percentiles by Service",
                            "yAxisLabel": "Latency (ms)"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "latencyStats": {
            "format": "records",
            "columns": ["Service", "Min", "P25", "P50", "P75", "Max", "Mean"],
            "dtypes": ["string", "number", "number", "number", "number", "number", "number"],
            "data": [
                { "Service": "API", "Min": 40, "P25": 80, "P50": 110, "P75": 160, "Max": 300, "Mean": 125 },
                { "Service": "Web", "Min": 60, "P25": 120, "P50": 180, "P75": 260, "Max": 520, "Mean": 205 },
                { "Service": "Batch", "Min": 200, "P25": 400, "P50": 550, "P75": 700, "Max": 990, "Mean": 560 }
            ]
        }
    }
}
```

**Styled boxes with a filter**

A D3 categorical scheme colors each box differently; the per-visual filter narrows the data without touching other visuals:

```json
{
    "type": "boxplot",
    "datasetId": "surveyResults",
    "dataColumn": "Score",
    "categoryColumn": "Department",
    "color": "Category10",
    "showOutliers": false,
    "filter": { "column": "Score", "op": "gt", "value": 0 },
    "border": true,
    "shadow": true,
    "title": "Valid Scores Only"
}
```

**Single ungrouped box**

Omit `categoryColumn` in Data Mode to get one box (labeled "All") for the whole column:

```json
{
    "type": "boxplot",
    "datasetId": "latency",
    "dataColumn": "ResponseMs",
    "direction": "horizontal",
    "color": "#4c9aff",
    "title": "Overall Response Time",
    "xAxisLabel": "Response time (ms)"
}
```

## Tips & gotchas

- **Mode selection:** if `dataColumn` is present, Data Mode wins and any pre-calculated columns are ignored. Pre-calculated Mode requires **all five** of `minColumn`, `q1Column`, `medianColumn`, `q3Column`, and `maxColumn` — with any of them missing the visual shows "No data available or invalid configuration."
- **Outliers exist only in Data Mode.** Pre-calculated rows never render outlier points; `showOutliers` has no effect there.
- The mean is not drawn on the chart in either mode — it appears only in the hover tooltip (computed automatically in Data Mode, from `meanColumn` in Pre-calculated Mode).
- The value axis spans the extreme values including outliers, with 5% padding.
- Category order follows the data: first-appearance order of groups in Data Mode, row order in Pre-calculated Mode.
- The box plot does not render `otherElements`; there is no annotation layer on this visual.
- In Pre-calculated Mode nothing validates that `min <= q1 <= median <= q3 <= max`; swapped values draw a malformed box.

## Related

- [Histogram](histogram.md) — full shape of a distribution
- [Filtering & Aggregation](../filtering-and-aggregation.md)
- [Bar Charts](bar-charts.md), [Scatter Plot](scatter-plot.md)
- [Datasets](../datasets.md)
