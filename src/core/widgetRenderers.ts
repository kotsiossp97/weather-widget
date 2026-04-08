import type {
  DetailField,
  LayoutRenderer,
  RenderContext,
  WidgetModuleName,
} from "../types";
import { DEFAULT_LAYOUT_ORDER, DEFAULT_OPTIONS } from "./widgetDefaults";
import {
  escapeHtml,
  formatClock,
  formatShortTime,
  formatUpdatedTime,
  formatWeekday,
  getBrowserTimeZone,
} from "./widgetUtils";

const clampHourly = (
  entries: RenderContext["data"]["hourly"],
  stepHours: 1 | 3
) => {
  const now = new Date();
  const tz = getBrowserTimeZone();
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(
    now
  );

  return entries
    .filter(entry => {
      const d = new Date(entry.time);
      return (
        d >= now &&
        new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d) ===
          todayStr
      );
    })
    .filter((_, i) => i % stepHours === 0);
};

const clampDaily = (entries: RenderContext["data"]["daily"], count: number) => {
  const tz = getBrowserTimeZone();
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(
    new Date()
  );

  return entries.filter(entry => entry.date > todayStr).slice(0, count);
};

const detailFieldLabel = (field: DetailField) => {
  if (field === "feelsLike") {
    return "Feels like";
  }
  if (field === "humidity") {
    return "Humidity";
  }
  if (field === "wind") {
    return "Wind";
  }
  if (field === "precip") {
    return "Precip";
  }
  if (field === "uv") {
    return "UV index";
  }
  if (field === "shortwaveRadiation") {
    return "Irradiance";
  }
  if (field === "cloudCover") {
    return "Cloud cover";
  }
  if (field === "sunrise") {
    return "Sunrise";
  }
  return "Sunset";
};

const formatDetailValue = (field: DetailField, context: RenderContext) => {
  const current = context.data.current;
  const today = context.data.daily[0];

  if (!current) {
    return "--";
  }

  if (field === "feelsLike") {
    return current.feelsLike === undefined
      ? "--"
      : context.temperatureFormatter(current.feelsLike);
  }
  if (field === "humidity") {
    return current.humidity === undefined
      ? "--"
      : `${Math.round(current.humidity)}%`;
  }
  if (field === "wind") {
    return current.windSpeed === undefined
      ? "--"
      : context.windFormatter(current.windSpeed);
  }
  if (field === "precip") {
    return current.precipitation === undefined
      ? "--"
      : `${current.precipitation.toFixed(1)} ${context.data.units.precipitation}`;
  }
  if (field === "uv") {
    return current.uvIndex === undefined ? "--" : current.uvIndex.toFixed(1);
  }
  if (field === "shortwaveRadiation") {
    return current.shortwaveRadiation === undefined
      ? "--"
      : `${Math.round(current.shortwaveRadiation)} W/m2`;
  }
  if (field === "cloudCover") {
    return current.cloudCover === undefined
      ? "--"
      : `${Math.round(current.cloudCover)}%`;
  }
  if (field === "sunrise") {
    return formatClock(
      today?.sunrise,
      context.options.locale,
      context.options.timeFormat
    );
  }

  return formatClock(
    today?.sunset,
    context.options.locale,
    context.options.timeFormat
  );
};

const renderSectionLabel = (title: string, caption?: string) => {
  return `
    <header class="ww-section-head">
      <h3>${escapeHtml(title)}</h3>
      ${caption ? `<span>${escapeHtml(caption)}</span>` : ""}
    </header>
  `;
};

const renderCurrent = (context: RenderContext, compact = false) => {
  const current = context.data.current;
  if (!current || !context.options.modules.current) {
    return "";
  }

  return `
    <section class="ww-panel ww-current ${compact ? "ww-current-compact" : ""}">
      <div class="ww-current-main">
        <div class="ww-current-icon">${context.icon(current.weatherCode, current.isDay, current.summary, compact ? 100 : 120)}</div>
        <div class="ww-current-info">
          <p class="ww-kicker">${escapeHtml(context.locationLabel)}</p>
          <h2>${context.temperatureFormatter(current.temperature)}</h2>
          <p class="ww-summary">${escapeHtml(current.summary)}</p>
        </div>
      </div>
      ${
        context.options.showUpdatedAt
          ? `<div class="ww-current-meta"><span>Updated ${escapeHtml(formatUpdatedTime(context.data.updatedAt, context.options.locale, context.options.timeFormat))}</span></div>`
          : ""
      }
    </section>
  `;
};

