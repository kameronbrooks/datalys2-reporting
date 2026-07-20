# Datasets

Every data-driven visual reads from a dataset declared in the top-level `datasets` object of your report configuration. The dictionary key is the dataset id — the value visuals reference through their `datasetId` property. One dataset can feed any number of visuals, and each visual can additionally slice it with its own `filter`/`aggregate` ([Filtering & Aggregation](filtering-and-aggregation.md)).

Datasets come in four data formats, can carry per-column data types (`dtypes`) that drive date parsing and numeric handling, can be stored gzip-compressed in separate script tags, and can be *derived* from other datasets by declaring a `source` plus a filter and/or aggregation.

## Minimal example

```json
{
    "datasets": {
        "sales": {
            "format": "records",
            "columns": ["region", "amount"],
            "dtypes": ["str", "float"],
            "data": [
                { "region": "North", "amount": 12500 },
                { "region": "South", "amount": 9800 }
            ]
        }
    }
}
```

## Property reference

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | string | the dictionary key | Unique dataset id. May be omitted — it is auto-filled from the dictionary key at load time, so warnings and lookups can name the dataset. |
| `format` | `"table"` \| `"records"` \| `"list"` \| `"record"` | — | The shape of `data`. See [The four formats](#the-four-formats). |
| `data` | array | — | The rows. Shape depends on `format`. May be `[]` when using `compressedData` or `source`. |
| `columns` | string[] | — | Column names, in order. For `table` format this defines the meaning of each array position; for `records` it names the object keys visuals should use. |
| `dtypes` | string[] | — | Per-column data types, aligned with `columns`. `"date"` / `"datetime"` trigger date parsing; `"int"` / `"float"` / `"number"` mark columns as numeric (e.g. for table totals); other values such as `"str"` are informational. |
| `compression` | `"none"` \| `"gzip"` | `"none"` | Set to `"gzip"` together with `compressedData` to load the data from a compressed script tag. |
| `compressedData` | string | — | The **id of a script tag** (type `text/b64-gzip`) containing the base64-encoded gzipped JSON for `data`. |
| `source` | string | — | Makes this a **derived dataset**: the id of another dataset to derive from. When set, `data`/`columns`/`dtypes`/`format` may be omitted — they are computed from the source. |
| `filter` | FilterExpression | — | Derived datasets only: filter applied to the source. Full grammar in [Filtering & Aggregation](filtering-and-aggregation.md#filter-expressions). |
| `aggregate` | AggregateSpec | — | Derived datasets only: group/aggregate applied after the filter. See [Filtering & Aggregation](filtering-and-aggregation.md#aggregate-specs). |

## The four formats

**`table`** — `data` is an array of arrays. Each row is positional: index `i` corresponds to `columns[i]`. Most compact for large data.

```json
{
    "format": "table",
    "columns": ["item", "quantity"],
    "dtypes": ["str", "int"],
    "data": [
        ["Widget A", 500],
        ["Widget B", 300]
    ]
}
```

**`records`** — `data` is an array of objects keyed by column name. Most readable; the format most visuals and derived aggregations produce.

```json
{
    "format": "records",
    "columns": ["item", "quantity"],
    "dtypes": ["str", "int"],
    "data": [
        { "item": "Widget A", "quantity": 500 },
        { "item": "Widget B", "quantity": 300 }
    ]
}
```

**`list`** — `data` is a flat array of values; each value is a whole "row". Only `dtypes[0]` applies. Useful for single-series visuals like [gauge](visuals/gauge.md) or [histogram](visuals/histogram.md) fed by plain numbers.

```json
{
    "format": "list",
    "columns": ["score"],
    "dtypes": ["float"],
    "data": [72.5, 68.1, 91.0, 84.2]
}
```

**`record`** — like `records` but by convention holds a single row: `data` is still an array containing one object. The library treats it identically to `records` everywhere. Handy for KPI-style "current values" datasets.

```json
{
    "format": "record",
    "columns": ["revenue", "target"],
    "dtypes": ["float", "float"],
    "data": [
        { "revenue": 50000, "target": 45000 }
    ]
}
```

## Columns, dtypes, and date parsing

`dtypes` is an array aligned with `columns`. What each value does:

| dtype | Effect |
|-------|--------|
| `"date"`, `"datetime"` | The column's values are converted to JavaScript `Date` objects at load time (rules below). Charts get real time axes, tables sort chronologically, and filter values against the column are parsed with the same rules. |
| `"int"`, `"float"`, `"number"` | Marks the column as numeric. Used e.g. by the table's `totalColumn: true` to decide which columns to sum, and by aggregation output typing. No value conversion is performed — supply real JSON numbers. |
| anything else (`"str"`, ...) | Informational only. |

### Date and datetime parsing rules

For every column whose dtype is `date` or `datetime` (and for `list`-format datasets when `dtypes[0]` is one of those), each value is converted as follows:

1. `null`, `undefined`, and `""` pass through unchanged (they render blank and sort last).
2. **Strings** are first parsed with the JavaScript `Date` constructor. Anything `new Date(value)` accepts works — ISO 8601 is the reliable, recommended form: `"2026-02-01"`, `"2026-02-01T14:30:00"`, `"2026-02-01T14:30:00Z"`, `"2026-02-01T14:30:00-05:00"`. Other human-readable forms (`"Feb 1, 2026"`) may work but are engine-dependent.
3. **Numeric strings** that the `Date` constructor rejects (e.g. `"1767225600"`) are treated as unix timestamps, using the same heuristic as numbers (next rule).
4. **Numbers** are treated as unix timestamps: values greater than `10000000000` are interpreted as **milliseconds** since the epoch, values up to `10000000000` as **seconds**. In practice: second timestamps work for dates up to the year 2286; millisecond timestamps work for dates after April 1970.
5. Anything else — including strings neither `Date` nor `Number` can parse — is left unchanged, **silently** (no console warning). The column then contains raw strings, and date-aware sorting/filtering will not treat them as dates.

Timezone note: per the JavaScript `Date` spec, date-only ISO strings (`"2026-02-01"`) are parsed as **UTC midnight**, while date-time strings without a zone (`"2026-02-01T14:30:00"`) are parsed as **local time**. If your report will be viewed across timezones, include an explicit offset or `Z`.

```json
{
    "format": "records",
    "columns": ["day", "created", "value"],
    "dtypes": ["date", "datetime", "float"],
    "data": [
        { "day": "2026-02-01", "created": "2026-02-01T14:30:00Z", "value": 10.5 },
        { "day": "2026-02-02", "created": 1770050000, "value": 11.2 },
        { "day": "2026-02-03", "created": 1770137000000, "value": 9.8 }
    ]
}
```

All three `created` values above become `Date` objects: an ISO string, a seconds timestamp, and a milliseconds timestamp.

## Compressed datasets

Large datasets can be stored gzip-compressed to keep the HTML file small. The data lives in its **own script tag**, and the dataset references that tag by id:

1. Serialize the `data` array to JSON, gzip it, and base64-encode the result.
2. Put the base64 string in a `<script>` tag with `type="text/b64-gzip"` and a unique `id`.
3. In the dataset, set `"compression": "gzip"` and `"compressedData"` to that script tag's id.

```html
<script id="large-data-source" type="text/b64-gzip">
H4sIAAAAAAAACouOVvIsSc1VcFTSMTQwiNWBcp2UdIyQuM5KOsYGBrGxAEZgS5ouAAAA
</script>

<script id="report-data" type="application/json">
{
    "pages": [],
    "datasets": {
        "bigSales": {
            "format": "table",
            "columns": ["item", "value"],
            "dtypes": ["str", "float"],
            "compression": "gzip",
            "compressedData": "large-data-source",
            "data": []
        }
    }
}
</script>
```

Decompression happens at load time via the browser's `DecompressionStream` API. Date columns are processed **after** decompression, so `dtypes` date parsing applies to compressed data too.

### Memory reclamation (`gc-compressed-data`)

Decompressing large base64 strings leaves both the original string and the decompressed data in memory. Add this meta tag to reclaim the originals:

```html
<meta name="gc-compressed-data" content="true">
```

When present, after decompression the library clears the `textContent` of every script tag referenced by a `compressedData` property, deletes the `compressedData` property from the dataset, and sets its `compression` back to `"none"` — allowing the garbage collector to free the base64 strings. It also clears the `report-data` script's own text after parsing.

## Derived datasets

A dataset with a `source` property is computed from another dataset at load time by applying an optional `filter` and then an optional `aggregate`. Use derived datasets when several visuals share the same transformed view — the work is done once, and every visual references the derived id like any other dataset.

```json
{
    "datasets": {
        "sales": {
            "format": "records",
            "columns": ["region", "category", "amount"],
            "dtypes": ["str", "str", "float"],
            "data": [
                { "region": "West", "category": "Electronics", "amount": 1200 },
                { "region": "West", "category": "Office", "amount": 300 },
                { "region": "East", "category": "Electronics", "amount": 900 }
            ]
        },
        "westSales": {
            "source": "sales",
            "filter": { "column": "region", "op": "eq", "value": "West" }
        }
    }
}
```

Behavior details:

- The derived dataset starts as a copy of the source's `columns`/`dtypes`/`format`/`data`; the `filter` then keeps matching rows, and the `aggregate` (if any) groups and summarizes them. The full filter grammar (operators, `and`/`or`/`not` nesting, date coercion) is documented in [Filtering & Aggregation](filtering-and-aggregation.md#filter-expressions), and aggregate specs in [Filtering & Aggregation](filtering-and-aggregation.md#aggregate-specs).
- An aggregated result is always a `records`-format dataset with the `groupBy` columns first, followed by one column per aggregate, named by `as` (default `"{fn}_{column}"`, e.g. `sum_amount`).
- **Chaining** is supported: a derived dataset's `source` may itself be a derived dataset. Chains are resolved in dependency order regardless of declaration order.
- **Cycles** (`a` → `b` → `a`) are detected; each dataset in the cycle is left unresolved with a console warning: `[datalys2] Derived dataset "a" is part of a circular "source" chain — left unresolved.`
- A **missing source** warns `[datalys2] Derived dataset "x": source dataset "y" could not be resolved.` and leaves the dataset with whatever `data` it declared (defaulting to empty). The [validator](validation.md) also flags missing sources and bad filter/aggregate column names at load.
- Filtering and aggregation apply to `table` and `records` format sources only. A `list` or `record` source passes through unchanged with a console warning (`Filtering is not supported for 'list'-format dataset ...`).
- Derived output is materialized data — a derived dataset never re-runs decompression, even if its source was compressed.

## Examples

**A table-format dataset feeding a chart**

Positional rows keep large data compact. Column references in visuals can use names or, for table format, numeric indices:

```json
{
    "monthlySales": {
        "format": "table",
        "columns": ["month", "revenue", "units"],
        "dtypes": ["str", "float", "int"],
        "data": [
            ["Jan", 42000, 310],
            ["Feb", 39500, 288],
            ["Mar", 47800, 351]
        ]
    }
}
```

**A single-record dataset for KPIs**

One row of "current values"; KPIs read it with the default `rowIndex` 0:

```json
{
    "kpiSnapshot": {
        "format": "record",
        "columns": ["revenue", "revenueYesterday", "uptime"],
        "dtypes": ["float", "float", "float"],
        "data": [
            { "revenue": 50000, "revenueYesterday": 47200, "uptime": 99.97 }
        ]
    }
}
```

**A list-format dataset for a histogram**

A flat array of numbers — each value is a row:

```json
{
    "responseTimes": {
        "format": "list",
        "columns": ["ms"],
        "dtypes": ["float"],
        "data": [120, 145, 98, 210, 176, 133, 187, 95, 240, 158]
    }
}
```

**Date columns from mixed sources**

ISO strings and unix timestamps in the same column all become `Date` objects because the dtype is `date`:

```json
{
    "deployments": {
        "format": "records",
        "columns": ["service", "deployedAt"],
        "dtypes": ["str", "datetime"],
        "data": [
            { "service": "api", "deployedAt": "2026-07-01T09:15:00Z" },
            { "service": "web", "deployedAt": 1751360400 },
            { "service": "jobs", "deployedAt": 1751389200000 }
        ]
    }
}
```

**Derived: filter then aggregate in one step**

A derived dataset may declare both; the filter runs first:

```json
{
    "sales": {
        "format": "records",
        "columns": ["region", "category", "amount"],
        "dtypes": ["str", "str", "float"],
        "data": [
            { "region": "West", "category": "Electronics", "amount": 1200 },
            { "region": "West", "category": "Office", "amount": 300 },
            { "region": "West", "category": "Electronics", "amount": 450 },
            { "region": "East", "category": "Electronics", "amount": 900 }
        ]
    },
    "westByCategory": {
        "source": "sales",
        "filter": { "column": "region", "op": "eq", "value": "West" },
        "aggregate": {
            "groupBy": ["category"],
            "aggregates": [
                { "column": "amount", "fn": "sum", "as": "total" },
                { "column": "amount", "fn": "count", "as": "orders" }
            ]
        }
    }
}
```

`westByCategory` becomes a records dataset with columns `category`, `total`, `orders` — reference those names in visuals (`"xColumn": "category"`, `"yColumns": "total"`).

**Derived: chained transformations**

Each step references the previous one; declaration order does not matter:

```json
{
    "orders": {
        "format": "records",
        "columns": ["date", "region", "amount"],
        "dtypes": ["date", "str", "float"],
        "data": [
            { "date": "2026-06-02", "region": "West", "amount": 800 },
            { "date": "2026-06-15", "region": "West", "amount": 1250 },
            { "date": "2026-07-03", "region": "East", "amount": 640 }
        ]
    },
    "recentOrders": {
        "source": "orders",
        "filter": { "column": "date", "op": "gte", "value": "2026-06-01" }
    },
    "recentByRegion": {
        "source": "recentOrders",
        "aggregate": {
            "groupBy": ["region"],
            "aggregates": [{ "column": "amount", "fn": "sum", "as": "total" }]
        }
    }
}
```

Note the date filter value `"2026-06-01"` — because the `date` column's dtype is `date`, filter values are parsed with the same rules as dataset loading (ISO strings or unix timestamps). Details in [Filtering & Aggregation](filtering-and-aggregation.md).

**Derived: one base dataset, many views**

A common pattern — the base dataset is loaded once (possibly compressed), and cheap derived views feed different visuals:

```json
{
    "tickets": {
        "format": "records",
        "columns": ["team", "status", "ageDays"],
        "dtypes": ["str", "str", "int"],
        "data": [
            { "team": "Core", "status": "open", "ageDays": 12 },
            { "team": "Core", "status": "closed", "ageDays": 3 },
            { "team": "Web", "status": "open", "ageDays": 25 },
            { "team": "Web", "status": "open", "ageDays": 2 }
        ]
    },
    "openTickets": {
        "source": "tickets",
        "filter": { "column": "status", "op": "eq", "value": "open" }
    },
    "openByTeam": {
        "source": "openTickets",
        "aggregate": {
            "groupBy": ["team"],
            "aggregates": [
                { "column": "ageDays", "fn": "count", "as": "open" },
                { "column": "ageDays", "fn": "max", "as": "oldest" }
            ]
        }
    },
    "staleTickets": {
        "source": "openTickets",
        "filter": { "column": "ageDays", "op": "gt", "value": 14 }
    }
}
```

**Compressed dataset with memory reclamation**

The full HTML pattern for a big dataset:

```html
<head>
    <meta name="gc-compressed-data" content="true">
</head>
<body>
    <script id="orders-gz" type="text/b64-gzip">
H4sIAAAAAAAACouOVvIsSc1VcFTSMTQwiNWBcp2UdIyQuM5KOsYGBrGxAEZgS5ouAAAA
    </script>
    <script id="report-data" type="application/json">
{
    "pages": [],
    "datasets": {
        "orders": {
            "format": "table",
            "columns": ["id", "amount"],
            "dtypes": ["int", "float"],
            "compression": "gzip",
            "compressedData": "orders-gz",
            "data": []
        }
    }
}
    </script>
    <div id="root"></div>
    <script src="datalys2-reports.min.js"></script>
</body>
```

## Tips & gotchas

- The dictionary key is the id visuals use in `datasetId`. The inner `id` property is optional and auto-filled from the key; if you do set it, keep it identical to the key to avoid confusion.
- If a `compressedData` script tag id does not exist, the console warns `Compressed data script tag with ID "..." not found for dataset ...` and the dataset keeps its inline `data` (usually `[]`). A failed decompression logs a `console.error` and likewise leaves the dataset empty.
- Unparseable date strings are left as-is with **no warning** — if a date column sorts alphabetically or a chart's time axis looks wrong, check the raw values first.
- Numeric timestamps around the seconds/milliseconds boundary: any number ≤ 10,000,000,000 is read as seconds. Millisecond timestamps for dates before late April 1970 would be misread as seconds — use ISO strings if you need dates that old.
- `dtypes` does not convert numbers: `"amount": "1200"` (a string) stays a string even with dtype `"float"`. Emit real JSON numbers for numeric columns.
- Aggregated derived datasets change the column set. Visuals referencing the derived dataset must use the output names (`groupBy` columns plus each aggregate's `as`), and the validator checks against those.
- Filtering/aggregation on `list`/`record` format datasets is ignored with a console warning — convert such data to `records` if you need to derive from it.
- Cycle and missing-source warnings leave the affected datasets unresolved; visuals bound to them render with empty data rather than crashing.
- Derived datasets recompute nothing at runtime — they are resolved once at load. Per-visual `filter`/`aggregate` props are the alternative when only a single visual needs the transformed view.

## Related

- [Filtering & Aggregation](filtering-and-aggregation.md) — the full filter grammar and aggregate functions used by derived datasets and per-visual props
- [Getting Started](getting-started.md) — the HTML skeleton and the `gc-compressed-data` / `dl2-validate` meta tags
- [Pages & Layouts](pages-and-layouts.md) — where visuals reference datasets
- [Validation](validation.md) — the load-time warnings for dataset and column mistakes
- [Formatting](formatting.md) — display formatting of values (independent of dtypes)
- Working test pages: [../test-filters.html](../test-filters.html), [../test.html](../test.html), [../test-all-visuals.html](../test-all-visuals.html)
