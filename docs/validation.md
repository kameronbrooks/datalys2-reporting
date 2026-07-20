# Validation

Every time a report loads, the library walks the parsed config and checks it for common authoring mistakes — misspelled visual types, dataset ids that don't exist, column names that aren't in the referenced dataset, malformed filters, and more. Each finding is emitted as a `console.warn` message prefixed with `[datalys2]`, including a path that pinpoints where in the config tree the problem lives (for example `pages[0] ("Sales").rows[1].children[2] (id: "orders-table"): ...`).

Validation is **advisory only**: warnings never throw and never block rendering — the report always renders as best it can. Open your browser's developer console while authoring; a clean console is the fastest signal that a config is sound.

## Minimal example

This config renders, but produces two warnings — an unknown visual type and a bad column reference:

```json
{
    "pages": [
        {
            "title": "Demo",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        { "type": "tabel", "datasetId": "sales" },
                        { "type": "pie", "datasetId": "sales", "categoryColumn": "Region", "valueColumn": "amount" }
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
            "data": [{ "region": "West", "amount": 620.5 }]
        }
    }
}
```

Console output (abbreviated):

```
[datalys2] pages[0] ("Demo").rows[0].children[0]: unknown visual type "tabel". Known types: card, pie, stackedBar, ...
[datalys2] pages[0] ("Demo").rows[0].children[1]: categoryColumn "Region" is not a column of dataset "sales" (columns: region, amount).
```

## Opting out

To silence load-time validation entirely (for example on a very large, already-verified production report), add this to the HTML head:

```html
<meta name="dl2-validate" content="false">
```

Runtime warnings (unknown filter op during evaluation, failed navigation, modal not found, derived-dataset resolution problems) are not affected by this switch — only the load-time config walk is.

## Everything the validator checks

### Report structure

| Check | Warning |
|-------|---------|
| Config missing or not an object | `Report data is empty or not an object.` |
| No pages | `Report has no pages.` |
| A page has no `rows` | `pages[N] ("Title"): page has no rows.` |
| Validator crash (never breaks the app) | `Config validation failed unexpectedly: ...` |

### Datasets (derived)

| Check | Warning |
|-------|---------|
| `source` id does not exist | `Dataset "<id>": source dataset "<source>" not found.` |
| Derived `filter` / `aggregate` problems | Same filter/aggregate checks as below, validated against the **source** dataset's columns. |

Separately, at resolution time (not part of the opt-out): circular `source` chains warn `Derived dataset "<id>" is part of a circular "source" chain — left unresolved.`, and unresolvable sources warn `Derived dataset "<id>": source dataset "<source>" could not be resolved.`

### Elements (pages, nested layouts, tabs contents, and modal rows alike)

| Check | Warning |
|-------|---------|
| Element is not an object | `...: element is not an object.` |
| Layout with no `children` | `...: layout has no children.` |
| Unknown layout `direction` | `...: unknown layout direction "<dir>" (expected row, column, or grid).` |
| Modal trigger references an undefined modal (and has no inline `rows`) | `...: modal trigger references modal "<id>" which is not defined in "modals".` |
| Visual with no `type` | `...: element has no "type". Add e.g. "type": "table".` |
| Unknown visual type | `...: unknown visual type "<type>". Known types: ...` |
| Missing `datasetId` (except dataset-free types: `card`, `tabs`, `tabgroup`, `link`) | `...: visual "<type>" is missing "datasetId".` |
| `datasetId` not found | `...: datasetId "<id>" not found. Available datasets: ...` |
| Duplicate visual `id`s anywhere in the report | `Visual id "<id>" is used N times — ids must be unique for links and view-state persistence to work correctly.` |

### Filters (per-visual `filter`, derived-dataset `filter`, and `conditionalFormats` `when`)

| Check | Warning |
|-------|---------|
| Filter is not an object | `...: filter must be an object.` |
| `and` / `or` is not an array | `...: filter "and" must be an array.` |
| Condition missing `column` | `...: filter condition is missing "column".` |
| Column not in the dataset | `...: filter references column "<col>" which is not in dataset "<id>" (columns: ...).` |
| Condition missing `op` | `...: filter condition is missing "op". Valid ops: eq, neq, gt, gte, lt, lte, in, nin, contains, startsWith, endsWith, between, isNull, notNull.` |
| Unknown `op` | `...: unknown filter op "<op>". Valid ops: ...` |

