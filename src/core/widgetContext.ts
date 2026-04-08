import { resolveWeatherIcon } from "../icons";
import type {
  RenderContext,
  ResolvedWidgetOptions,
  WeatherPayload,
} from "../types";
import { defaultFormatTemperature, defaultFormatWind } from "./widgetUtils";

const prefersReducedMotion = () => {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
};

const formatCoordinateLabel = (lat: number, lon: number) => {
  return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
};

export const buildRenderContext = (
  data: WeatherPayload,
  options: ResolvedWidgetOptions,
  isRefreshing: boolean,
  isFromCache: boolean
): RenderContext => {
  const temperatureFormatter = (value: number) => {
    return (
      options.hooks.formatTemperature?.(value, options.units) ??
      defaultFormatTemperature(value, options.units)
    );
  };
  const windFormatter = (value: number) => {
    return (
      options.hooks.formatWind?.(value, options.units) ??
      defaultFormatWind(value, options.units)
    );
  };

  const locationTabs = options.locations.map((location, index) => {
    const fallback = formatCoordinateLabel(location.lat, location.lon);
    const label =
      location.name?.trim() ||
      (index === options.activeLocationIndex ? data.locationName : undefined) ||
      fallback;

    return {
      index,
      label,
      active: index === options.activeLocationIndex,
    };
  });

  return {
    data,
    options,
    isRefreshing,
    isFromCache,
    locationLabel:
      options.location.name ??
      data.locationName ??
      formatCoordinateLabel(options.location.lat, options.location.lon),
    locationTabs,
    temperatureFormatter,
    windFormatter,
    icon: (code, isDay = true, label = "Weather icon", size = 40) => {
      return resolveWeatherIcon({
        code,
        isDay,
        label,
        size,
        style: options.icons.style,
        colorMode: options.icons.colorMode,
        pack: options.icons.pack,
        reducedMotion: prefersReducedMotion(),
      });
    },
  };
};
