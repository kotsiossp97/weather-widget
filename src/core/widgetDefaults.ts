import type {
  CacheOptions,
  ResolvedWidgetOptions,
  ThemeTokens,
  WidgetModuleName,
} from "../types";

export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  background: "#f4efe6",
  surface: "rgba(255, 252, 246, 0.86)",
  text: "#1f2421",
  mutedText: "#5d675e",
  border: "rgba(31, 36, 33, 0.12)",
  accent: "#0d7c66",
  accentSoft: "rgba(13, 124, 102, 0.16)",
  radius: "28px",
  fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
};

export const DEFAULT_CACHE: CacheOptions = {
  enabled: true,
  ttlMinutes: 15,
  staleWhileRevalidate: true,
};

export const DEFAULT_OPTIONS: ResolvedWidgetOptions = {
  location: { lat: 0, lon: 0 },
  locations: [{ lat: 0, lon: 0 }],
  activeLocationIndex: 0,
  units: "metric",
  theme: "auto",
  layout: "card",
  density: "comfortable",
  modules: {
    current: true,
    details: {
      enabled: true,
      fields: [
        "feelsLike",
        "humidity",
        "wind",
        "precip",
        "uv",
        "sunrise",
        "sunset",
      ],
    },
    hourly: {
      enabled: true,
      hours: 12,
      stepHours: 1,
    },
    daily: {
      enabled: true,
      days: 5,
    },
    order: ["current", "details", "hourly", "daily"],
  },
  icons: {
    style: "animated",
    colorMode: "themed",
    pack: "default",
  },
  refreshMinutes: 15,
  cache: DEFAULT_CACHE,
  provider: "open-meteo",
  locale: undefined,
  timeFormat: "auto",
  debug: false,
  themeTokens: {},
  showTitle: true,
  showUpdatedAt: true,
  showRefreshButton: true,
  hooks: {},
};

export const DEFAULT_LAYOUT_ORDER: Record<string, WidgetModuleName[]> = {
  compact: ["current", "details", "daily", "hourly"],
  card: ["current", "details", "daily", "hourly"],
  forecast: ["current", "daily", "hourly", "details"],
  horizontal: ["current", "daily"],
  simple: ["current", "daily", "details", "hourly"],
};
