# Datalys2 Reporting Documentation

This documentation guides you on how to create HTML reports using the Datalys2 Reporting library.

## HTML Structure

To create a report, you need a standard HTML file that includes the library's CSS, the library's JavaScript bundle, a root container, and a special script tag for the data.

You can also use standard HTML meta tags to configure the report header information.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Report Metadata -->
    <title>Your Report Title</title>
    <meta name="description" content="A brief description of this report">
    <meta name="author" content="Report Author Name">
    <meta name="last-updated" content="2024-01-01">

    <!-- Include the library styles -->
    <link rel="stylesheet" href="path/to/dl2-style.css">
</head>
<body>
    <!-- The root element where the app will mount -->
    <div id="root"></div>

    <!-- The configuration data for the report -->
    <script id="report-data" type="application/json">
    {
        "pages": [],
        "datasets": {}
    }
    </script>

    <!-- Include the library script -->
    <script src="path/to/datalys2-reporting.js"></script>
</body>
</html>
```

### Report Metadata

The application reads the following tags from the `<head>` to populate the report header:

| Tag / Name | Description |
|------------|-------------|
| `<title>` | Sets the main title of the report. |
| `description` | Sets the report description text. |
| `author` | Displays the author's name. |
| `last-updated` | Displays the last updated date/time. |

## The `report-data` Script

The core of the report configuration lives inside the `<script id="report-data" type="application/json">` tag. This JSON object must adhere to the `ApplicationData` structure.

### Root Object

| Property | Type | Description |
|----------|------|-------------|
| `pages` | `ReportPage[]` | An array of page definitions. |
| `datasets` | `Record<string, Dataset>` | A dictionary of datasets used by the visuals. |

### Datasets

Datasets are defined in the `datasets` object. The key is the `datasetId` referenced by visuals.

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | The unique ID of the dataset. |
| `data` | `any[]` | The actual data records. |
| `columns` | `string[]` | Array of column names. |
| `dtypes` | `string[]` | Array of data types for columns (e.g., 'string', 'number'). |
| `format` | `string` | Data format: `'table'`, `'records'`, `'list'`, or `'record'`. |

**Example Dataset (Records Format):**
```json
"salesData": {
    "id": "salesData",
    "format": "records",
    "columns": ["Region", "Sales"],
    "dtypes": ["string", "number"],
    "data": [
        { "Region": "North", "Sales": 1000 },
        { "Region": "South", "Sales": 1500 }
    ]
}
```

**Example Dataset (Table Format):**
```json
"inventoryData": {
    "id": "inventoryData",
    "format": "table",
    "columns": ["Item", "Quantity"],
    "dtypes": ["string", "number"],
    "data": [
        ["Widget A", 500],
        ["Widget B", 300]
    ]
}
```

### Pages

Each page in the `pages` array represents a tab in the report.

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string` | The title of the tab/page. |
| `description` | `string` | Optional description. |
| `lastUpdated` | `string` | ISO date string. |
| `rows` | `Layout[]` | An array of layout rows. |

### Layouts & Visuals

The `rows` array contains layout objects. Layouts can contain other layouts or visuals.

#### Common Properties (All Elements)

| Property | Type | Description |
|----------|------|-------------|
| `type` | `string` | The type of component (e.g., `layout`, `card`, `kpi`). |
| `padding` | `number` | Padding in pixels. |
| `margin` | `number` | Margin in pixels. |
| `border` | `boolean/string` | CSS border or boolean to enable default. |
| `shadow` | `boolean/string` | CSS box-shadow or boolean to enable default. |
| `flex` | `number` | Flex grow value. |

#### Layout Component (`type: "layout"`)

| Property | Type | Description |
|----------|------|-------------|
| `direction` | `'row' \| 'column'` | Direction of children. |
| `children` | `Array` | Array of child elements (Layouts or Visuals). |

#### Visual Components

All visuals require a `datasetId` pointing to a key in the `datasets` object.

**1. Card (`type: "card"`)**

