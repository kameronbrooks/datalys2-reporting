# Card (`type: "card"`)

A card displays a block of text content — static prose, HTML, or lightweight markdown — with an optional title. Cards are the workhorse for narrative sections, section intros, computed summaries, and in-report navigation text.

Cards do **not** require a `datasetId`. They render without one, but they can still read every dataset in the report through template placeholders, which makes them ideal for computed summary text ("Total revenue: $1.2M across 340 orders").

## Minimal example

```json
{
    "type": "card",
    "title": "Welcome",
    "text": "This report covers Q2 performance. Use the pages above to navigate."
}
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `text` | `string` or template object | **required** | The card body. Supports `{{ ... }}` placeholders and the object forms described below. |
| `title` | `string` or template object | — | Optional heading rendered above the body. Also supports templates. |
| `contentType` | `"text"` \| `"html"` \| `"md"` | `"text"` | How the (already template-rendered) text is displayed: plain text, raw HTML, or markdown converted to HTML. |
| `id` | `string` | — | Optional unique id. Gives the card a navigation anchor so links can jump to it. See [../links-and-navigation.md](../links-and-navigation.md). |
| `padding` | `number` | `10` | Inner padding in pixels. |
| `margin` | `number` | `0` | Outer margin in pixels. |
| `border` | `boolean` | `false` | Draws the standard 1px border when `true`. |
| `shadow` | `boolean` | `false` | Draws the standard drop shadow when `true`. |
| `flex` | `number` | `1` | Flex sizing within the parent row. `0` keeps natural size. |
| `modalId` | `string` | — | Opens the referenced modal from an expand icon on hover. See [../modals.md](../modals.md). |

## Templates in `title` and `text`

Both `title` and `text` are template values. Anywhere in the string you can embed `{{ ... }}` placeholders; the content of each placeholder is evaluated as a **JavaScript expression** with these variables in scope:

- `datasets` — the full datasets object from `report-data` (e.g. `datasets.sales.data[0][1]`)
- `props` — reserved, currently `{}`
- `row` — the clicked data row, when the card is rendered inside a row-detail modal (e.g. `{{ row.Region }}`)
- `helpers` — helper functions, also available directly: `count(datasetId)`, `sum(datasetId, column)`, `avg(datasetId, column)`, `min(datasetId, column)`, `max(datasetId, column)`, `formatNumber(value, digits)`, `formatPercent(value, digits)`, `formatCurrency(value, symbol, digits)`

Instead of a string, `title`/`text` also accept an object form:

| Form | Meaning |
|------|---------|
| `{ "expr": "..." }` | The whole value is a single JavaScript expression; its result becomes the text. |
| `{ "template": "..." }` | Same as passing a plain string with `{{ ... }}` placeholders. |
| `{ "unsafeJs": "..." }` | Alias for `expr` (same behavior, name makes the risk explicit). |

See [../templates-and-expressions.md](../templates-and-expressions.md) for the full engine reference.

**Security caveat:** placeholder and `expr` content executes as arbitrary JavaScript in the viewer's browser. Because the config is embedded in the HTML file itself, this is equivalent to any other script on the page — but it means you must only embed report configs from trusted sources. A failing expression logs a console warning and renders as an empty string.

## Markdown support (`contentType: "md"`)

The built-in markdown converter is intentionally small. Supported:

- Headings: `# H1`, `## H2`, `### H3` (at line start)
- Bold: `**text**` or `__text__`
- Italic: `*text*` or `_text_`
- Links: `[label](url)` — including in-report hash links like `[details](#orders-table)`
- Line breaks: every newline becomes a `<br>`

Not supported: bullet/numbered lists, code blocks, images, tables, blockquotes. A line starting with `- ` renders as a literal hyphen line (which still reads fine as a simple list, but produces no `<ul>` markup). If you need real lists or richer structure, use `contentType: "html"` and write the HTML yourself.

## Examples

**Static text card**

The default `contentType` is `"text"`: content renders as a plain paragraph, with no HTML interpretation.

```json
{
    "type": "card",
    "title": "About this report",
    "text": "Data is refreshed nightly at 02:00 UTC. Figures for the current month are provisional.",
    "border": true,
    "shadow": true
}
```

**Markdown card with headings and links**