const renderDetails = (context: RenderContext) => {
  const fields = context.options.modules.details.fields;
  if (!context.options.modules.details.enabled || fields.length === 0) {
    return "";
  }

  return `
    <section class="ww-panel ww-details">
      ${renderSectionLabel("Conditions")}
      <div class="ww-details-grid">
        ${fields
          .map(field => {
            return `
              <article class="ww-detail-item">
                <span>${escapeHtml(detailFieldLabel(field))}</span>
                <strong>${escapeHtml(formatDetailValue(field, context))}</strong>
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
};

const renderHourly = (context: RenderContext) => {
  if (!context.options.modules.hourly.enabled) {
    return "";
  }

  const entries = clampHourly(
    context.data.hourly,
    context.options.modules.hourly.stepHours
  );
  if (entries.length === 0) {
    return "";
  }

  return `
    <section class="ww-panel ww-hourly">
      ${renderSectionLabel("Hourly Forecast", "Today")}
      <div class="ww-rail">
        ${entries
          .map(entry => {
            return `
              <article class="ww-mini-card">
                <span class="ww-mini-time">${escapeHtml(formatShortTime(entry.time, context.options.locale, context.options.timeFormat))}</span>
                ${context.icon(entry.weatherCode, true, entry.summary, 40)}
                <strong>${context.temperatureFormatter(entry.temperature)}</strong>
                <span>${entry.precipitationProbability === undefined ? "--" : `${Math.round(entry.precipitationProbability)}% rain`}</span>
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
};

const renderDaily = (context: RenderContext, grid = false) => {
  if (!context.options.modules.daily.enabled) {
    return "";
  }

  const entries = clampDaily(
    context.data.daily,
    context.options.modules.daily.days
  );
  if (entries.length === 0) {
    return "";
  }

  return `
    <section class="ww-panel ww-daily ${grid ? "ww-daily-grid" : ""}">
      ${renderSectionLabel("Daily Forecast", `${entries.length} days`)}
      <div class="${grid ? "ww-forecast-grid" : "ww-rail"}">
        ${entries
          .map(entry => {
            return `
              <article class="${grid ? "ww-day-card" : "ww-mini-card"}">
                <span class="ww-mini-time">${escapeHtml(formatWeekday(entry.date, context.options.locale, context.options.timeFormat))}</span>
                ${context.icon(entry.weatherCode, true, entry.summary, grid ? 54 : 40)}
                <p class="ww-temp-range">
                  <strong>${context.temperatureFormatter(entry.temperatureMax)}</strong>
                  <span class="ww-temp-separator" aria-hidden="true">/</span>
                  <span class="ww-temp-low">${context.temperatureFormatter(entry.temperatureMin)}</span>
                </p>
                <span>${entry.precipitationProbability === undefined ? "--" : `${Math.round(entry.precipitationProbability)}% precip`}</span>
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
};

const renderOrderedModules = (
  context: RenderContext,
  overrides?: Partial<Record<WidgetModuleName, string>>
) => {
  const order =
    context.options.modules.order ??
    DEFAULT_LAYOUT_ORDER[context.options.layout] ??
    DEFAULT_OPTIONS.modules.order ??
    [];
  const modules = new Map<WidgetModuleName, string>([
    ["current", overrides?.current ?? renderCurrent(context)],
    ["details", overrides?.details ?? renderDetails(context)],
    ["hourly", overrides?.hourly ?? renderHourly(context)],
    ["daily", overrides?.daily ?? renderDaily(context)],
  ]);

  return order
    .map(name => modules.get(name) ?? "")
    .filter(Boolean)
    .join("");
};

