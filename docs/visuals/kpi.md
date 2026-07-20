# KPI (`type: "kpi"`)

A KPI card displays one number from a dataset — big and centered — with optional formatting, a trend indicator comparing it to another cell, and breach/warning threshold styling. Hovering the value shows a tooltip with the full breakdown (value, comparison, change, threshold, status).

A KPI **requires** a `datasetId`. It reads a single cell: the row selected by `rowIndex` and the column selected by `valueColumn`.

## Minimal example

```json
{
    "pages": [
        {
            "title": "Overview",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "kpi",
                            "datasetId": "kpiData",
                            "valueColumn": "Value",
                            "rowIndex": 0,
                            "title": "Active Users",
                            "border": true
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "kpiData": {
            "id": "kpiData",
            "columns": ["Metric", "Value", "Yesterday"],
            "dtypes": ["str", "float", "float"],
            "format": "records",
            "data": [
                { "Metric": "Active Users", "Value": 1523, "Yesterday": 1391 },
                { "Metric": "Bounce Rate", "Value": 0.42, "Yesterday": 0.47 }
            ]
        }
    }
}
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `datasetId` | `string` | **required** | The dataset to read from. |
| `valueColumn` | `string` \| `number` | `0` | Column (name or index) for the main value. |
| `rowIndex` | `number` | `0` | Row for the main value. Negative indices count from the end (`-1` = last row). |
| `comparisonColumn` | `string` \| `number` | same as `valueColumn` | Column for the comparison value. Setting this (or `comparisonRowIndex`) turns on the trend indicator. |
| `comparisonRowIndex` | `number` | same as `rowIndex` | Row for the comparison value. Negative indices supported (`-2` = second-to-last row). |
| `comparisonText` | `string` | — | Label appended to the trend line, e.g. `"Yesterday"` renders as "9.5% above Yesterday". |
| `format` | `'number'` \| `'currency'` \| `'percent'` \| `'date'` \| `'hms'` | `'number'` | How the value is formatted (see below). |
| `roundingPrecision` | `number` | `2` | Decimal places for `number` and `percent` formats. |
| `currencySymbol` | `string` | `'$'` | Prefix used by the `currency` format. |
| `goodDirection` | `'higher'` \| `'lower'` | `'higher'` | Whether an increase is good (green) or bad (red). Also flips the threshold logic. |
| `breachValue` | `number` | — | Threshold that marks the KPI as breached. Enables threshold evaluation. |
| `warningValue` | `number` | — | Threshold that marks the KPI as a warning. Only evaluated when `breachValue` is also set. |
| `title` | `string` | — | Heading above the value. |
| `description` | `string` | — | Small text below the value/trend. |
| `width` | `number` | `150` | Minimum width of the card in pixels. |
| `height` | `number` | `100` | Minimum height of the card in pixels. |
| `id` | `string` | — | Optional unique id (navigation anchor — see [../links-and-navigation.md](../links-and-navigation.md)). |
| `padding` | `number` | `15` | Inner padding in pixels. |
| `margin` | `number` | `0` | Outer margin in pixels. |
| `border` | `boolean` | `false` | Standard 1px border. Overridden by a thicker colored border when a threshold is in warning/breach. |
| `shadow` | `boolean` | `false` | Standard drop shadow. |
| `flex` | `number` | `1` | Flex sizing within the parent row. Use `0` for natural size. |
| `filter` / `aggregate` | object | — | Per-visual dataset transforms, applied before the cell is read. See [../filtering-and-aggregation.md](../filtering-and-aggregation.md). |

## Formats

| `format` | Behavior |
|----------|----------|
| `number` | Rounded to `roundingPrecision` decimals, then locale-formatted with thousands separators (trailing zeros are dropped: `1234.5` → `1,234.5`). |
| `currency` | `currencySymbol` + locale-formatted number with 0–2 decimal places. `roundingPrecision` is **not** applied to currency. |
| `percent` | Value × 100 with `roundingPrecision` decimals and a `%` suffix — so store rates as fractions (`0.42` → `42.00%`). |
| `date` | Rendered as a date. Also applied automatically whenever the cell value is a date, regardless of `format`. |
| `hms` | Value is treated as **seconds** and rendered `HH:MM:SS` (e.g. `3725` → `01:02:05`). |

## Trend indicator

The trend row appears only when you set `comparisonColumn` and/or `comparisonRowIndex`. The change is computed as a fraction:

```
change = (value - comparisonValue) / abs(comparisonValue)
```

- Displayed as the **absolute** percentage with one decimal (`9.5%`), preceded by an up caret for a positive change, a down caret for a negative change, or a dash for exactly zero.
- Color: green when the change direction matches `goodDirection`, red when it opposes it, muted gray for zero. The arrow always shows the *actual* direction — `goodDirection` only controls the color.
- With `comparisonText` set, the wording becomes `<pct> above <text>` for increases, `<pct> below <text>` for decreases, and `<pct> from <text>` for no change.
- No trend is shown when the comparison value is `0` (division guard) or when the value is a date.

## Breach and warning thresholds

Threshold evaluation is enabled by `breachValue`; `warningValue` is optional and only checked when `breachValue` is present.

With `goodDirection: "higher"` (low values are bad):

- `value < breachValue` → **breach** (red cross icon, 3px red border)
- otherwise `value < warningValue` → **warning** (orange exclamation icon, 3px orange border)
- otherwise → **ok** (green check icon)

With `goodDirection: "lower"` (high values are bad) the comparisons flip: `value > breachValue` → breach, `value > warningValue` → warning.

The status icon appears next to the value, and warning/breach states replace the normal border with a thicker colored one so they stand out even without `border: true`. The hover tooltip lists the threshold and the current status. See [../thresholds.md](../thresholds.md) for threshold coloring across chart visuals.

## Examples

Each example assumes a dataset like the one in the minimal example, or the `quarterlySales` table shown in the time-series example.

**Simple KPI**

```json
{
    "type": "kpi",
    "datasetId": "kpiData",
    "valueColumn": "Value",
    "rowIndex": 0,
    "title": "Active Users",
    "description": "Unique users in the last 24h",
    "border": true,
    "shadow": true
}
```

**Currency KPI comparing the latest row to the previous row**

For time-series data (one row per period, newest last), negative indices keep the config stable as rows are appended: `-1` is always the latest period, `-2` the one before it.

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
                            "type": "kpi",
                            "datasetId": "quarterlySales",
                            "valueColumn": "Electronics",
                            "rowIndex": -1,
                            "comparisonRowIndex": -2,
                            "comparisonText": "last quarter",
                            "title": "Electronics Revenue",
                            "format": "currency",
                            "border": true
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "quarterlySales": {
            "id": "quarterlySales",
            "columns": ["Quarter", "Electronics", "Apparel"],
            "dtypes": ["str", "float", "float"],
            "format": "records",
            "data": [
                { "Quarter": "Q1", "Electronics": 118000, "Apparel": 64000 },
                { "Quarter": "Q2", "Electronics": 131500, "Apparel": 61200 },
                { "Quarter": "Q3", "Electronics": 127300, "Apparel": 70950 }
            ]
        }
    }
}
```

