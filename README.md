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

You can use the library directly from a CDN without installing anything.

1.  **Include the assets**: Add the CSS and JavaScript from jsDelivr.
2.  **Add the container**: Create a `<div id="root"></div>` element.
3.  **Define the data**: Add a `<script id="report-data" type="application/json">` tag containing your report configuration.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Report</title>
    <!-- Include styles from CDN -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/kameronbrooks/datalys2-reporting@latest/dist/dl2-style.css">
</head>
<body>
    <div id="root"></div>

    <script id="report-data" type="application/json">
    {
        "pages": [ ... ],
        "datasets": { ... }
    }
    </script>

    <!-- Include script from CDN -->
    <script src="https://cdn.jsdelivr.net/gh/kameronbrooks/datalys2-reporting@latest/dist/datalys2-reports.min.js"></script>
</body>
</html>
```

For detailed documentation on the configuration schema and available components, please refer to [DOCUMENTATION.md](./DOCUMENTATION.md).

---

## Development

This section is only if you are building the package yourself!

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
