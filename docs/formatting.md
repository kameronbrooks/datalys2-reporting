# Formatting (Tables & Checklists)

Two props shared by the [Table](visuals/table.md) and [Checklist](visuals/checklist.md) visuals control how values look:

- **`columnFormats`** — per-column display formats (numbers, currency, percentages, dates, durations).
- **`conditionalFormats`** — rules that highlight cells or whole rows when a row matches a condition.

Both are display-only: they change what readers see, never the underlying data.

## Minimal example

```json
{
    "pages": [
        {
            "title": "Revenue",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "table",
                            "datasetId": "revenue",
                            "title": "Monthly Revenue",
                            "columnFormats": {
                                "month": "date",
                                "amount": { "format": "currency", "digits": 0 },
                                "growth": { "format": "percent", "digits": 1 }
                            },
                            "conditionalFormats": [
                                { "when": { "column": "growth", "op": "lt", "value": 0 }, "style": "error" }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "revenue": {
            "format": "records",
            "columns": ["month", "amount", "growth"],
            "dtypes": ["date", "float", "float"],
            "data": [
                { "month": "2026-04-01", "amount": 118400.5, "growth": 0.062 },
                { "month": "2026-05-01", "amount": 121900.0, "growth": 0.03 },
                { "month": "2026-06-01", "amount": 117250.75, "growth": -0.038 }
            ]
        }
    }
}
```

## Part 1 — Column formats (`columnFormats`)

`columnFormats` is an object mapping **column names** to a format spec. Each value is either a full spec object or a shorthand string naming the format kind:

```json
{
    "columnFormats": {
        "amount": { "format": "currency", "symbol": "$", "digits": 0 },
        "rate": { "format": "percent", "digits": 1 },
        "elapsed": { "format": "hms" },
        "created": "date"
    }
}
```

`"created": "date"` is exactly equivalent to `"created": { "format": "date" }`.

### Spec properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `format` | `'number' \| 'currency' \| 'percent' \| 'date' \| 'hms'` | **required** | Formatting style (the same enum as the Card/KPI `format` prop). |
| `digits` | `number` | per format (see below) | Decimal places. |
| `symbol` | `string` | `"$"` | Currency symbol; only used when `format` is `'currency'`. |

Entries with an unknown `format` kind are ignored (the config validator warns about them).

### The five formats

| Format | Rendering | `digits` default | Examples |
|--------|-----------|------------------|----------|
| `number` | Locale number with thousands separators. Without `digits`, values are rounded to at most 4 decimals; with `digits`, exactly that many decimals are shown. | locale default | `1234.5` → `1,234.5`; with `digits: 2` → `1,234.50` |
| `currency` | Symbol + locale number with fixed decimals. Negative values put the minus sign before the symbol. | `2` | `1234.5` → `$1,234.50`; `-90` → `-$90.00`; with `symbol: "€", digits: 0` → `€1,235` |
| `percent` | Multiplies the raw value by 100 and appends `%` — store ratios (`0.423`), not percentages. No thousands separators. | `1` | `0.423` → `42.3%`; with `digits: 0` → `42%` |
| `date` | The library's standard date rendering. Accepts Date-typed values or anything `new Date(...)` can parse (ISO strings, timestamps); unparseable values pass through as-is. | — | `"2026-06-01"` → the printed date |
| `hms` | Treats the value as **seconds** and renders a zero-padded `HH:MM:SS` duration. Negative values get a leading `-`; hours are not wrapped at 24. | — | `3725` → `01:02:05`; `90000` → `25:00:00`; `-61` → `-00:01:01` |

Value handling for every format:

- `null`, `undefined`, and empty string render as an **empty cell**.
- Non-numeric values under the numeric formats (`number`, `currency`, `percent`, `hms`) fall back to their plain string form rather than erroring.
- Numeric strings (`"1234.5"`) are parsed and formatted like numbers.

### Where column formats apply

| Location | Behavior |
|----------|----------|
| Body cells | Always, matched by column name. |
| Total row | Each total uses its column's format. |
| Total column | Formatted only when **every** summed source column shares the exact same format spec (e.g. all currency, same digits). |
| Group aggregates | Matched by the aggregate's **`as` name** — name the aggregate after a formatted column (e.g. `"as": "amount"`) and the group-header value formats too. |
| Row detail modals | The built-in row modal formats its values the same way. |
| Checklists | Identical behavior, including the built-in row modal. |

### Display-only semantics

- **CSV export keeps raw values** — numbers export unformatted (dates export as printed date text).
- **Clipboard copy is formatted** — "Copy table to clipboard", "Copy cell", and "Copy row" all copy the on-screen text, so pastes into a spreadsheet match what the reader saw.

## Part 2 — Conditional formats (`conditionalFormats`)

