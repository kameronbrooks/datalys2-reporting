# Links & Navigation

Every visual that has an `id` is a navigation anchor. From anywhere in the report you can jump to it — the library switches to the page that contains it, activates the right tab in any tab group along the way (nested tab groups included), scrolls the visual into view, and flashes a brief highlight so the reader's eye lands on it.

There are three ways to trigger navigation: the **link visual** (`type: "link"`), plain **hash links** (`#visual-id`) emitted anywhere — most usefully in markdown cards — and **deep links** in the page URL (`report.html#visual-id`), which navigate on load.

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
                        { "type": "link", "targetId": "orders-table", "label": "Jump to the orders table" }
                    ]
                }
            ]
        },
        {
            "title": "Detail",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        { "type": "table", "id": "orders-table", "datasetId": "orders", "title": "Orders" }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "orders": {
            "format": "records",
            "columns": ["region", "amount"],
            "dtypes": ["str", "float"],
            "data": [
                { "region": "West", "amount": 620.5 },
                { "region": "East", "amount": 310.0 }
            ]
        }
    }
}
```

## The link visual (overview)

The link visual is dataset-free and renders as an inline link or a button. Full details live in [visuals/link.md](visuals/link.md).

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `targetId` | `string` | — | The `id` of the visual to navigate to (in-report navigation). |
| `href` | `string` | — | External URL alternative — opens in a new browser tab. Used when `targetId` is absent. |
| `label` | `string` | `text`, then target/href | The link text. |
| `text` | `string` | — | Fallback for `label`. |
| `linkStyle` | `string` | `"link"` | `"link"` (inline) or `"button"`. |

A link with neither `targetId` nor `href` renders an inline error message, and the validator warns at load time.

## Hash links

Anywhere you can emit an anchor whose `href` is `#<visual-id>`, clicking it navigates — including across pages. The most common place is a markdown card:

```json
{ "type": "card", "contentType": "md", "text": "See the [orders table](#orders-table) for details." }
```

This also means `contentType: "html"` cards, or any other markup that produces `<a href="#...">`, participate in navigation for free.

## Deep links

Opening the report file with a hash — `report.html#orders-table` — navigates to that visual shortly after load (the initial navigation is delayed about 100 ms so the report can mount). Changing the hash while the report is open (the browser's `hashchange` event) navigates too, so the address bar can drive the report.

## What a navigation does

1. Closes any open modal.
2. Switches to the page containing the target `id` (searching pages, layouts, and tab contents recursively).
3. Notifies tab groups: every `tabs` container on the path — nested ones included — activates the tab whose contents contain the target. Tab groups that mount late (for example, nested tabs revealed by the outer switch) pick up the pending target when they appear.
4. Scrolls the target element into view (smooth, centered), retrying for up to about two seconds (20 attempts, 100 ms apart) while pages and tabs mount.
5. Applies a flash highlight to the element for two seconds.

If no element with the target id exists after the retries, the console shows `[datalys2] Could not navigate to "<id>" — no element with that id was found.` The load-time validator also checks every link visual's `targetId` against the report's visual ids, so most broken links are reported before anyone clicks them.

## Examples

**Button-styled link across pages and into a tab.** The target table lives on another page, inside the third tab of a tab group — one click activates all of it:

```json
{
    "type": "layout",
    "direction": "row",
    "children": [
        {
            "type": "link",
            "targetId": "low-scores-table",
            "label": "Jump to the Low scores table",
            "linkStyle": "button"
        }
    ]
}
```

```json
{
    "type": "tabs",
    "title": "Scores by band",
    "tabs": [
        { "title": "All", "children": [ { "type": "table", "datasetId": "metrics" } ] },
        {
            "title": "Low (< 75)",
            "children": [
                {
                    "type": "table",
                    "id": "low-scores-table",
                    "datasetId": "metrics",
                    "filter": { "column": "score", "op": "lt", "value": 75 }
                }
            ]
        }
    ]
}
```

**Inline link beside content.** `flex: 0` keeps the link at its natural size inside a row:

```json
{
    "type": "layout",
    "direction": "row",
    "children": [
        { "type": "link", "targetId": "score-trend-chart", "label": "Jump to the score trend chart", "flex": 0 },
        { "type": "card", "text": "The trend chart lives in the Trend tab of this page." }
    ]
}
```

**External link.** With `href` and no `targetId`, the link opens a new browser tab:

```json
{ "type": "link", "href": "https://example.com/methodology", "label": "Methodology (external)", "linkStyle": "button" }
```

**Markdown card mixing hash links and formatting:**

```json
{
    "type": "card",
    "contentType": "md",
    "text": "## Where to look\n**Trends:** see the [score trend chart](#score-trend-chart).\n**Raw data:** the [orders table](#orders-table) has every row.\nMarkdown hash links work too: [go to the nested tabs](#nested-tabs-inner)."
}
```

**Navigating to a visual inside nested tab groups.** The target is a tab group nested inside another tab group; navigation activates both levels:

```json
{
    "type": "tabs",
    "tabs": [
        {
            "title": "Outer 1",
            "children": [
                {
                    "type": "tabs",
                    "id": "nested-tabs-inner",
                    "tabs": [
                        { "title": "Nested 1", "children": [ { "type": "card", "text": "Deeply nested content 1" } ] },
                        { "title": "Nested 2", "children": [ { "type": "card", "text": "Deeply nested content 2" } ] }
                    ]
                }
            ]
        },
        { "title": "Outer 2", "children": [ { "type": "card", "text": "Outer tab 2 content" } ] }
    ]
}
```

**A table of contents page.** A column of button links as the report's first page:

```json
{
    "title": "Contents",
    "rows": [
        {
            "type": "layout",
            "direction": "column",
            "children": [
                { "type": "link", "targetId": "kpi-summary", "label": "1. KPI summary", "linkStyle": "button" },
                { "type": "link", "targetId": "orders-table", "label": "2. Orders detail", "linkStyle": "button" },
                { "type": "link", "targetId": "score-trend-chart", "label": "3. Score trends", "linkStyle": "button" }
            ]
        }
    ]
}
```

## Tips & gotchas

- **Ids must be unique.** Duplicate visual ids break anchors (the first match wins in the DOM) and view-state persistence; the validator warns: `Visual id "<id>" is used N times ...`.
- **Anchors come from visual `id`s** — layouts and modal triggers are not anchors. Give the visual itself the id, not its surrounding layout.
- **Unknown targets warn twice**: at load (`link targetId "<id>" does not match any visual id in the report`) for link visuals, and at click time after the retry window for any navigation (including hash links, which the validator cannot see inside markdown).
- **Share deep links** — `report.html#some-visual` is a stable way to point a colleague at one specific chart, as long as the id stays stable across report publishes.
- **Navigation closes open modals** before switching pages; you cannot deep-link into a modal.
- **The flash highlight re-triggers** when navigating to the same target again, so repeated clicks still give feedback.
- **Tab activation is content-based**: a tab is activated when the target id appears anywhere in that tab's `children` or `layout` tree, so links can target visuals arbitrarily deep inside tabs.

## Related

- [Link visual reference](visuals/link.md) — full prop details and styling
- [Tabs](visuals/tabs.md) — tab groups, nesting, and the active-tab behavior
- [Persistent View State](persistent-view-state.md) — ids also key saved view state
- [Validation](validation.md) — link and duplicate-id warnings
- Live example page: [../test-tabs.html](../test-tabs.html)
