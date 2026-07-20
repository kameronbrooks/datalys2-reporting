# Filtering & Aggregation

A single dataset can feed many visuals, each showing its own slice or rollup of the data — entirely client-side, with no need to pre-filter anything before embedding it in the report. Two building blocks power this: **filter expressions** (a JSON grammar for selecting rows) and **aggregate specs** (group-by with aggregate functions). You can apply them in three places: directly on a visual (`filter` / `aggregate` props), in a **derived dataset** (a dataset computed from another one), and — for library extenders — via the `useDataset` hook.

Filtering and aggregation never mutate your data. Applying a filter produces a new dataset object whose rows are shared by reference with the original, and aggregation produces a brand-new records-format dataset. Other visuals referencing the same `datasetId` are completely unaffected.

## Minimal example

Two tables share one dataset; the second one only sees rows where `region` is `"West"`:

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
                        { "type": "table", "datasetId": "sales", "title": "All sales" },
                        {
                            "type": "table",
                            "datasetId": "sales",
                            "title": "West only",
                            "filter": { "column": "region", "op": "eq", "value": "West" }
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "sales": {
            "format": "records",
            "columns": ["region", "amount"],
            "dtypes": ["str", "float"],
            "data": [
                { "region": "West", "amount": 620.5 },
                { "region": "East", "amount": 310.0 },
                { "region": "West", "amount": 145.25 }
            ]
        }
    }
}
```

## Filter expressions

A `FilterExpression` is either a single **condition**:

```json
{ "column": "region", "op": "eq", "value": "West" }
```

or a boolean **group** that composes other expressions, nestable to any depth:

```json
{ "and": [ { "column": "amount", "op": "gt", "value": 100 }, { "column": "region", "op": "eq", "value": "West" } ] }
```

### Condition properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `column` | `string \| number` | required | Column name, or a numeric column index. Indexes resolve through the dataset's `columns` array, so they work for both `table` (array rows) and `records` (object rows) formats. |
| `op` | `string` | required | One of the operators below. An unknown `op` logs a `[datalys2]` warning and the condition matches nothing. |
| `value` | `any` | — | The comparison value. For `between`, a `[low, high]` pair may be given here instead of `values`. For `in` / `nin`, an array here is used as the value list when `values` is absent (a non-array `value` is treated as a one-element list). |
| `values` | `any[]` | — | The value list for `in` / `nin`, or the `[low, high]` pair for `between`. Takes precedence over `value`. |

### Group properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `and` | `FilterExpression[]` | — | Matches when **every** sub-expression matches. |
| `or` | `FilterExpression[]` | — | Matches when **at least one** sub-expression matches. |
| `not` | `FilterExpression` | — | Matches when the sub-expression does **not** match. |

Set **exactly one** of `and`, `or`, `not` per group. If you set both `and` and `or`, only `and` is evaluated and `or` is silently ignored. A group with none of the three set matches every row.

### Operators

| Op | Meaning | Notes |
|----|---------|-------|
| `eq` | Equals | Strict equality (after date coercion). |
| `neq` | Not equals | Null/empty cells count as "not equal", so they match. |
| `gt` | Greater than | `null`/`undefined` cells never match. |
| `gte` | Greater than or equal | `null`/`undefined` cells never match. |
| `lt` | Less than | `null`/`undefined` cells never match. |
| `lte` | Less than or equal | `null`/`undefined` cells never match. |
| `in` | Value is in the list | List from `values` (or an array `value`). |
| `nin` | Value is not in the list | Complement of `in`. |
| `contains` | String contains | Case-insensitive; `null`/`undefined` cells never match. |
| `startsWith` | String starts with | Case-insensitive. |
| `endsWith` | String ends with | Case-insensitive. |
| `between` | Inclusive range | `[low, high]` via `values` (or `value`). Fewer than two entries matches nothing. |
| `isNull` | Cell is empty | Matches `null`, `undefined`, and the empty string `""`. No `value` needed. |
| `notNull` | Cell is not empty | The complement of `isNull`. No `value` needed. |

### One example per operator

Each snippet below is a complete `filter` value you can paste onto a visual.

`eq` — exact match:

```json
{ "column": "region", "op": "eq", "value": "West" }
```

`neq` — everything except one value:

```json
{ "column": "status", "op": "neq", "value": "cancelled" }
```

`gt` — strictly greater:

```json
{ "column": "amount", "op": "gt", "value": 400 }
```

`gte` — at least:

```json
{ "column": "amount", "op": "gte", "value": 500 }
```

`lt` — strictly less:

```json
{ "column": "score", "op": "lt", "value": 75 }
```

`lte` — at most:

```json
{ "column": "score", "op": "lte", "value": 100 }
```

`in` — one of several values:

```json
{ "column": "category", "op": "in", "values": ["Electronics", "Office"] }
```

`nin` — none of several values:

```json
{ "column": "region", "op": "nin", "values": ["North", "East"] }
```

`contains` — case-insensitive substring:

```json
{ "column": "rep", "op": "contains", "value": "an" }
```

`startsWith` — case-insensitive prefix:

```json
{ "column": "sku", "op": "startsWith", "value": "ELEC-" }
```

`endsWith` — case-insensitive suffix:

```json
{ "column": "email", "op": "endsWith", "value": "@example.com" }
```

`between` — inclusive range (both ends included):

```json
{ "column": "amount", "op": "between", "values": [100, 500] }
```

`isNull` — empty cells (`null`, `undefined`, or `""`):

```json
{ "column": "closedDate", "op": "isNull" }
```

`notNull` — non-empty cells:

```json
{ "column": "closedDate", "op": "notNull" }
```

### Dates in filters

When the column's `dtype` is `date` or `datetime`, filter values are parsed with the same rules as dataset loading: ISO strings (`"2026-02-01"`), unix timestamps in seconds, or unix timestamps in milliseconds (numbers above 10,000,000,000 are treated as milliseconds). The comparison itself happens on epoch milliseconds, so range and equality operators behave as expected:

```json
{ "column": "date", "op": "between", "values": ["2026-02-01", "2026-03-31"] }
```

If the column's `dtype` is **not** declared as `date`/`datetime`, no coercion happens and string values are compared as plain strings.

## Aggregate specs

An `AggregateSpec` groups rows and computes one output row per group. The result is always a **records-format** dataset whose columns are the `groupBy` columns first, followed by the aggregate output columns. Groups appear in first-seen row order.

```json
{
    "groupBy": ["region"],
    "aggregates": [
        { "column": "amount", "fn": "sum", "as": "total" },
        { "column": "amount", "fn": "count", "as": "orders" }
    ]
}
```

### AggregateSpec properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `groupBy` | `(string \| number)[]` | required | Columns to group by. Must be a non-empty array or the aggregate is ignored with a warning. These become the first output columns. |
| `aggregates` | `AggregateColumn[]` | required | The aggregate output columns, in order. |

### AggregateColumn properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `column` | `string \| number` | required | The input column to aggregate. |
| `fn` | `string` | required | One of the aggregate functions below. |
| `as` | `string` | `"{fn}_{column}"` | The output column name, e.g. `sum_amount` when omitted. |

### Aggregate functions

| Fn | Result | Notes |
|----|--------|-------|
| `sum` | Sum of numeric values | Ignores `null`/non-numeric values; all-empty groups produce `null`. |
| `avg` | Mean of numeric values | Same null handling as `sum`. |
| `min` | Smallest value | Date columns stay dates in the output. |
| `max` | Largest value | Date columns stay dates in the output. |
| `count` | Number of rows in the group | Counts every row, including rows with empty cells. |
| `countDistinct` | Number of distinct values | Dates are compared by timestamp. |
| `first` | Value from the group's first row | Keeps the source column's dtype. |
| `last` | Value from the group's last row | Keeps the source column's dtype. |

When a visual declares both `filter` and `aggregate`, the **filter runs first**, then the aggregate — so the rollup only covers rows that passed the filter. An unknown `fn` logs a `[datalys2]` warning and produces `null`.

## Where filters and aggregates apply

### 1. Per-visual `filter` / `aggregate` props

Any visual with a `datasetId` may declare `filter` and/or `aggregate`. Only **that visual's view** of the dataset is transformed — the library re-scopes the dataset for that single visual, so every other visual sharing the same `datasetId` still sees the full data. This makes "one dataset, many slices" dashboards trivial (see the examples below).

### 2. Derived datasets

A dataset in the `datasets` object may declare a `source` (the id of another dataset) plus an optional `filter` and/or `aggregate`. It is computed **once at load time** and can then be referenced by any number of visuals like a normal dataset:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `source` | `string` | — | Id of the dataset to derive from. When set, `data`/`columns`/`dtypes`/`format` may be omitted — they are computed. |
| `filter` | `FilterExpression` | — | Filter applied to the source dataset. |
| `aggregate` | `AggregateSpec` | — | Group/aggregate applied after the filter. |

Derived datasets can chain — a derived dataset can be the `source` of another derived dataset, and chains are resolved in dependency order regardless of declaration order. Circular `source` chains and missing sources are reported with a `[datalys2]` console warning and left unresolved.

Prefer a derived dataset over repeating the same per-visual filter when three or more visuals need the same slice: it is computed once, and there is a single definition to maintain.

### 3. The `useDataset` hook (library extenders)

If you are writing a custom visual component against the library's source, the `useDataset(datasetId, filter?, aggregate?)` React hook returns the (optionally filtered/aggregated) dataset from the app context, memoized. Visuals rendered through the registry already receive a filtered view automatically — the hook is only needed for components that access datasets directly. Report authors never need this.

## Examples

**Simple slice — one region.** A table showing only West-region rows:

```json
{
    "type": "table",
    "datasetId": "sales",
    "title": "West only",
    "filter": { "column": "region", "op": "eq", "value": "West" }
}
```

**Nested boolean logic.** Orders over 400 in either of two categories — an `or` group nested inside an `and`:

```json
{
    "type": "table",
    "datasetId": "sales",
    "title": "Big Electronics or Office orders",
    "filter": {
        "and": [
            { "column": "amount", "op": "gt", "value": 400 },
            {
                "or": [
                    { "column": "category", "op": "eq", "value": "Electronics" },
                    { "column": "category", "op": "eq", "value": "Office" }
                ]
            }
        ]
    }
}
```

**Negation.** Everything that is *not* a completed North-region order:

```json
{
    "type": "table",
    "datasetId": "orders",
    "filter": {
        "not": {
            "and": [
                { "column": "region", "op": "eq", "value": "North" },
                { "column": "status", "op": "eq", "value": "complete" }
            ]
        }
    }
}
```

**Date window.** A line chart restricted to February–March (the `date` column has `dtype` `"date"`):

```json
{
    "type": "line",
    "datasetId": "sales",
    "title": "Feb–Mar amounts over time",
    "xColumn": "date",
    "yColumns": "amount",
    "filter": { "column": "date", "op": "between", "values": ["2026-02-01", "2026-03-31"] }
}
```

**One dataset, three visuals.** A dashboard row where each visual slices the same shared dataset independently — no visual affects the others:

```json
{
    "type": "layout",
    "direction": "row",
    "children": [
        { "type": "table", "datasetId": "sales", "title": "All sales" },
        {
            "type": "table",
            "datasetId": "sales",
            "title": "West only",
            "filter": { "column": "region", "op": "eq", "value": "West" }
        },
        {
            "type": "clusteredBar",
            "datasetId": "sales",
            "title": "Total by region",
            "aggregate": {
                "groupBy": ["region"],
                "aggregates": [{ "column": "amount", "fn": "sum", "as": "total" }]
            },
            "xColumn": "region",
            "yColumns": "total"
        }
    ]
}
```

**Filter + aggregate combined.** Average deal size per rep, counting only deals of at least 100 (filter runs first):

```json
{
    "type": "table",
    "datasetId": "sales",
    "title": "Avg deal ≥ 100, by rep",
    "filter": { "column": "amount", "op": "gte", "value": 100 },
    "aggregate": {
        "groupBy": ["rep"],
        "aggregates": [
            { "column": "amount", "fn": "avg", "as": "avg_deal" },
            { "column": "amount", "fn": "count", "as": "deals" }
        ]
    }
}
```

**Multi-column groupBy with default output names.** Grouping by two columns; the second aggregate omits `as`, so its output column is named `count_amount`:

```json
{
    "type": "table",
    "datasetId": "sales",
    "aggregate": {
        "groupBy": ["region", "category"],
        "aggregates": [
            { "column": "amount", "fn": "sum", "as": "total" },
            { "column": "amount", "fn": "count" }
        ]
    }
}
```

**Derived dataset chain.** `westSales` filters the base dataset; `westByCategory` aggregates the *derived* one. A pie chart then uses the end of the chain like any other dataset:

```json
{
    "pages": [
        {
            "title": "West",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "pie",
                            "datasetId": "westByCategory",
                            "title": "West sales by category",
                            "categoryColumn": "category",
                            "valueColumn": "total"
                        },
                        { "type": "table", "datasetId": "westSales", "title": "West detail rows" }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "sales": {
            "format": "records",
            "columns": ["region", "category", "amount"],
            "dtypes": ["str", "str", "float"],
            "data": [
                { "region": "West", "category": "Electronics", "amount": 620.5 },
                { "region": "East", "category": "Furniture", "amount": 310.0 },
                { "region": "West", "category": "Office", "amount": 615.3 },
                { "region": "West", "category": "Electronics", "amount": 505.75 }
            ]
        },
        "westSales": {
            "source": "sales",
            "filter": { "column": "region", "op": "eq", "value": "West" }
        },
        "westByCategory": {
            "source": "westSales",
            "aggregate": {
                "groupBy": ["category"],
                "aggregates": [{ "column": "amount", "fn": "sum", "as": "total" }]
            }
        }
    }
}
```

**List membership and empty-cell checks together.** Open items assigned to two specific reps:

```json
{
    "type": "checklist",
    "datasetId": "tasks",
    "statusColumn": "done",
    "filter": {
        "and": [
            { "column": "rep", "op": "in", "values": ["Ana", "Ben"] },
            { "column": "closedDate", "op": "isNull" }
        ]
    }
}
```

## Tips & gotchas

- **Set exactly one of `and` / `or` / `not` per group.** If both `and` and `or` are present, only `and` is evaluated. Nest a second group instead.
- **Unknown operators match nothing.** A typo like `"op": "equals"` logs `[datalys2] Unknown filter op "equals" — condition treated as non-matching.` The load-time validator also lists the valid ops.
- **Only `table` and `records` formats can be filtered/aggregated.** `list` and `record` datasets pass through unchanged with a console warning (`Filtering is not supported for 'list'-format dataset ...`).
- **`isNull` matches empty strings** (`""`), not just `null`/`undefined`. Conversely, `notNull` excludes them.
- **A misspelled column name reads as `undefined`** for every row — so most operators match nothing, `neq` matches everything, and `isNull` matches *every* row. The validator warns about filter columns that are not in the referenced dataset, so keep an eye on the console.
- **String operators are case-insensitive** (`contains`, `startsWith`, `endsWith`); both the cell and the filter value are lowercased. `eq`/`neq` remain case-sensitive.
- **`between` is inclusive on both ends** and requires two values; `null`/`undefined` cells never fall in a range.
- **Filter first, aggregate second** — both on visuals and in derived datasets. If you need to filter *after* aggregating, chain two derived datasets (aggregate in the first, filter in the second).
- **After an aggregate, only the output columns exist.** Reference the `groupBy` names and the `as` names (or the `{fn}_{column}` defaults) in `xColumn`/`yColumns`/etc. The validator intentionally skips column checks on visuals that declare an `aggregate` for this reason.
- **Aggregation always outputs `records` format** with group columns first — handy to remember when pointing table `columns` or chart axes at the result.
- **Filtered datasets share row references.** This is what keeps filtering cheap, and since visuals never mutate data it is safe; the original dataset object is never modified.
- **Derived-dataset cycles are detected**, warned about (`... is part of a circular "source" chain — left unresolved.`), and left with whatever `data` the definition declared (default empty).

## Related

- [Datasets](datasets.md) — formats, dtypes, compression, derived datasets in context
- [Templates & Expressions](templates-and-expressions.md) — computed text from datasets
- [Validation](validation.md) — every filter/aggregate warning the validator can emit
- [Table](visuals/table.md) and [Checklist](visuals/checklist.md) — visuals with their own grouping/aggregate UI on top
- Live example page: [../test-filters.html](../test-filters.html)
