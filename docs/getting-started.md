# Getting Started

Datalys2 Reporting renders a complete interactive report — pages, charts, tables, KPIs, modals — from a single JSON configuration embedded in an ordinary HTML file. You author (or generate) one self-contained `.html` file: it links the library stylesheet, declares a mount point, embeds the report configuration in a `<script id="report-data">` tag, and loads the library bundle. Opening the file in a browser renders the report; no server-side code is required.

This page covers the HTML skeleton, the `<meta>` tags the library reads, the compressed configuration alternative, and a quick orientation of the configuration's top-level shape. The details of each part live in the other docs — see [Related](#related) at the bottom.

## Minimal example

A complete, working report file with one dataset and two visuals (a KPI and a table). Save it next to `dl2-style.css` and `datalys2-reports.min.js` and open it in a browser:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Quarterly Sales Report</title>
    <meta name="description" content="Sales performance for Q2">
    <meta name="author" content="Jane Analyst">
    <meta name="last-updated" content="2026-07-20">
    <meta name="report-id" content="quarterly-sales">

    <link rel="stylesheet" href="dl2-style.css">
</head>
<body>
    <div id="root"></div>

    <script id="report-data" type="application/json">
{
    "pages": [
        {
            "title": "Overview",
            "description": "Headline numbers and the raw data.",
            "rows": [
                {
                    "direction": "row",
                    "children": [
                        {
                            "type": "kpi",
                            "datasetId": "sales",
                            "title": "Latest Sales",
                            "valueColumn": "amount",
                            "rowIndex": -1,
                            "format": "currency",
                            "border": true,
                            "flex": 0
                        },
                        {
                            "type": "table",
                            "datasetId": "sales",
                            "title": "All Sales",
                            "flex": 2
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
                { "region": "North", "amount": 12500 },
                { "region": "South", "amount": 9800 },
                { "region": "West", "amount": 14100 }
            ]
        }
    }
}
    </script>

    <script src="datalys2-reports.min.js"></script>
</body>
</html>
```

## The HTML skeleton

Every report file has four required parts:

| Part | Where | Description |
|------|-------|-------------|
| `<link rel="stylesheet" href=".../dl2-style.css">` | `<head>` | The library stylesheet (themes, layout, visual styling). |
| `<div id="root"></div>` | `<body>` | The mount point. The report renders inside this element. If it is missing, nothing renders at all. |
| `<script id="report-data" type="application/json">` | `<body>` | The report configuration JSON. Must have the exact id `report-data`. If it is missing, an empty report (headbar only) renders. |
| `<script src=".../datalys2-reports.min.js">` | End of `<body>` | The library bundle. It is self-contained (React and D3 are bundled). Place it after the `report-data` script and the `#root` div. |

While the configuration is being parsed and datasets decompressed you will briefly see "Loading report data...".

## Meta tags

The library reads the following tags from `<head>`:

| Tag / meta name | Type | Default | Description |
|-----------------|------|---------|-------------|
| `<title>` | string | `"Datalys2 Report"` | The report title, shown in the headbar (and the browser tab). |
| `description` | string | `""` | A report description. Read by the library but not currently displayed in the headbar; still useful for search engines and tooling. |
| `author` | string | `""` | Shown in the headbar as `Author: ...`. |
| `last-updated` | string | `""` | Shown in the headbar as `Last Updated: ...`. Free text — it is displayed verbatim, not parsed. |
| `report-id` | string | falls back to `<title>`, then the URL path | Stable namespace for [persistent view state](persistent-view-state.md) (saved sorting, hidden columns, active tabs). Set this if the report title changes between publishes so users keep their saved view. Truncated to 120 characters. |
| `gc-compressed-data` | `"true"` | off | Memory reclamation for large reports. When `"true"`, the library clears the `report-data` script's text after parsing, clears every script tag referenced by a dataset's `compressedData`, and deletes the `compressedData` property — letting the browser garbage-collect the large strings. See [Datasets](datasets.md). |
| `dl2-validate` | `"false"` | validation on | Set to `"false"` to disable [config validation](validation.md). By default the library checks the config on load and emits `[datalys2]` console warnings for common mistakes (unknown visual types, missing datasets, bad column names, duplicate visual ids, ...). Warnings never block rendering. |
| `dl-version` | string | — | Conventional documentation of the library version the report was authored against (e.g. `content="0.4.1"`). The runtime does not read this tag; it exists so future readers and tooling can tell which version a saved report targets. |

## Compressed report-data

For reports whose configuration itself is large, you can embed the whole configuration gzip-compressed and base64-encoded. Change the script's `type` to `text/b64-gzip`:

```html
<script id="report-data" type="text/b64-gzip">
H4sIAAAAAAAAA6tWKkktLlGyUlAqS8wpTtVRKi1OLUpV0lFQSixOVbICMqAMqFpbAJ2MupsmAAAA
</script>
```

The library detects the type and decompresses the content before parsing it as JSON. Decompression uses the browser's built-in `DecompressionStream` API (available in all modern browsers). To produce the string: serialize your config to JSON, gzip it, and base64-encode the result.

This is independent of per-dataset compression — individual datasets can also be stored compressed in their own script tags; see [Datasets](datasets.md#compressed-datasets).

## The configuration's top-level shape

The `report-data` JSON is a single object with three top-level keys:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `pages` | array | — | The report's pages, one tab per page. Each page has a `title` and `rows` of layouts containing visuals. See [Pages & Layouts](pages-and-layouts.md). |
| `datasets` | object | — | A dictionary of datasets keyed by id; visuals reference them by `datasetId`. Supports four data formats, gzip compression, and derived (filtered/aggregated) datasets. See [Datasets](datasets.md). |
| `modals` | array | omitted | Optional global modal definitions — overlay views with their own layouts, opened from visuals via `modalId`, trigger buttons, or table row modals. See [Modals](modals.md). |

Visuals live inside page rows; the full catalog is in [Visual Elements](visual-elements.md) with one page per visual under `visuals/` (for example [visuals/table.md](visuals/table.md) and [visuals/kpi.md](visuals/kpi.md)). Any visual can slice its dataset with `filter`/`aggregate` props ([Filtering & Aggregation](filtering-and-aggregation.md)), and cards support `{{ ... }}` expression templates ([Templates & Expressions](templates-and-expressions.md)).

## Examples

**A report with two pages**

Each entry in `pages` becomes a tab. This fragment is a complete `report-data` value:

```json
{
    "pages": [
        {
            "title": "Summary",
            "rows": [
                {
                    "direction": "row",
                    "children": [
                        { "type": "card", "title": "Welcome", "text": "Use the tabs above to switch pages." }
                    ]
                }
            ]
        },
        {
            "title": "Data",
            "rows": [
                {
                    "direction": "row",
                    "children": [
                        { "type": "table", "datasetId": "sales" }
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
                { "region": "North", "amount": 12500 },
                { "region": "South", "amount": 9800 }
            ]
        }
    }
}
```

**Full metadata head**

All supported meta tags together. `report-id` keeps saved view state stable across republishes even if the title changes:

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ops Dashboard - July 2026</title>
    <meta name="description" content="Daily operations metrics">
    <meta name="author" content="Ops Team">
    <meta name="last-updated" content="2026-07-20 06:00 UTC">
    <meta name="report-id" content="ops-dashboard">
    <meta name="gc-compressed-data" content="true">
    <meta name="dl-version" content="0.4.1">
    <link rel="stylesheet" href="dl2-style.css">
</head>
```

**Serving the assets from a CDN or local server**

The stylesheet and bundle can be absolute URLs; the report HTML itself can live anywhere:

```html
<link rel="stylesheet" href="https://cdn.example.com/datalys2/0.4.1/dl2-style.css">
<script src="https://cdn.example.com/datalys2/0.4.1/datalys2-reports.min.js"></script>
```

The repository's test pages use `http://localhost:8080/...` for both assets — if you open one and see only an empty page, the local asset server is not running.

**A report with a global modal**

Modals are defined at the top level and opened from any element via `modalId` (an expand icon appears on hover):

```json
{
    "pages": [
        {
            "title": "Overview",
            "rows": [
                {
                    "direction": "row",
                    "children": [
                        {
                            "type": "kpi",
                            "datasetId": "sales",
                            "title": "Latest Sales",
                            "valueColumn": "amount",
                            "rowIndex": -1,
                            "modalId": "sales-detail"
                        }
                    ]
                }
            ]
        }
    ],
    "modals": [
        {
            "id": "sales-detail",
            "title": "Sales Detail",
            "description": "The full dataset behind the KPI.",
            "rows": [
                {
                    "direction": "row",
                    "children": [
                        { "type": "table", "datasetId": "sales" }
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
                { "region": "North", "amount": 12500 },
                { "region": "South", "amount": 9800 }
            ]
        }
    }
}
```

**Deep-linking to a visual**

Give a visual an `id` and it becomes a navigation anchor. Opening `report.html#sales-table` switches to the right page, scrolls to the visual, and flashes it:

```json
{ "type": "table", "id": "sales-table", "datasetId": "sales", "title": "All Sales" }
```

See [Links & Navigation](links-and-navigation.md) for the `link` visual and in-report hash links.

**Opting out of validation**

If your config intentionally uses columns the validator cannot see (for example columns produced at runtime), you can silence the `[datalys2]` warnings:

```html
<meta name="dl2-validate" content="false">
```

Prefer leaving validation on while authoring — the warnings name the exact config path of each problem.

## Tips & gotchas

- The data script's id must be exactly `report-data`. Any other id is ignored and the report renders empty.
- Put the library `<script src>` after the `#root` div and the `report-data` script — the bundle mounts immediately on load.
- The JSON inside `report-data` must be strictly valid JSON (no comments, no trailing commas). A parse error stops the report from loading — check the browser console.
- The dataset dictionary key is the id visuals reference; the inner `id` property may be omitted (it is auto-filled from the key). See [Datasets](datasets.md).
- Card `title`/`text` templates (`{{ ... }}`) evaluate JavaScript expressions in the viewer's browser. Only embed configurations you trust. See [Templates & Expressions](templates-and-expressions.md).
- `last-updated` is displayed verbatim in the headbar; the per-page `lastUpdated` property is separate and shown on each page.
- With `gc-compressed-data` enabled, the raw config is no longer inspectable from the DOM after load (the script tags are emptied). Turn it off while debugging.
- A "Reset view" button appears at the right of the headbar whenever the report has saved view customizations; it clears them and reloads. See [Persistent View State](persistent-view-state.md).

## Related

- [Datasets](datasets.md) — formats, dtypes, compression, derived datasets
- [Pages & Layouts](pages-and-layouts.md) — pages, rows, grids, nesting, common element properties
- [Visual Elements](visual-elements.md) — the visual catalog (details under `visuals/`, e.g. [visuals/table.md](visuals/table.md), [visuals/card.md](visuals/card.md))
- [Filtering & Aggregation](filtering-and-aggregation.md) — the filter grammar and aggregate specs
- [Modals](modals.md), [Links & Navigation](links-and-navigation.md), [Persistent View State](persistent-view-state.md), [Validation](validation.md)
- Working test pages: [../test.html](../test.html), [../test-layouts.html](../test-layouts.html), [../test-all-visuals.html](../test-all-visuals.html)
