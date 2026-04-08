import "./styles/widget.scss";

import { registerIconPack } from "./icons";
import { openMeteoProvider } from "./providers/openMeteo";
import { registerProvider, registerLayout, WeatherWidget } from "./widget";

registerProvider("open-meteo", openMeteoProvider);

declare global {
  interface Window {
    WeatherWidget?: typeof WeatherWidget;
  }
}

if (typeof window !== "undefined") {
  window.WeatherWidget = WeatherWidget;
}

export {
  WeatherWidget,
  registerProvider,
  registerLayout,
  registerIconPack,
  openMeteoProvider,
};
export type {
  CacheOptions,
  DailyModuleOptions,
  Density,
  DetailsModuleOptions,
  DetailField,
  HourlyModuleOptions,
  IconOptions,
  IconPackResolver,
  IconStyle,
  IconColorMode,
  LayoutName,
  LayoutRenderer,
  LocationOptions,
  ResolvedWidgetOptions,
  ThemeMode,
  ThemeTokens,
  Units,
  WeatherCurrent,
  WeatherDailyEntry,
  WeatherHourlyEntry,
  WeatherPayload,
  WeatherProvider,
  WeatherProviderRequest,
  WeatherWidgetOptions,
  WidgetHooks,
  WidgetModuleName,
  WidgetModulesOptions,
} from "./types";

export default WeatherWidget;
