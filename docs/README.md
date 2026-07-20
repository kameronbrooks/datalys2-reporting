# Datalys2 Reporting — Documentation

Datalys2 Reporting renders interactive, self-contained HTML reports from a JSON configuration embedded in the page. You write (or generate) a `report-data` JSON object describing pages, layouts, datasets, and visuals; the library turns it into a tabbed, filterable, exportable report — no server required.

This folder is the full reference, one file per feature area. Every property, default, and behavior documented here was verified against the library source code, and every JSON example is valid and copy-pasteable.

**New here? Start with [Getting Started](getting-started.md).**

## Foundations

| Doc | What it covers |
|-----|----------------|
| [Getting Started](getting-started.md) | The HTML skeleton, meta tags, the `report-data` script, a complete minimal report. |
| [Datasets](datasets.md) | The four data formats, `dtypes` and date parsing, gzip compression, derived datasets. |
| [Pages & Layouts](pages-and-layouts.md) | Pages, row/column/grid layouts, responsive grids, flex sizing, common element properties. |

## Data shaping

| Doc | What it covers |
|-----|----------------|
| [Filtering & Aggregation](filtering-and-aggregation.md) | The full filter grammar (`eq`…`notNull`, `and`/`or`/`not`), aggregate specs, per-visual filters, derived datasets. |
| [Templates & Expressions](templates-and-expressions.md) | `{{ ... }}` placeholders, `expr` values, helper functions, the `row` variable in row modals, security caveats. |
| [Formatting](formatting.md) | `columnFormats` (number/currency/percent/date/hms) and `conditionalFormats` (highlight rules) for tables and checklists. |

## Visuals

| Visual | `type` | Doc |
|--------|--------|-----|
| Card | `card` | [visuals/card.md](visuals/card.md) |
| KPI | `kpi` | [visuals/kpi.md](visuals/kpi.md) |
| Table | `table` | [visuals/table.md](visuals/table.md) |
| Checklist | `checklist` | [visuals/checklist.md](visuals/checklist.md) |
| Line chart | `line` | [visuals/line-chart.md](visuals/line-chart.md) |
| Area chart | `area` | [visuals/area-chart.md](visuals/area-chart.md) |
| Stacked / clustered bars | `stackedBar`, `clusteredBar` | [visuals/bar-charts.md](visuals/bar-charts.md) |
| Pie / donut | `pie` | [visuals/pie-chart.md](visuals/pie-chart.md) |
| Scatter plot | `scatter` | [visuals/scatter-plot.md](visuals/scatter-plot.md) |
| Histogram | `histogram` | [visuals/histogram.md](visuals/histogram.md) |
| Heatmap | `heatmap` | [visuals/heatmap.md](visuals/heatmap.md) |
| Box plot | `boxplot` | [visuals/box-plot.md](visuals/box-plot.md) |
| Gauge | `gauge` | [visuals/gauge.md](visuals/gauge.md) |
| Tabs (container) | `tabs`, `tabgroup` | [visuals/tabs.md](visuals/tabs.md) |
| Link | `link` | [visuals/link.md](visuals/link.md) |

## Chart add-ons

| Doc | What it covers |
|-----|----------------|
| [Thresholds](thresholds.md) | Pass/fail coloring for line, area, and clustered bar charts (`ThresholdConfig`). |
| [Visual Elements](visual-elements.md) | `otherElements` annotations: trend lines, reference axes, markers, labels — with a per-visual support matrix. |

## Report behavior

| Doc | What it covers |
|-----|----------------|
| [Modals](modals.md) | Global modals, hover-expand `modalId`, trigger buttons, table/checklist row detail modals. |
| [Links & Navigation](links-and-navigation.md) | Visual `id` anchors, hash links, deep links, cross-page and cross-tab navigation. |
| [Persistent View State](persistent-view-state.md) | What user view changes persist in `localStorage`, report namespacing, per-visual and report-wide reset. |
| [Validation](validation.md) | Every `[datalys2]` console warning the config validator emits, and how to fix each. |

## Live examples

The repo's root contains runnable test pages that double as working examples (serve the built assets on port 8080 first):

- [test.html](../test.html) — general kitchen sink
- [test-all-visuals.html](../test-all-visuals.html) — one of each visual
- [test-layouts.html](../test-layouts.html) — layout system
- [test-filters.html](../test-filters.html) — per-visual filters, aggregates, derived datasets
- [test-table-features.html](../test-table-features.html) — table UX, totals, formatting
- [test-checklist.html](../test-checklist.html) — checklist features
- [test-tabs.html](../test-tabs.html) — tab containers
- [test-gauge-ranges.html](../test-gauge-ranges.html) — gauge ranges
- [test-area-chart-threshold.html](../test-area-chart-threshold.html) — threshold coloring

> The legacy single-file reference at [DOCUMENTATION.md](../DOCUMENTATION.md) predates this folder; where the two disagree, this folder reflects the actual source behavior.
