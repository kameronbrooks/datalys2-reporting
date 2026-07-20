# Plan — 0.5.0 (draft)

Committed headline feature: **remote dataset support**. Everything else below is a
candidate to round out the release — decide scope when 0.4.1 ships.

## 1. Remote datasets (committed)

Let a dataset be fetched at load time instead of inlined in the config:

```json
"sales": {
  "url": "https://example.com/api/sales.json",
  "format": "records"
}
```

### Design questions to settle before implementation

- **Response shape**: expect the same dataset JSON shape (`columns` / `dtypes` /
  `data`) minus the `url`? Or allow a `path` / mapping option for APIs that wrap
  data (e.g. `{ "extract": "result.rows" }`)? Recommend: same-shape by default,
  optional `extract` dot-path.
- **Formats**: JSON first; CSV parsing (`format: "csv"`) is a cheap, high-value add.
- **Loading UX**: report renders immediately; visuals bound to a pending dataset show
  a loading state in `VisualContainer` (spinner/skeleton), then hydrate. Errors show
  the existing "Dataset not found"-style inline error with the HTTP failure.
- **Interaction with derived datasets**: derived datasets (`source`) must wait for
  their remote source — the load-time computation becomes async. Chains and cycle
  warnings must keep working. This is the main refactor: `dataset-utility` /
  AppContext init moves from sync to async with a "datasets ready" signal.
- **Refresh**: out of scope for v1? Or minimal `refreshInterval` (seconds) per
  dataset for dashboards. Recommend deferring auto-refresh unless trivial.
- **CORS/auth**: document that endpoints must be CORS-accessible; optional
  `headers` object on the dataset for tokens. No credential storage in the library.
- **Validation**: column checks for remote datasets can only run after fetch —
  re-run per-visual column validation post-hydration, or skip with a console note.

## 2. Candidates (pick when scoping)

- **Cross-visual filtering** — click a bar/slice/point to filter other visuals
  sharing the dataset (or linked via `source`). Flagship-sized; pairs naturally with
  remote data for dashboard use. Needs: selection state in AppContext, per-visual
  opt-in/opt-out, visual affordance for active filters + clear button.
- **Chart PNG/SVG export** — if it didn't make 0.4.1.
- **Print/PDF stylesheet** — print CSS across all visuals: expand collapsed groups,
  flatten tabs into sequential sections, remove interactive chrome, page-break
  hints per visual.
- **Auto-refresh for remote datasets** — if deferred out of remote-dataset v1.

## Reminder of standing constraints

- Presentation layer only: no visual ever mutates data (0.4.1 decision — checklists
  stay read-only; the same applies to any future editable-looking visual).