const renderCompactLayout: LayoutRenderer = context => {
  return `
    <div class="ww-layout ww-layout-compact">
      ${renderOrderedModules(context, {
        current: renderCurrent(context, true),
      })}
    </div>
  `;
};

const renderCardLayout: LayoutRenderer = context => {
  return `
    <div class="ww-layout ww-layout-card">
      ${renderCurrent(context)}
      <div class="ww-stack">${renderOrderedModules(context, { current: "" })}</div>
    </div>
  `;
};

const renderForecastLayout: LayoutRenderer = context => {
  return `
    <div class="ww-layout ww-layout-forecast">
      <div class="ww-forecast-hero">
        ${renderCurrent(context)}
        ${renderDaily(context, true)}
      </div>
      <div class="ww-stack">${renderOrderedModules(context, { current: "", daily: "" })}</div>
    </div>
  `;
};

const renderHorizontalLayout: LayoutRenderer = context => {
  const layoutClass = context.options.modules.current
    ? "ww-layout ww-layout-horizontal"
    : "ww-layout ww-layout-horizontal ww-layout-horizontal-single";

  const currentSection = context.options.modules.current
    ? `
      <div class="ww-horizontal-current">
        ${renderCurrent(context)}
      </div>
    `
    : "";

  return `
    <div class="${layoutClass}">
      ${currentSection}
      <div class="ww-horizontal-forecast">
        ${renderDaily(context)}
      </div>
    </div>
  `;
};

const renderSimpleLayout: LayoutRenderer = context => {
  return `
    <div class="ww-layout ww-layout-simple">
      ${renderCurrent(context, true)}
      ${renderDaily(context, true)}
    </div>
  `;
};

export const createDefaultLayouts = () => {
  return new Map<string, LayoutRenderer>([
    ["compact", renderCompactLayout],
    ["card", renderCardLayout],
    ["forecast", renderForecastLayout],
    ["horizontal", renderHorizontalLayout],
    ["simple", renderSimpleLayout],
  ]);
};

export const renderLoadingState = () => {
  return `
    <div class="ww-loading" aria-live="polite" aria-busy="true">
      <div class="ww-skeleton ww-skeleton-title"></div>
      <div class="ww-skeleton ww-skeleton-hero"></div>
      <div class="ww-skeleton ww-skeleton-grid"></div>
    </div>
  `;
};

export const renderErrorState = (message: string) => {
  return `
    <div class="ww-error" role="alert">
      <h3>Weather data is unavailable</h3>
      <p>${escapeHtml(message)}</p>
      <button type="button" class="ww-button" data-action="refresh" aria-label="Retry weather request">Retry</button>
    </div>
  `;
};

export const renderShell = (context: RenderContext, body: string) => {
  const locationSwitcher =
    context.locationTabs.length <= 1
      ? ""
      : `
        <nav class="ww-location-switcher" aria-label="Available locations">
          ${context.locationTabs
            .map(tab => {
              return `
                <button
                  type="button"
                  class="ww-location-chip ${tab.active ? "ww-location-chip-active" : ""}"
                  data-action="switch-location"
                  data-location-index="${tab.index}"
                  aria-pressed="${tab.active ? "true" : "false"}"
                >
                  ${escapeHtml(tab.label)}
                </button>
              `;
            })
            .join("")}
        </nav>
      `;

  return `
    <section class="ww-shell">
      <header class="ww-toolbar">
        <div class="ww-toolbar-main">
          ${context.options.showTitle ? `<div><h1>${escapeHtml(context.locationLabel)} Weather</h1></div>` : ""}
          ${context.options.showRefreshButton ? `<button type="button" class="ww-button" data-action="refresh" aria-label="Refresh weather data" ${context.isRefreshing ? "disabled" : ""}>${context.isRefreshing ? "Refreshing\u2026" : "Refresh"}</button>` : ""}
        </div>
        ${locationSwitcher}
      </header>
      ${body}
    </section>
  `;
};
