import type { ResolvedWidgetOptions } from "../types";

const FALLBACK_LOCALE = "en-US";
const FALLBACK_TIME_ZONE = "UTC";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const deepMerge = <T>(base: T, patch: Partial<T>): T => {
  const result = { ...(base as Record<string, unknown>) };

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      continue;
    }

    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
      continue;
    }

    result[key] = Array.isArray(value) ? [...value] : value;
  }

  return result as T;
};

export const escapeHtml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

export const resolveElement = (target: string | Element) => {
  if (typeof target === "string") {
    const element = document.querySelector(target);
    if (!element) {
      throw new Error(`WeatherWidget could not find mount target: ${target}`);
    }
    return element;
  }

  return target;
};

export const getBrowserLocale = () => {
  if (typeof navigator === "undefined") {
    return FALLBACK_LOCALE;
  }

  return navigator.language || FALLBACK_LOCALE;
};

export const getBrowserTimeZone = () => {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return zone || FALLBACK_TIME_ZONE;
};

const toUtcDate = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const hasExplicitZone = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed);
  if (hasExplicitZone) {
    return new Date(trimmed);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00Z`);
  }

  return new Date(`${trimmed}Z`);
};

const formatDateTime = (
  value: string,
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
  timeFormat: ResolvedWidgetOptions["timeFormat"]
) => {
  const date = toUtcDate(value);
  if (!date || Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat(locale, {
    ...options,
    hour12: timeFormat === "auto" ? undefined : timeFormat === "12h",
    timeZone: getBrowserTimeZone(),
  }).format(date);
};

export const formatShortTime = (
  value: string,
  locale: string | undefined,
  timeFormat: ResolvedWidgetOptions["timeFormat"]
) => {
  return formatDateTime(
    value,
    locale,
    {
      hour: "2-digit",
      minute: "2-digit",
    },
    timeFormat
  );
};

export const formatWeekday = (
  value: string,
  locale: string | undefined,
  timeFormat: ResolvedWidgetOptions["timeFormat"]
) => {
  return formatDateTime(value, locale, { weekday: "short" }, timeFormat);
};

export const formatClock = (
  value: string | undefined,
  locale: string | undefined,
  timeFormat: ResolvedWidgetOptions["timeFormat"]
) => {
  if (!value) {
    return "--";
  }

  return formatDateTime(
    value,
    locale,
    {
      hour: "2-digit",
      minute: "2-digit",
    },
    timeFormat
  );
};

export const formatUpdatedTime = (
  value: string,
  locale: string | undefined,
  timeFormat: ResolvedWidgetOptions["timeFormat"]
) => {
  return formatDateTime(
    value,
    locale,
    {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    },
    timeFormat
  );
};

export const defaultFormatTemperature = (
  value: number,
  units: ResolvedWidgetOptions["units"]
) => {
  return `${Math.round(value)}°${units === "metric" ? "C" : "F"}`;
};

export const defaultFormatWind = (
  value: number,
  units: ResolvedWidgetOptions["units"]
) => {
  return `${Math.round(value)} ${units === "metric" ? "km/h" : "mph"}`;
};