`conditionalFormats` is an array of rules evaluated **per data row**:

```json
{
    "conditionalFormats": [
        { "when": { "column": "amount", "op": "gt", "value": 10000 }, "style": "success" },
        { "when": { "column": "region", "op": "eq", "value": "EU" }, "target": "row", "style": "info" },
        { "when": { "column": "margin", "op": "lt", "value": 0 }, "css": { "color": "var(--dl2-error)", "fontWeight": 600 } }
    ]
}
```

### Rule properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `when` | `FilterExpression` | **required** | Condition the row must match, in the standard [filter grammar](filtering-and-aggregation.md) — single conditions (`{column, op, value}`) or `and`/`or`/`not` compositions, any operator (`eq`, `gt`, `between`, `contains`, `isNull`, ...). |
| `target` | `'cell' \| 'row'` | `'cell'` | Style the matching cell(s), or the whole row. |
| `columns` | `string[]` | the `when` condition's own column | Cell target only: which columns to style. **Required when `when` is a compound expression** (`and`/`or`/`not`) — a compound rule without `columns` styles nothing. |
| `style` | `string` | — | Named preset: `success`, `warning`, `error`, `info`, or `muted`. Theme-aware — each preset has light and dark variants. |
| `css` | `object` | — | Inline CSS overrides with **camelCase** keys (React style names, e.g. `fontWeight`, `backgroundColor`), applied **on top of** `style`. |

A rule must provide `style` (with a known preset name) and/or `css`; rules with neither are skipped.

### Evaluation rules

- **First matching rule wins per target.** For cell targets this is per column: once a column has a cell format on a row, later cell rules cannot restyle it. Order your rules most-specific first.
- **One row rule and one cell rule compose** on the same row — e.g. a muted row background with a red amount cell on top.
- **Data rows only.** Total rows, the total column, and group aggregate header rows are never conditionally formatted.
- `when` sees the row's raw values (before `columnFormats` display formatting), with the same date-aware comparisons as regular filters.

## Examples

**Currency, percent, and date table**

Whole-dollar revenue, one-decimal growth ratio, printed dates. Note `growth` is stored as a ratio (`0.062` renders as `6.2%`).

```json
{
    "type": "table",
    "datasetId": "revenue",
    "title": "Monthly Revenue",
    "columnFormats": {
        "month": "date",
        "amount": { "format": "currency", "digits": 0 },
        "growth": { "format": "percent", "digits": 1 }
    }
}
```

**Durations with `hms`**

Job runtimes stored in seconds render as `HH:MM:SS`; the total row sums the raw seconds and formats the sum the same way.

```json
{
    "type": "table",
    "datasetId": "jobs",
    "title": "Job Runtimes",
    "columns": ["job", "started", "runtime"],
    "columnFormats": {
        "started": "date",
        "runtime": "hms"
    },
    "totalRow": { "label": "Total runtime", "fns": { "runtime": "sum" } }
}
```

**Non-dollar currency**

Euro amounts with a custom symbol; the total column stays formatted because both summed columns share the identical spec.

```json
{
    "type": "table",
    "datasetId": "invoices",
    "columns": ["invoice", "net", "tax"],
    "columnFormats": {
        "net": { "format": "currency", "symbol": "€", "digits": 2 },
        "tax": { "format": "currency", "symbol": "€", "digits": 2 }
    },
    "totalColumn": { "label": "Gross", "columns": ["net", "tax"] },
    "totalRow": true
}
```

**Formatted group aggregates**

The aggregate's `as` name matches the formatted `amount` column, so each group header shows `amount: $12,345` instead of a raw number.

```json
{
    "type": "table",
    "datasetId": "orders",
    "columns": ["region", "category", "amount"],
    "groupBy": "region",
    "groupAggregates": [{ "column": "amount", "fn": "sum", "as": "amount" }],
    "columnFormats": { "amount": { "format": "currency", "digits": 0 } }
}
```

**KPI-style thresholds with presets**

Classic traffic-light cells on a metrics table: green at or above target, amber in the warning band, red below. First match wins, so order the bands from best to worst.

```json
{
    "type": "table",
    "datasetId": "kpis",
    "title": "Service KPIs",
    "columnFormats": { "uptime": { "format": "percent", "digits": 2 } },
    "conditionalFormats": [
        { "when": { "column": "uptime", "op": "gte", "value": 0.999 }, "columns": ["uptime"], "style": "success" },
        { "when": { "column": "uptime", "op": "gte", "value": 0.99 }, "columns": ["uptime"], "style": "warning" },
        { "when": { "column": "uptime", "op": "lt", "value": 0.99 }, "columns": ["uptime"], "style": "error" }
    ]
}
```

**Compound-condition row highlighting**

A compound `when` (large *and* unreturned) marks the whole row. Row targets never need `columns`; a compound **cell** rule would require them.

