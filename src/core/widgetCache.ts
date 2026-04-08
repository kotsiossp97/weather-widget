import type { ResolvedWidgetOptions, WeatherPayload } from "../types";

interface CacheEntry {
  expiresAt: number;
  payload: WeatherPayload;
}

export const createCacheKey = (
  options: ResolvedWidgetOptions,
  providerKey: string
) => {
  const identity = {
    provider: providerKey,
    lat: options.location.lat,
    lon: options.location.lon,
    units: options.units,
    layout: options.layout,
    hourly: options.modules.hourly,
    daily: options.modules.daily,
    details: options.modules.details.fields,
  };

  return `weather-widget:${JSON.stringify(identity)}`;
};

export const readCache = (key: string) => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
};

export const writeCache = (
  key: string,
  payload: WeatherPayload,
  ttlMinutes: number
) => {
  if (typeof window === "undefined") {
    return;
  }

  const entry: CacheEntry = {
    payload,
    expiresAt: Date.now() + ttlMinutes * 60_000,
  };

  window.localStorage.setItem(key, JSON.stringify(entry));
};