### Aggregates (per-visual and derived-dataset `aggregate`)

| Check | Warning |
|-------|---------|
| Aggregate is not an object | `...: aggregate must be an object.` |
| Missing or empty `groupBy` | `...: aggregate is missing a non-empty "groupBy" array.` |
| `groupBy` column not in the dataset | `...: aggregate groupBy column "<col>" is not in dataset "<id>".` |
| Missing `aggregates` array | `...: aggregate is missing an "aggregates" array.` |
| Unknown `fn` | `...aggregates[N]: unknown aggregate fn "<fn>". Valid fns: sum, avg, min, max, count, countDistinct, first, last.` |
| Aggregate `column` not in the dataset (skipped for `fn: "count"`) | `...aggregates[N]: column "<col>" is not in dataset "<id>".` |

### Column references on visuals

Skipped when the visual declares an `aggregate` (the effective columns are the aggregate's renamed outputs, which the validator cannot see).

| Check | Warning |
|-------|---------|
| Single-column props not in the dataset: `xColumn`, `yColumn`, `valueColumn`, `labelColumn`, `categoryColumn`, `groupBy`, `statusColumn`, `warningColumn` | `...: <prop> "<col>" is not a column of dataset "<id>" (columns: ...).` |
| Column-list props with a bad entry: `yColumns`, `columns`, `hiddenColumns`, `rowModalColumns` | `...: <prop> entry "<col>" is not a column of dataset "<id>".` |

### Modals and links

| Check | Warning |
|-------|---------|
| `rowModalId` not defined in `modals` | `...: rowModalId "<id>" is not defined in "modals".` |
| Link visual with neither `targetId` nor `href` | `...: link visual needs a "targetId" (visual id) or "href" (external URL).` |
| Link `targetId` matches no visual id | `...: link targetId "<id>" does not match any visual id in the report.` |
| Modal `rows` contents | Validated with all of the element checks above, under a `modals[N] ("Title")` path. |

### Column formats (`columnFormats`)

| Check | Warning |
|-------|---------|
| Not an object | `...: columnFormats must be an object keyed by column name.` |
| Key is not a dataset column | `...: columnFormats key "<col>" is not a column of dataset "<id>" (columns: ...).` |
| Unknown format kind | `...: columnFormats["<col>"] has unknown format "<kind>". Valid formats: number, currency, percent, date, hms.` |

### Conditional formats (`conditionalFormats`)

| Check | Warning |
|-------|---------|
| Not an array | `...: conditionalFormats must be an array of rules.` |
| Rule is not an object | `...conditionalFormats[N]: rule must be an object.` |
| Missing `when` | `...conditionalFormats[N]: rule is missing "when" (a filter expression).` |
| Malformed `when` | Standard filter checks, under `...conditionalFormats[N].when`. |
| Unknown `target` | `...conditionalFormats[N]: unknown target "<t>" (expected "cell" or "row").` |
| Neither `style` nor `css` set | `...conditionalFormats[N]: rule has no effect — set "style" (success, warning, error, info, muted) and/or "css".` |
| Unknown `style` preset | `...conditionalFormats[N]: unknown style preset "<s>". Valid presets: success, warning, error, info, muted.` |
| Cell-target rule with a compound `when` and no `columns` | `...conditionalFormats[N]: cell-target rule with a compound "when" needs an explicit "columns" array.` |
| `columns` entry not a dataset column | `...conditionalFormats[N]: columns entry "<col>" is not a column of dataset "<id>".` |

### Tabs containers (`tabs` / `tabgroup`)

| Check | Warning |
|-------|---------|
| Missing or empty `tabs` array | `...: tabs visual is missing a non-empty "tabs" array.` |
| A tab is not an object | `...tabs[N]: tab must be an object with a "title" and "children" or "layout".` |
| A tab has neither `children` nor `layout` | `...tabs[N] ("Title"): tab has no "children" or "layout".` |
| Tab contents | Each tab's `children`/`layout` recurses through all element checks above. |

## Common warnings and how to fix them

| Warning (abbreviated) | Likely cause | Fix |
|-----------------------|--------------|-----|
| `unknown visual type "tabel"` | Typo in `type` | Use one of the listed known types (`table`, `pie`, `kpi`, ...). |
| `visual "table" is missing "datasetId"` | Forgot the dataset reference | Add `"datasetId": "<key from datasets>"`. Only `card`, `tabs`/`tabgroup`, and `link` are dataset-free. |
| `datasetId "Sales" not found` | Key mismatch (case-sensitive) | Match the exact key in the `datasets` object. |
| `xColumn "Region" is not a column of dataset "sales"` | Column name typo or wrong case | Use a name from the dataset's `columns` array (the warning lists them). |
| `unknown filter op "equals"` | Invented operator | Use `eq` (full list: `eq, neq, gt, gte, lt, lte, in, nin, contains, startsWith, endsWith, between, isNull, notNull`). |
| `aggregate is missing a non-empty "groupBy" array` | Empty or absent `groupBy` | Provide at least one group column, e.g. `"groupBy": ["region"]`. |
| `unknown aggregate fn "average"` | Wrong function name | Use `avg` (full list: `sum, avg, min, max, count, countDistinct, first, last`). |
| `layout has no children` | Empty `children` array | Add child elements, or remove the layout. |
| `page has no rows` | Empty page | Add `rows`, or remove the page. |
| `tabs visual is missing a non-empty "tabs" array` | Empty tabs container | Add `{ "title", "children" }` entries to `tabs`. |
| `tab has no "children" or "layout"` | Tab entry only has a title | Give each tab `children` (array) or a `layout` object. |
| `Visual id "kpi-1" is used 2 times` | Copy-pasted visuals kept the same `id` | Make every visual id unique — links and saved view state depend on it. |
| `rowModalId "order-modal" is not defined in "modals"` | Modal id mismatch | Add a modal with that `id` to the top-level `modals` array, or fix the reference. |
| `link targetId "orders-tbl" does not match any visual id` | Broken in-report link | Point `targetId` at an existing visual `id`, or add that id to the target visual. |
| `columnFormats key "Amount" is not a column of dataset "orders"` | Formatting a column that doesn't exist | Key `columnFormats` by exact column names. |
| `columnFormats["amount"] has unknown format "money"` | Invalid format kind | Use one of `number, currency, percent, date, hms`. |
| `cell-target rule with a compound "when" needs an explicit "columns" array` | `and`/`or`/`not` rule with no target columns | Add `"columns": ["colA", "colB"]` to the rule, or set `"target": "row"`. |
| `rule has no effect — set "style" ... and/or "css"` | Conditional rule without styling | Add a `style` preset (`success, warning, error, info, muted`) or a `css` object. |
| `Dataset "westSales": source dataset "sale" not found` | Derived dataset typo | Point `source` at an existing dataset key. |
| `Derived dataset "a" is part of a circular "source" chain` | `a` → `b` → `a` | Break the cycle; derivation must be a DAG. |
| `statusColumn "Done" is not a column of dataset "tasks"` | Checklist status column typo | Match the dataset's column name exactly. |

## Tips & gotchas

- **Warnings never block rendering** — a report with fifty warnings still renders. But visuals pointed at missing datasets or columns will be empty or partly broken, so treat warnings as a to-do list.
- **Every message is prefixed `[datalys2]`** — filter your console on that string to see only report diagnostics.
- **Paths name the element** — when a visual has an `id`, it appears in the path (`... (id: "orders-table")`), so giving visuals ids makes warnings much easier to trace.
- **Column checks are skipped on aggregated visuals.** With an `aggregate` present, the visual's effective columns are the aggregate outputs, which the validator does not model — double-check those column names yourself.
- **The validator validates modal contents too**, so a broken table inside a rarely-opened modal still surfaces at load time.
- **New filter ops or aggregate fns you invent will warn** at load *and* silently match nothing / return `null` at runtime — the two lists in the warnings are the complete grammar.
- **Opting out silences load-time checks only.** Runtime issues (failed navigation, unknown modal on open, unsupported dataset format for filtering) still warn, by design.
- **The validator itself is crash-proof** — if it ever hits an unexpected error it logs one warning and gets out of the way.

## Related

- [Filtering & Aggregation](filtering-and-aggregation.md) — the grammar behind the filter/aggregate checks
- [Formatting](formatting.md) — `columnFormats` and `conditionalFormats` in depth
- [Links & Navigation](links-and-navigation.md) — link targets and unique ids
- [Persistent View State](persistent-view-state.md) — why duplicate ids matter
- [Getting Started](getting-started.md) — the HTML skeleton the meta tag goes into
