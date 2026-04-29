export type Units = "metric" | "imperial";
export type ThemeMode = "light" | "dark" | "auto";
export type LayoutName =
  | "compact"
  | "card"
  | "forecast"
  | "horizontal"
  | "simple"
  | (string & {});
export type Density = "comfortable" | "compact";
export type IconStyle = "static" | "animated";
export type IconColorMode = "colored" | "themed";
export type TimeFormat = "auto" | "12h" | "24h";
export type WidgetModuleName = "current" | "details" | "hourly" | "daily";
export type DetailField =
  | "feelsLike"
  | "humidity"
  | "wind"
  | "precip"
  | "uv"
  | "shortwaveRadiation"
  | "cloudCover"
  | "sunrise"
  | "sunset";

export interface LocationOptions {
  lat: number;
  lon: number;
  name?: string;
}

export interface HourlyModuleOptions {
  enabled: boolean;
  hours: number;
  stepHours: 1 | 3;
}

export interface DailyModuleOptions {
  enabled: boolean;
  days: number;
}

export interface DetailsModuleOptions {
  enabled: boolean;
  fields: DetailField[];
}

export interface WidgetModulesOptions {
  current: boolean;
  hourly: HourlyModuleOptions;
  daily: DailyModuleOptions;
  details: DetailsModuleOptions;
  order?: WidgetModuleName[];
}

export interface IconOptions {
  style: IconStyle;
  colorMode: IconColorMode;
  pack?: string;
}

export interface ThemeTokens {
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  accent: string;
  radius: string;
  fontFamily: string;
}

export interface CacheOptions {
  enabled: boolean;
  ttlMinutes: number;
  staleWhileRevalidate: boolean;
}

export interface WidgetHooks {
  formatTemperature?: (value: number, units: Units) => string;
  formatWind?: (value: number, units: Units) => string;
}

export interface WeatherWidgetOptions {
  location?: LocationOptions;
  locations?: LocationOptions[];
  activeLocationIndex?: number;
  units?: Units;
  theme?: ThemeMode;
  layout?: LayoutName;
  density?: Density;
  modules?: Partial<WidgetModulesOptions>;
  icons?: Partial<IconOptions>;
  refreshMinutes?: number;
  cache?: Partial<CacheOptions>;
  provider?: string | WeatherProvider;
  apiKey?: string;
  locale?: string;
  timeFormat?: TimeFormat;
  debug?: boolean;
  themeTokens?: Partial<ThemeTokens>;
  showTitle?: boolean;
  showUpdatedAt?: boolean;
  showRefreshButton?: boolean;
  onError?: (error: unknown) => void;
  hooks?: WidgetHooks;
}

export interface ProviderFieldsRequested {
  current: boolean;
  detailFields: DetailField[];
  hourly: boolean;
  hourlyHours: number;
  hourlyStepHours: 1 | 3;
  daily: boolean;
  dailyDays: number;
}

export interface WeatherProviderRequest {
  lat: number;
  lon: number;
  units: Units;
  signal?: AbortSignal;
  apiKey?: string;
  locale?: string;
  fieldsRequested: ProviderFieldsRequested;
}

export interface WeatherCurrent {
  time: string;
  temperature: number;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: number;
  precipitation?: number;
  uvIndex?: number;
  shortwaveRadiation?: number;
  cloudCover?: number;
  weatherCode: number;
  summary: string;
  isDay: boolean;
}

export interface WeatherHourlyEntry {
  time: string;
  temperature: number;
  feelsLike?: number;
  windSpeed?: number;
  precipitationProbability?: number;
  uvIndex?: number;
  shortwaveRadiation?: number;
  cloudCover?: number;
  weatherCode: number;
  summary: string;
}

export interface WeatherDailyEntry {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbability?: number;
  weatherCode: number;
  summary: string;
  sunrise?: string;
  sunset?: string;
}

export interface WeatherPayload {
  provider: string;
  locationName?: string;
  timezone?: string;
  updatedAt: string;
  current?: WeatherCurrent;
  hourly: WeatherHourlyEntry[];
  daily: WeatherDailyEntry[];
  units: {
    temperature: string;
    windSpeed: string;
    precipitation: string;
  };
}

export interface WeatherProvider {
  key: string;
  getWeather: (request: WeatherProviderRequest) => Promise<WeatherPayload>;
}

export interface ResolvedWidgetOptions {
  location: LocationOptions;
  locations: LocationOptions[];
  activeLocationIndex: number;
  units: Units;
  theme: ThemeMode;
  layout: LayoutName;
  density: Density;
  modules: WidgetModulesOptions;
  icons: IconOptions;
  refreshMinutes: number;
  cache: CacheOptions;
  provider: string | WeatherProvider;
  apiKey?: string;
  locale: string | undefined;
  timeFormat: TimeFormat;
  debug: boolean;
  themeTokens: Partial<ThemeTokens>;
  showTitle: boolean;
  showUpdatedAt: boolean;
  showRefreshButton: boolean;
  onError?: (error: unknown) => void;
  hooks: WidgetHooks;
}

export interface RenderContext {
  data: WeatherPayload;
  options: ResolvedWidgetOptions;
  isRefreshing: boolean;
  isFromCache: boolean;
  locationLabel: string;
  locationTabs: Array<{
    index: number;
    label: string;
    active: boolean;
  }>;
  temperatureFormatter: (value: number) => string;
  windFormatter: (value: number) => string;
  icon: (
    code: number,
    isDay?: boolean,
    label?: string,
    size?: number
  ) => string;
}

export type LayoutRenderer = (context: RenderContext) => string;
export type IconPackResolver = (input: {
  code: number;
  isDay: boolean;
  label: string;
  size: number;
  style: IconStyle;
  colorMode: IconColorMode;
}) => string;
