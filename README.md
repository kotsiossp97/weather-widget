# Weather Widget

Framework-agnostic weather widget with a small embeddable API for bundlers and plain HTML pages. It ships ESM, CJS, a CDN-friendly UMD bundle, TypeScript declarations, and a generated stylesheet.

## Install

```bash
npm install openmeteo-weather-widget
```

## NPM usage

```ts
import { WeatherWidget } from "openmeteo-weather-widget";
import "openmeteo-weather-widget/style.css";

const widget = new WeatherWidget({
  locations: [
    { lat: 37.9838, lon: 23.7275, name: "Athens" },
    { lat: 40.6401, lon: 22.9444, name: "Thessaloniki" },
  ],
  activeLocationIndex: 0,
  layout: "simple",
  theme: "auto",
  units: "metric",
  icons: { style: "animated", pack: "default" },
  modules: {
    current: true,
    hourly: { enabled: true, hours: 12, stepHours: 1 },
    daily: { enabled: true, days: 5 },
    details: {
      enabled: true,
      fields: ["feelsLike", "humidity", "wind", "precip", "uv"],
    },
  },
});

widget.mount("#weather");
```

## CDN usage

```html
<link rel="stylesheet" href="./dist/style.css" />
<div id="weather"></div>
<script src="./dist/weather-widget.umd.js"></script>
<script>
  const widget = new window.WeatherWidget({
    locations: [
      { lat: 40.7128, lon: -74.006, name: "New York" },
      { lat: 34.0522, lon: -118.2437, name: "Los Angeles" },
    ],
    layout: "forecast",
    theme: "dark",
  });

  widget.mount("#weather");
</script>
```

## Public API

```ts
const widget = new WeatherWidget(options);

widget.mount("#weather");
widget.refresh();
widget.setOptions({ layout: "compact" });
widget.unmount();
```

## Configuration reference

| Option                | Type                                            | Default               | Available Options         | Notes                                                                                                              |
| --------------------- | ----------------------------------------------- | --------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `location`            | `{ lat, lon, name? }`                           | optional              |                           | Single-location shorthand. If `locations` is absent, this location is used.                                        |
| `locations`           | `Array<{ lat, lon, name? }>`                    | optional              |                           | Enables location tabs in the widget header and fetches weather per selected location.                              |
| `activeLocationIndex` | `number`                                        | `0`                   |                           | Initial selected location index when `locations` is provided.                                                      |
| `units`               | `Units`                                         | `"imperial"`          | `"metric" "imperial"`     | Controls temperature, wind, and precipitation formatting.                                                          |
| `theme`               | `"light"                                        | `"dark"`              | `"light" "dark"  "auto"`  | `auto` follows `prefers-color-scheme`.                                                                             |
| `layout`              | `"compact"                                      | `"card"`              |                           | "forecast", `"horizontal"`, `"card"` Four responsive presets.                                                      |
| `density`             | `Density`                                       | `"compact"`           | `"comfortable" "compact"` | `"comfortable"` Tightens spacing and typography.                                                                   |
| `modules.current`     | `boolean`                                       | `true`                |                           | Enables the hero/current conditions block.                                                                         |
| `modules.details`     | `{ enabled, fields }`                           | enabled               |                           | Supports `feelsLike`, `humidity`, `wind`, `precip`, `uv`, `shortwaveRadiation`, `cloudCover`, `sunrise`, `sunset`. |
| `modules.hourly`      | `{ enabled, hours, stepHours }`                 | `12`, `1`             |                           | Works with `6/12/24/48` and `1h/3h` style setups.                                                                  |
| `modules.daily`       | `{ enabled, days }`                             | `5`                   |                           | Supports short or extended forecast strips.                                                                        |
| `modules.order`       | `WidgetModuleName[]`                            | layout-specific       |                           | Reorders sections where the layout allows it.                                                                      |
| `icons`               | `{ style, pack }`                               | animated default pack |                           | Falls back to static when reduced motion is requested.                                                             |
| `refreshMinutes`      | `number`                                        | `15`                  |                           | Automatic polling; set `0` to disable.                                                                             |
| `cache`               | `{ enabled, ttlMinutes, staleWhileRevalidate }` | enabled, `15`, `true` |                           | Uses `localStorage` keyed by provider and location.                                                                |
| `provider`            | `string`                                        | `WeatherProvider`     |                           | `"open-meteo"` Inject a custom provider instance or register one globally.                                         |
| `apiKey`              | `string`                                        | optional              |                           | Reserved for key-based providers.                                                                                  |
| `locale`              | `string`                                        | browser locale        |                           | Used for date and time formatting (override to force a specific locale).                                           |
| `timeFormat`          | `"auto" \| "12h" \| "24h"`                      | `"auto"`              |                           | Controls 12-hour or 24-hour clock display for widget times.                                                        |
| `themeTokens`         | partial token object                            | optional              |                           | Override colors, radius, or font family.                                                                           |
| `hooks`               | formatting callbacks                            | optional              |                           | Override temperature and wind formatting.                                                                          |
| `onError`             | `(error) => void`                               | optional              |                           | Called for fetch or provider failures.                                                                             |