```json
{
    "type": "table",
    "datasetId": "orders",
    "conditionalFormats": [
        {
            "when": {
                "and": [
                    { "column": "amount", "op": "gt", "value": 5000 },
                    { "column": "returned", "op": "eq", "value": "no" }
                ]
            },
            "target": "row",
            "style": "success"
        }
    ]
}
```

**Compound condition targeting specific cells**

The same compound condition as a cell rule: `columns` is required and picks which cells light up.

```json
{
    "type": "table",
    "datasetId": "orders",
    "conditionalFormats": [
        {
            "when": {
                "and": [
                    { "column": "amount", "op": "gt", "value": 5000 },
                    { "column": "region", "op": "eq", "value": "West" }
                ]
            },
            "columns": ["amount", "region"],
            "style": "info"
        }
    ]
}
```

**Row rule + cell rule composing**

Returned orders get a muted row; extreme amounts still get their own green/red cell on top of the row style. The two `amount` rules show first-match-wins ordering.

```json
{
    "type": "table",
    "datasetId": "orders",
    "columns": ["date", "region", "rep", "units", "amount", "returned"],
    "columnFormats": { "amount": "currency", "date": "date" },
    "conditionalFormats": [
        { "when": { "column": "returned", "op": "eq", "value": "yes" }, "target": "row", "style": "muted" },
        { "when": { "column": "amount", "op": "gt", "value": 1200 }, "style": "success" },
        { "when": { "column": "amount", "op": "lt", "value": 100 }, "style": "error" }
    ]
}
```

**CSS-only rules and preset overrides**

`css` works alone (no preset) or layered over one — here bold primary-colored units, and an error preset with an added underline.

```json
{
    "type": "table",
    "datasetId": "orders",
    "conditionalFormats": [
        { "when": { "column": "units", "op": "gte", "value": 30 }, "css": { "fontWeight": 700, "color": "var(--dl2-primary)" } },
        { "when": { "column": "amount", "op": "lt", "value": 0 }, "style": "error", "css": { "textDecoration": "underline" } }
    ]
}
```

**Formatted, highlighted checklist**

Everything above works identically on checklists.

```json
{
    "type": "checklist",
    "datasetId": "tasks",
    "statusColumn": "done",
    "warningColumn": "due",
    "columns": ["task", "priority", "due", "estHours"],
    "columnFormats": {
        "due": "date",
        "estHours": { "format": "number", "digits": 1 }
    },
    "conditionalFormats": [
        { "when": { "column": "priority", "op": "eq", "value": "High" }, "style": "error" },
        { "when": { "column": "estHours", "op": "gt", "value": 16 }, "css": { "fontWeight": 700 } }
    ]
}
```

## Tips & gotchas

- **Percent expects ratios.** Store `0.042` for 4.2%. If your data already holds `4.2`, use `{ "format": "number", "digits": 1 }` instead (or divide upstream).
- **`hms` is seconds in, `HH:MM:SS` out.** Minutes or milliseconds in the data will render wrong — convert to seconds first. Hours can exceed 24 (`90000` → `25:00:00`).
- **CSV is raw; clipboard is formatted.** If a stakeholder needs formatted values in a file, have them paste a clipboard copy into a spreadsheet instead of using the CSV export.
- **Rule order matters.** First matching rule wins per target, so put the most specific bands first (see the KPI example).
- **Compound cell rules need `columns`.** An `and`/`or`/`not` condition has no single "own column"; without `columns` the rule silently styles nothing (the validator warns).
- **Presets are theme-aware; raw colors are not.** Prefer `style` presets or CSS variables (`var(--dl2-error)`) in `css` so highlights read well in both light and dark themes.
- **Totals are exempt.** Conditional rules never touch total rows, total columns, or group headers — but `columnFormats` does format totals and aggregates.
- **Name aggregates after formatted columns** (`"as": "amount"`) to get formatted group headers; an `as` name that matches no `columnFormats` key renders raw.
- The validator warns about unknown `columnFormats` columns/kinds and malformed `conditionalFormats` (bad `when`, unknown preset or target, unresolvable columns) — check the console if a format seems ignored. See [Validation](validation.md).
- Live playgrounds: [test-table-features.html](../test-table-features.html) (formats + conditional formats on tables) and [test-checklist.html](../test-checklist.html).

## Related

- [Table](visuals/table.md) — where formats meet totals, grouping, and exports.
- [Checklist](visuals/checklist.md) — the same props on status-driven task lists.
- [Filtering & aggregation](filtering-and-aggregation.md) — the full filter grammar used by `when`, and aggregate specs.
- [Thresholds](thresholds.md) — value-based coloring for charts and gauges.
- [Validation](validation.md) — the console warnings that catch formatting config mistakes.