Displays a simple text card.

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string` | Optional title header. |
| `text` | `string` | The main content text. |

`title` and `text` support a template syntax using `{{ ... }}` placeholders. The contents of each placeholder are evaluated as a **JavaScript expression**.

Available variables inside `{{ ... }}`:

- `datasets`: the datasets object from `report-data`
- `props`: reserved for future use (currently `{}` for cards)
- `helpers`: helper functions

Convenience: the following helper functions are also available directly (they are destructured from `helpers`):

- `count(datasetId)`
- `sum(datasetId, column)`, `avg(datasetId, column)`, `min(datasetId, column)`, `max(datasetId, column)` (these operate on `table`-format datasets)
- `formatNumber(value, digits?)`, `formatPercent(value, digits?)`, `formatCurrency(value, symbol?, digits?)`

⚠️ **Security note:** because `report-data` is embedded in the HTML, this means your report configuration can execute arbitrary code in the viewer’s browser. Only use this if the HTML/JSON is trusted.

**Example Card with computed text:**

```json
{
    "type": "card",
    "title": "Dataset Summary",
    "text": "Rows in tasksData: {{count('tasksData')}}"
}
```

You can also provide an object form if you want the whole value to be a single expression:

```json
{
    "type": "card",
    "title": { "expr": "'Rows: ' + count('tasksData')" },
    "text": { "expr": "formatCurrency(sum('kpiData', 'Value'), '$', 0)" }
}
```

**2. KPI (`type: "kpi"`)**

Displays a Key Performance Indicator with optional comparison and breach status.

| Property | Type | Description |
|----------|------|-------------|
| `valueColumn` | `string \| number` | Column for the main value. |
| `comparisonColumn` | `string \| number` | Column for the comparison value (e.g., yesterday). |
| `rowIndex` | `number` | Index of the row in the dataset to display (default 0). |
| `format` | `'number' \| 'currency' \| 'percent'` | Formatting style. |
| `currencySymbol` | `string` | Symbol for currency (default '$'). |
| `goodDirection` | `'higher' \| 'lower'` | Which direction is considered "good". |
| `breachValue` | `number` | Value that triggers a breach indicator. |
| `warningValue` | `number` | Value that triggers a warning indicator. |

**3. Pie Chart (`type: "pie"`)**

| Property | Type | Description |
|----------|------|-------------|
| `categoryColumn` | `string \| number` | Column for slice labels. |
| `valueColumn` | `string \| number` | Column for slice size. |
| `innerRadius` | `number` | For donut chart style. |
| `showLegend` | `boolean` | Whether to show the legend. |

**4. Stacked / Clustered Bar Chart (`type: "stackedBar"`, `type: "clusteredBar"`)**

| Property | Type | Description |
|----------|------|-------------|
| `xColumn` | `string \| number` | Column for X-axis categories. |
| `yColumns` | `string[]` | Array of columns for Y-axis values (series). |
| `xAxisLabel` | `string` | Label for X-axis. |
| `yAxisLabel` | `string` | Label for Y-axis. |
| `showLegend` | `boolean` | Whether to show the legend. |
| `showLabels` | `boolean` | Whether to show value labels on bars. |

**5. Scatter Plot (`type: "scatter"`)**

| Property | Type | Description |
|----------|------|-------------|
| `xColumn` | `string \| number` | Column for X-axis values (numeric). |
| `yColumn` | `string \| number` | Column for Y-axis values (numeric). |
| `categoryColumn` | `string \| number` | Optional column for coloring points by category. |
| `showTrendline` | `boolean` | Whether to show a linear regression trendline. |
| `showCorrelation` | `boolean` | Whether to show correlation stats (r, r², equation). |
| `pointSize` | `number` | Size of the data points (default 5). |
| `xAxisLabel` | `string` | Label for X-axis. |
| `yAxisLabel` | `string` | Label for Y-axis. |

**6. Table (`type: "table"`)**

Displays data in a tabular format with sorting, filtering, and pagination.

| Property | Type | Description |
|----------|------|-------------|
| `columns` | `string[]` | Optional array of column names to display. Defaults to all. |
| `pageSize` | `number` | Number of rows per page (default 10). |
| `tableStyle` | `'plain' \| 'bordered' \| 'alternating'` | Visual style of the table (default 'plain'). |
| `showSearch` | `boolean` | Whether to show the search bar (default true). |
| `title` | `string` | Optional title for the table. |

**7. Checklist (`type: "checklist"`)**

Displays a list of tasks with completion status and due date warnings.

| Property | Type | Description |
|----------|------|-------------|
| `statusColumn` | `string` | **Required**. Column name containing boolean/truthy value for completion. |
| `warningColumn` | `string` | Optional. Column name containing a date to check against. |
| `warningThreshold` | `number` | Optional. Days before due date to trigger warning (default 3). |
| `columns` | `string[]` | Optional array of column names to display. |
| `pageSize` | `number` | Number of rows per page (default 10). |
| `showSearch` | `boolean` | Whether to show the search bar (default true). |

## Example Configuration

```json
{
    "pages": [
        {
            "title": "Dashboard",
            "rows": [
                {
                    "type": "layout",
                    "direction": "row",
                    "children": [
                        {
                            "type": "kpi",
                            "datasetId": "kpiData",
                            "title": "Total Revenue",
                            "valueColumn": "Revenue",
                            "format": "currency",
                            "border": true,
                            "shadow": true
                        },
                        {
                            "type": "card",
                            "datasetId": "dummy", 
                            "title": "Info",
                            "text": "Revenue is up by 5% this week.",
                            "border": true
                        }
                    ]
                }
            ]
        }
    ],
    "datasets": {
        "kpiData": {
            "id": "kpiData",
            "format": "records",
            "columns": ["Revenue"],
            "data": [{ "Revenue": 50000 }]
        },
        "dummy": {
            "id": "dummy",
            "format": "records",
            "columns": [],
            "data": []
        }
    }
}
```