```json
{
    "type": "card",
    "title": "Reading guide",
    "contentType": "md",
    "text": "## How to read this page\nEach chart shows **month-over-month** movement.\nKey sections:\n- [Revenue trend](#revenue-trend)\n- [Regional breakdown](#region-table)\nFull methodology is on the [team wiki](https://example.com/wiki/methodology).",
    "border": true
}
```

**Computed summary card using helpers**

A complete config showing a card that aggregates a table-format dataset. The card needs no `datasetId` — helpers name the dataset directly.

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
                            "title": "Sales summary",
                            "text": "Orders: {{count('sales')}}. Total revenue: {{formatCurrency(sum('sales', 'Amount'), '$', 0)}}. Average order: {{formatCurrency(avg('sales', 'Amount'))}}. Best day: {{formatCurrency(max('sales', 'Amount'))}}.",
                            "border": true
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "sales": {
            "id": "sales",
            "columns": ["Day", "Amount"],
            "dtypes": ["str", "float"],
            "format": "table",
            "data": [
                ["Mon", 1200.5],
                ["Tue", 980.0],
                ["Wed", 1610.25],
                ["Thu", 1425.75]
            ]
        }
    }
}
```

**Whole-value expression (`expr` object form)**

When the entire title or body is one computed value, skip the placeholder syntax and pass an expression object.

```json
{
    "type": "card",
    "title": { "expr": "'Rows loaded: ' + count('sales')" },
    "text": { "expr": "sum('sales', 'Amount') > 5000 ? 'Target met.' : 'Below target — see the regional table.'" }
}
```

**Raw dataset access in a placeholder**

Placeholders are plain JavaScript, so you can index into `datasets` directly. For a table-format dataset, `data[rowIndex][columnIndex]`:

```json
{
    "type": "card",
    "text": "First recorded day: {{datasets.sales.data[0][0]}} with {{formatCurrency(datasets.sales.data[0][1])}} in sales."
}
```

**Hash-link navigation card**

A markdown card whose links jump to other visuals by `id` — the target page and tab are activated automatically. See [../links-and-navigation.md](../links-and-navigation.md).

```json
{
    "type": "card",
    "contentType": "md",
    "text": "Jump straight to the [low scores table](#low-scores-table) or the [score trend chart](#score-trend-chart).",
    "flex": 1
}
```

**HTML card**

For full control (real lists, custom markup), use `contentType: "html"`.

```json
{
    "type": "card",
    "title": "Checklist",
    "contentType": "html",
    "text": "<p>Before publishing:</p><ul><li>Verify dataset freshness</li><li>Check <strong>breach</strong> KPIs</li><li>Review the <a href='#region-table'>regional table</a></li></ul>",
    "border": true
}
```

## Tips & gotchas

- The aggregation helpers (`sum`, `avg`, `min`, `max`) work on both `table`- and `records`-format datasets, skipping non-numeric cells; a column with no numeric values yields `undefined` (rendered as an empty string). For anything beyond simple aggregates, index the rows directly in the expression, e.g. `{{datasets.metrics.data.reduce(function(a, r) { return a + r.score; }, 0)}}`.
- `count(datasetId)` works for any format (it is just the row count).
- Placeholder failures are silent to viewers: the expression logs a `console.warn` and renders as `""`. Check the browser console if a card shows a gap where a number should be.
- Templates are rendered **before** the markdown/HTML conversion, so a placeholder can emit markdown or HTML that then gets processed.
- Inside a row-detail modal, cards can reference the clicked row with `{{ row.ColumnName }}` — see [../modals.md](../modals.md).
- `description` is accepted on cards (it is a common visual property) but is not currently displayed.
- With `contentType: "html"` the string is injected as-is (`dangerouslySetInnerHTML`); combined with templates this is the arbitrary-code surface mentioned above — only render trusted configs.
- A newline in `"md"` content always becomes a line break; there is no paragraph merging, so keep source lines as you want them displayed.

## Related

- [../templates-and-expressions.md](../templates-and-expressions.md) — full template engine reference
- [../links-and-navigation.md](../links-and-navigation.md) — hash links and the [link](link.md) visual
- [../modals.md](../modals.md) — cards inside row-detail modals (`row` context)
- [kpi.md](kpi.md) — single-number summaries with trend and thresholds
- Live examples: [../../test.html](../../test.html) (card content types), [../../test-tabs.html](../../test-tabs.html) (hash-link card)
