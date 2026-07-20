# Templates & Expressions

Card text and titles support a `{{ ... }}` template syntax that lets a report compute values from its own datasets at render time — row counts, sums, formatted currency, and anything else you can write as a JavaScript expression. The same engine powers **row-detail modal cards**, where templates can reference the clicked table/checklist row through the `row` variable.

The contents of each `{{ ... }}` placeholder are evaluated as a **JavaScript expression** in the viewer's browser, with the report's datasets and a set of helper functions in scope. That is powerful, and it comes with a security caveat: only embed template expressions in HTML/JSON you trust (see the warning below).

## Minimal example

```json
{
    "pages": [
        {
            "title": "Summary",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "card",
                            "title": "Dataset Summary",
                            "text": "Rows in tasksData: {{ count('tasksData') }}"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "tasksData": {
            "format": "records",
            "columns": ["task", "done"],
            "dtypes": ["str", "bool"],
            "data": [
                { "task": "Write report", "done": true },
                { "task": "Review report", "done": false }
            ]
        }
    }
}
```

## Where templates work

| Location | Templated properties | Extra variables |
|----------|----------------------|-----------------|
| Card visual (`type: "card"`) — on pages and inside modals | `title`, `text` | — |
| Cards inside a **custom row modal** (`rowModalId` on a table or checklist) | `title`, `text` | `row` — the clicked data row |

## Value forms

A templated property accepts either a plain string or an object:

| Form | Type | Default | Description |
|------|------|---------|-------------|
| `"..."` | `string` | — | A template string; every `{{ ... }}` placeholder is evaluated as a JavaScript expression and replaced with its result. |
| `{ "template": "..." }` | `object` | — | Same as the plain string form. |
| `{ "expr": "..." }` | `object` | — | The **whole value** is a single JavaScript expression — no `{{ }}` needed. Useful when the entire title/text is computed. |
| `{ "unsafeJs": "..." }` | `object` | — | Alias for `expr` (takes precedence if both are set). The name is a reminder that this is arbitrary code execution. |

Results are stringified for display: `null`/`undefined` render as an empty string, numbers and booleans via `String(...)`, and objects/arrays as JSON. If an expression throws, the console logs `Failed to evaluate template expression` and the placeholder renders as an empty string — the report keeps working.

## Available variables

Inside every expression these variables are in scope:

| Variable | Type | Description |
|----------|------|-------------|
| `datasets` | `object` | All datasets from `report-data`, keyed by id — e.g. `datasets.sales.data.length`, `datasets.sales.data[0][1]`. Derived datasets are already resolved. |
| `props` | `object` | Reserved for future use; currently `{}` for cards. |
| `row` | `object` | The clicked data row, keyed by column name — **only populated inside row-detail modals**. Elsewhere it is `{}`, so `row.anything` is `undefined` (renders empty). |
| `helpers` | `object` | The helper functions below (also available directly, without the `helpers.` prefix). |

## Helper functions

The helpers are destructured into scope, so `{{ count('sales') }}` and `{{ helpers.count('sales') }}` are equivalent.

| Helper | Signature | Description |
|--------|-----------|-------------|
| `count` | `count(datasetId)` | Number of rows in the dataset (`0` if the dataset is missing). Works with **any** dataset format. |
| `sum` | `sum(datasetId, column)` | Sum of the numeric values in a column. `column` is a name or index. Works with table- and records-format datasets; non-numeric cells are skipped. |
| `avg` | `avg(datasetId, column)` | Mean of the numeric values in a column. |
| `min` | `min(datasetId, column)` | Smallest numeric value in a column. |
| `max` | `max(datasetId, column)` | Largest numeric value in a column. |
| `formatNumber` | `formatNumber(value, digits?)` | Locale-formatted number (e.g. `12,345.6`); with `digits`, fixed decimals via `toFixed`. Non-numeric input renders empty. |
| `formatPercent` | `formatPercent(value, digits?)` | Multiplies by 100 and appends `%`. `digits` defaults to `1` — `formatPercent(0.257)` → `"25.7%"`. |
| `formatCurrency` | `formatCurrency(value, symbol?, digits?)` | Currency string; `symbol` defaults to `"$"`, `digits` to `2` — `formatCurrency(1234.5)` → `"$1,234.50"`. |

Because placeholders are full JavaScript expressions, anything else is possible too — ternaries, arithmetic, string methods, and array methods over `datasets.<id>.data` — for any computation the helpers don't cover (weighted averages, joins across datasets, and so on).

## Security caveat

Template expressions execute **arbitrary JavaScript** in the viewer's browser. Since `report-data` is embedded in the HTML file, a malicious report config can run malicious code. Only author or publish reports whose HTML/JSON you fully control, and treat report files from untrusted sources like you would treat untrusted scripts.

## Examples

