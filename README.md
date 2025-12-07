# Datalys2 Reports

A React-based framework for showing dashboards and reports, designed to be loaded from CDN.

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Watch for changes during development
npm run dev
```

## CDN Usage

After building, your library can be loaded from a CDN or directly from the `dist` folder:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Dashboard</title>
</head>
<body>
    <div id="root"></div>

    <!-- Load React from CDN -->
    <script crossorigin src="https://unpkg.com/react@19/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"></script>
    
    <!-- Load Datalys2 Reports -->
    <script src="https://your-cdn.com/datalys2-reports.min.js"></script>

    <script>
        const { Dashboard, Report } = Datalys2Reports;
        
        const app = React.createElement(
            Dashboard,
            { title: 'Sales Dashboard' },
            React.createElement(Report, {
                type: 'sales',
                data: { revenue: 50000 }
            })
        );

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(app);
    </script>
</body>
</html>
```

## NPM Usage

You can also use this library via NPM:

```javascript
import { Dashboard, Report } from 'datalys2-reports';

function App() {
  return (
    <Dashboard title="My Dashboard">
      <Report type="sales" data={{ revenue: 50000 }} />
    </Dashboard>
  );
}
```

## Features

- UMD module format (works in browsers, CommonJS, AMD)
- React and ReactDOM are external dependencies (must be loaded separately)
- Global variable: `Datalys2Reports`
- Compatible with CDN loading