**Comparison across columns in the same row**

When the dataset stores today's and yesterday's numbers side by side, compare columns instead of rows.

```json
{
    "type": "kpi",
    "datasetId": "kpiData",
    "rowIndex": 0,
    "valueColumn": "Value",
    "comparisonColumn": "Yesterday",
    "comparisonText": "Yesterday",
    "title": "Total Revenue",
    "format": "currency",
    "goodDirection": "higher",
    "border": true
}
```

**`goodDirection: "lower"` with breach and warning thresholds**

An error/bounce rate where increases are bad: rising values render red, and crossing `warningValue` (orange) or `breachValue` (red) recolors the border and adds a status icon.

```json
{
    "type": "kpi",
    "datasetId": "kpiData",
    "rowIndex": 1,
    "valueColumn": "Value",
    "comparisonColumn": "Yesterday",
    "comparisonText": "Yesterday",
    "title": "Bounce Rate",
    "format": "percent",
    "roundingPrecision": 1,
    "goodDirection": "lower",
    "warningValue": 0.44,
    "breachValue": 0.6,
    "border": true
}
```

**Duration KPI (`hms`)**

Store the duration in seconds; it renders as `HH:MM:SS`.

```json
{
    "type": "kpi",
    "datasetId": "opsData",
    "valueColumn": "AvgHandleSeconds",
    "rowIndex": -1,
    "comparisonRowIndex": -2,
    "comparisonText": "last week",
    "title": "Avg Handle Time",
    "format": "hms",
    "goodDirection": "lower",
    "border": true
}
```

**A row of compact KPIs with `flex: 0`**

`flex: 0` stops each card from stretching to fill the row, so several KPIs sit side by side at their natural (min 150px) width. Add `wrap: true` on the layout so they reflow on narrow screens.

```json
{
    "type": "layout",
    "direction": "row",
    "wrap": true,
    "gap": 20,
    "children": [
        { "type": "kpi", "datasetId": "kpiData", "valueColumn": "Value", "rowIndex": 0, "title": "Users", "flex": 0, "border": true },
        { "type": "kpi", "datasetId": "kpiData", "valueColumn": "Value", "rowIndex": 1, "title": "Bounce Rate", "format": "percent", "flex": 0, "border": true }
    ]
}
```

## Tips & gotchas

- The KPI shows `(no value found)` when the dataset is missing/empty, `valueColumn` doesn't resolve, a row index is out of range (after negative-index resolution), or the cell isn't convertible to a number. The validator also warns at load about unknown `datasetId`/`valueColumn` values — see [../validation.md](../validation.md).
- Setting only `comparisonColumn` compares within the same row; setting only `comparisonRowIndex` compares the same column across rows; set both to compare a different column in a different row.
- The trend percentage is relative to the **comparison** value, and it never shows against a comparison of `0`.
- `roundingPrecision` affects `number` and `percent` only — `currency` always uses up to 2 decimal places.
- `warningValue` does nothing without `breachValue`. Place it on the "good" side of `breachValue` (above it for `goodDirection: "higher"`, below it for `"lower"`), otherwise the breach check wins first and the warning never shows.
- Date cells are formatted as dates even with `format: "number"`, and date values suppress the trend indicator.
- `width`/`height` are minimums, not fixed sizes; combine with `flex: 0` to keep cards compact.
- For a threshold visualization with more context (ranges, needle), consider a [gauge](gauge.md) instead.

## Related

- [../thresholds.md](../thresholds.md) — threshold coloring concepts across visuals
- [../formatting.md](../formatting.md) — number/date formatting elsewhere in reports
- [../filtering-and-aggregation.md](../filtering-and-aggregation.md) — computing a KPI's input with `filter`/`aggregate`
- [gauge.md](gauge.md) — dial-style single-value visual with colored ranges
- [card.md](card.md) — free-form computed text instead of a single number
- Live examples: [../../test.html](../../test.html) (KPI grid), [../../test-layouts.html](../../test-layouts.html) (KPI rows and flex)
