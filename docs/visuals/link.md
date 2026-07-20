# Link (`type: "link"`)

A link visual renders a clickable link (or button) that either navigates to another visual **inside the report** by its `id`, or opens an **external URL** in a new tab. It is dataset-free — no `datasetId` needed — and sizes to its content (`flex: 0` by default), so it slots neatly into rows next to other visuals.

Internal navigation does the full journey for you: it switches to the page containing the target, activates any tab (including nested tab groups) that contains it, scrolls the target into view, and briefly flashes it so the reader's eye lands in the right place. See [../links-and-navigation.md](../links-and-navigation.md) for the whole navigation system, including `#hash` links and deep links.

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
                        { "type": "link", "targetId": "orders-table", "label": "Jump to the orders table" },
                        { "type": "table", "id": "orders-table", "datasetId": "orders" }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "orders": {
            "id": "orders",
            "columns": ["Order", "Amount"],
            "dtypes": ["str", "float"],
            "format": "records",
            "data": [
                { "Order": "A-1001", "Amount": 250.0 },
                { "Order": "A-1002", "Amount": 90.5 }
            ]
        }
    }
}
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `targetId` | `string` | — | The `id` of the visual to navigate to. One of `targetId` or `href` is required. |
| `href` | `string` | — | External URL alternative — opens in a new browser tab (`rel="noopener noreferrer"`). |
| `label` | `string` | — | The link text. |
| `text` | `string` | — | Fallback for `label`. If neither is set, the `targetId` (or `href`) is shown as the text. |
| `linkStyle` | `'link'` \| `'button'` | `'link'` | Render as an inline text link or as a button. |
| `padding` | `number` | `0` | Inner padding in pixels. |
| `margin` | `number` | `0` | Outer margin in pixels. |
| `flex` | `number` | `0` | Flex sizing. Defaults to `0` (natural size, vertically centered in the row), unlike most visuals which default to `1`. |

## What clicking does

For a `targetId` link:

1. The report switches to the page that contains the target visual.
2. Every tab group on the path to the target activates the tab containing it — nested tab groups included.
3. The page scrolls smoothly until the target is centered.
4. The target flashes with a highlight for about two seconds.

The scroll retries for a short period while pages and tabs mount, so targets inside not-yet-rendered containers still work. If no element with the id is ever found, a `[datalys2]` warning is logged to the console. The target can be any visual with an `id` — tables, charts, cards, KPIs, even a whole tab group.

For an `href` link, the URL simply opens in a new tab; no in-report navigation happens.

## Examples

**Jump link to a visual on another page**

The target lives on a different page inside a tab — the link switches page, activates the tab, scrolls, and flashes.

```json
{ "type": "link", "targetId": "low-scores-table", "label": "See the low scores table" }
```

**Button-styled link**

`linkStyle: "button"` renders the same navigation as a button, useful for prominent calls to action at the top of a page.

```json
{
    "type": "layout",
    "direction": "row",
    "title": "Quick navigation",
    "children": [
        { "type": "link", "targetId": "low-scores-table", "label": "Low scores", "linkStyle": "button" },
        { "type": "link", "targetId": "score-trend-chart", "label": "Score trend", "linkStyle": "button" }
    ]
}
```

**External link**

With `href` instead of `targetId`, the link opens the URL in a new browser tab.

```json
{ "type": "link", "href": "https://example.com/wiki/methodology", "label": "Methodology (wiki)", "linkStyle": "button" }
```

**Link visuals vs. links inside cards**

Both navigate identically. Use a link **visual** when the link should stand alone in a layout; use a markdown/HTML **card** with `#<visual-id>` hash links when the link belongs inside prose. See [card.md](card.md).

```json
{
    "type": "layout",
    "direction": "row",
    "children": [
        { "type": "link", "targetId": "region-table", "label": "Regional breakdown", "flex": 0 },
        {
            "type": "card",
            "contentType": "md",
            "text": "For context, compare the [regional breakdown](#region-table) with the [monthly trend](#trend-chart).",
            "flex": 1
        }
    ]
}
```

**Back-to-top style cross links**

Give two visuals ids and let each link to the other — handy on long pages.

```json
{
    "type": "layout",
    "direction": "column",
    "children": [
        { "type": "card", "id": "summary-card", "title": "Summary", "text": "Totals for the quarter." },
        { "type": "link", "targetId": "detail-table", "label": "Down to the detail table" },
        { "type": "table", "id": "detail-table", "datasetId": "orders" },
        { "type": "link", "targetId": "summary-card", "label": "Back to the summary" }
    ]
}
```

## Tips & gotchas

- A link with neither `targetId` nor `href` renders an inline error message. If both are set, `targetId` wins and `href` is ignored — pick one per link.
- The validator checks every `targetId` at load and warns (`[datalys2]` console prefix) when it doesn't match any visual id in the report — a fast way to catch typos. See [../validation.md](../validation.md).
- The label falls back through `label` → `text` → `targetId` → `href`, so an unlabeled link shows its raw target — set a `label` for readable reports.
- Targets must have an `id` on the **visual** itself. Layout containers and pages are not link targets; give an id to a visual inside them instead.
- Deep links work from outside the report too: opening `report.html#orders-table` navigates to that visual on load. See [../links-and-navigation.md](../links-and-navigation.md).
- Because `flex` defaults to `0`, a link in a `row` sits at its natural width, vertically centered. Set `flex: 1` if you want it to occupy a full row slot.
- External links always open in a new tab; there is no same-tab option.

## Related

- [../links-and-navigation.md](../links-and-navigation.md) — hash links, deep links, and navigation behavior
- [../validation.md](../validation.md) — load-time warnings, including unknown `targetId`s
- [tabs.md](tabs.md) — how tab groups auto-activate when a link targets content inside them
- [card.md](card.md) — embedding hash links in markdown/HTML prose
- Live example: [../../test-tabs.html](../../test-tabs.html) (link row targeting visuals across pages and tabs)