**Computed summary card.** Row count plus a formatted total from a table-format dataset:

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
                            "type": "card",
                            "title": "Sales summary",
                            "text": "{{ count('sales') }} orders totalling {{ formatCurrency(sum('sales', 'amount'), '$', 0) }}"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "sales": {
            "format": "table",
            "columns": ["region", "amount"],
            "dtypes": ["str", "float"],
            "data": [
                ["West", 620.5],
                ["East", 310.0],
                ["West", 145.25]
            ]
        }
    }
}
```

**Whole-value expression (`expr`).** The entire title and text are single expressions — no `{{ }}` markers:

```json
{
    "type": "card",
    "title": { "expr": "'Rows: ' + count('tasksData')" },
    "text": { "expr": "formatCurrency(sum('kpiData', 'Value'), '$', 0)" }
}
```

**Currency and percent formatting.** Average deal size and a completion ratio:

```json
{
    "type": "card",
    "title": "Deals",
    "text": "Average deal: {{ formatCurrency(avg('sales', 'amount')) }} — biggest: {{ formatCurrency(max('sales', 'amount')) }} ({{ formatPercent(0.62) }} of target)"
}
```

**Custom computations: use plain JavaScript.** When the helpers don't cover it, reduce the rows inline — here a weighted average over a records-format dataset:

```json
{
    "type": "card",
    "title": "Weighted average price",
    "text": "{{ formatCurrency(datasets.salesRecords.data.reduce(function (a, r) { return a + r.price * r.units; }, 0) / sum('salesRecords', 'units')) }}"
}
```

**Conditional text.** A ternary picks the message:

```json
{
    "type": "card",
    "title": "Status",
    "text": "{{ count('openIncidents') === 0 ? 'All clear' : count('openIncidents') + ' open incidents' }}"
}
```

**Direct dataset paths.** Reaching into a specific cell of a table-format dataset:

```json
{
    "type": "card",
    "text": "First region in the dataset: {{ datasets.sales.data[0][0] }}"
}
```

**Row-modal template.** A table opens a custom modal per row; the card inside references the clicked row via `row.*`. Markdown (`contentType: "md"`) and templates combine — templates render first, then the markdown is converted:

```json
{
    "pages": [
        {
            "title": "Orders",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "table",
                            "id": "orders-table",
                            "datasetId": "orders",
                            "rowModalId": "order-detail-modal"
                        }
                    ]
                }
            ]
        }
    ],
    "modals": [
        {
            "id": "order-detail-modal",
            "title": "Order",
            "rows": [
                {
                    "type": "layout",
                    "direction": "column",
                    "children": [
                        {
                            "type": "card",
                            "title": "Order #{{ row.id }} — {{ row.region }}",
                            "contentType": "md",
                            "text": "**Rep:** {{ row.rep }}\n**Amount:** {{ formatCurrency(row.amount) }}"
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "orders": {
            "format": "records",
            "columns": ["id", "region", "rep", "amount"],
            "dtypes": ["int", "str", "str", "float"],
            "data": [
                { "id": 1, "region": "West", "rep": "Ana", "amount": 620.5 },
                { "id": 2, "region": "East", "rep": "Ben", "amount": 310.0 }
            ]
        }
    }
}
```

**Markdown card with computed content.** Headings, bold, and a template in one card:

```json
{
    "type": "card",
    "contentType": "md",
    "text": "## Weekly digest\n**Orders:** {{ count('orders') }}\n**Revenue:** {{ formatCurrency(sum('salesTable', 'amount')) }}\n\nSee the [orders table](#orders-table) for details."
}
```

## Tips & gotchas

- **Aggregation helpers skip non-numeric cells.** `sum`/`avg`/`min`/`max` work on both table- and records-format datasets, coercing numeric strings; cells that aren't numeric are ignored, and a column with no numeric values at all yields `undefined` (renders as empty text).
- **`count` works everywhere** — it just reads `data.length` for any format.
- **Failed expressions render as empty strings**, with a `Failed to evaluate template expression` console warning. If a card renders blank, check the console.
- **`row` is only meaningful inside row-detail modals.** In a regular page card, `row.x` is `undefined` and renders empty — no error.
- **`undefined` and `null` render as `""`**, so a missing dataset id or column silently produces empty output rather than "undefined".
- **Aggregated numbers are raw** — wrap them in `formatNumber`/`formatCurrency`/`formatPercent` for display; `formatPercent` expects a *fraction* (0–1), not a percentage.
- **Templates run before markdown conversion** when `contentType` is `"md"`, so template output can contain markdown syntax that will be rendered.
- **The engine is for cards** (page cards and modal cards). Other visuals' `title` props are plain strings.
- **Derived datasets are visible to templates** under their id, already filtered/aggregated — often easier than recomputing in an expression.

## Related

- [Modals](modals.md) — row-detail modals that supply the `row` variable
- [Filtering & Aggregation](filtering-and-aggregation.md) — precompute values as derived datasets instead of inline JS
- [Card](visuals/card.md) — the card visual reference (contentType, styling)
- [Formatting](formatting.md) — per-column display formats on tables/checklists
- Live example page: [../test-table-features.html](../test-table-features.html) (custom row-modal templates)