## Layouts

- `compact`: current conditions, summary, and a tighter module stack.
- `card`: balanced current panel, detail grid, and forecast rails.
- `forecast`: multi-day grid first, then deeper hourly/detail sections.
- `horizontal`: current conditions + horizontally scrollable daily forecast strip.
- `simple`: compact current panel with a clean daily grid for tight embeds.

```ts
new WeatherWidget({
  location,
  layout: "compact",
  modules: { daily: { enabled: true, days: 3 } },
});
new WeatherWidget({ location, layout: "card", icons: { style: "animated" } });
new WeatherWidget({
  location,
  layout: "forecast",
  modules: { hourly: { enabled: true, hours: 24, stepHours: 3 } },
});
new WeatherWidget({
  location,
  layout: "horizontal",
  modules: { daily: { enabled: true, days: 7 } },
});
new WeatherWidget({
  locations: [
    { lat: 37.9838, lon: 23.7275, name: "Athens" },
    { lat: 40.6401, lon: 22.9444, name: "Thessaloniki" },
  ],
  layout: "simple",
});
```

Layout preview placeholders:

- Compact screenshot: `docs/placeholders/compact.png`
- Compact screenshot: `docs/placeholders/compact.svg`
- Card screenshot: `docs/placeholders/card.svg`
- Forecast screenshot: `docs/placeholders/forecast.svg`

## Providers and extensibility

The default provider is Open-Meteo, so the widget works without an API key.

Provider notes:

- Open-Meteo is the built-in no-key provider for v1.
- Key-based providers can use the same `WeatherProvider` contract and consume `apiKey`.
- Open-Meteo requests are made in `UTC`; displayed times are converted to the user's browser timezone.

```ts
import {
  registerProvider,
  type WeatherProvider,
} from "openmeteo-weather-widget";

const customProvider: WeatherProvider = {
  key: "custom",
  async getWeather({ lat, lon, units, signal, apiKey, fieldsRequested }) {
    return {
      provider: "custom",
      updatedAt: new Date().toISOString(),
      hourly: [],
      daily: [],
      units: {
        temperature: units === "metric" ? "C" : "F",
        windSpeed: units === "metric" ? "km/h" : "mph",
        precipitation: units === "metric" ? "mm" : "in",
      },
    };
  },
};

registerProvider("custom", customProvider);
```

Custom layouts and icon packs are also pluggable with `registerLayout()` and `registerIconPack()`.

## Theming

The widget uses CSS variables internally:

- `--ww-background`
- `--ww-surface`
- `--ww-text`
- `--ww-muted`
- `--ww-border`
- `--ww-accent`
- `--ww-radius`
- `--ww-font`

You can override them through `themeTokens` or from external CSS.

## Icons

- `icons.style: "static"` uses inline SVG icons.
- `icons.style: "animated"` uses animated SVG variants.
- When `prefers-reduced-motion: reduce` is active, the widget switches to static rendering automatically.
- Used icons from [Meteocons](https://github.com/basmilius/weather-icons/)

## Reliability notes

- `unmount()` aborts in-flight requests and stops the refresh timer.
- Failed requests surface a retry UI and call `onError` when provided.
- Cached responses render immediately when available, then revalidate in the background if stale.

## Troubleshooting

- CORS: Open-Meteo is browser-friendly; custom providers must expose browser-safe CORS headers.
- Location permissions: geolocation is not included in v1. Pass coordinates explicitly.
- Blank widget: verify you imported `style.css` and mounted into an existing DOM node.
- Animated icons not moving: this is expected when the user prefers reduced motion.
