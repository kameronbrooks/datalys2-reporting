# Datalys2 Reports

A configuration-driven React framework for generating dynamic dashboards and reports.

## Overview

Datalys2 Reports allows you to create rich, interactive reports by simply defining a JSON configuration embedded in your HTML. It handles the layout, data visualization, and interactivity, so you don't need to write custom React code for every report.

## Features

*   **JSON Configuration**: Define your report structure, pages, and data in a simple JSON format.
*   **Multiple Visuals**: Includes built-in components like KPIs, Pie Charts, Stacked Bar Charts, Clustered Bar Charts, and Cards.
*   **Layout System**: Flexible row/column layout system.
*   **Data Handling**: Supports multiple datasets in 'records' or 'table' formats.
*   **Theming**: Customizable via CSS.

## Usage

1.  **Include the assets**: Add the `dl2-style.css` and the compiled JavaScript bundle to your HTML file.
2.  **Add the container**: Create a `<div id="root"></div>` element.
3.  **Define the data**: Add a `<script id="report-data" type="application/json">` tag containing your report configuration.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Report</title>
    <link rel="stylesheet" href="dl2-style.css">
</head>
<body>
    <div id="root"></div>

    <script id="report-data" type="application/json">
    {
        "pages": [ ... ],
        "datasets": { ... }
    }
    </script>

    <script src="datalys2-reports.min.js"></script>
</body>
</html>
```

For detailed documentation on the configuration schema and available components, please refer to [DOCUMENTATION.md](./DOCUMENTATION.md).

## Development

### Prerequisites

*   Node.js
*   npm

### Setup

```bash
# Install dependencies
npm install
```

### Build

To build the production bundle:

```bash
npm run build
```

### Watch Mode

To watch for changes during development:

```bash
npm run dev
```

## License

ISC
