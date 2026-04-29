import { createCacheKey, readCache, writeCache } from "./core/widgetCache";
import { buildRenderContext } from "./core/widgetContext";
import { DEFAULT_OPTIONS } from "./core/widgetDefaults";
import {
  createDefaultLayouts,
  renderErrorState,
  renderLoadingState,
  renderShell,
} from "./core/widgetRenderers";
import { preloadWeatherIcons } from "./icons";
import { deepMerge, resolveElement } from "./core/widgetUtils";
import type {
  LayoutRenderer,
  ResolvedWidgetOptions,
  WeatherPayload,
  WeatherProvider,
  WeatherWidgetOptions,
} from "./types";

const providers = new Map<string, WeatherProvider>();
const layouts = createDefaultLayouts();

const THEME_TOKEN_TO_CSS_VAR: Record<
  keyof NonNullable<ResolvedWidgetOptions["themeTokens"]>,
  string
> = {
  background: "--ww-background",
  surface: "--ww-surface",
  text: "--ww-text",
  mutedText: "--ww-muted",
  border: "--ww-border",
  accent: "--ww-accent",
  accentSoft: "--ww-accent-soft",
  radius: "--ww-radius",
  fontFamily: "--ww-font",
};

const clampIndex = (index: number, maxExclusive: number) => {
  if (maxExclusive <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(index, maxExclusive - 1));
};

const normalizeLocation = (location: ResolvedWidgetOptions["location"]) => {
  return {
    lat: Number(location.lat),
    lon: Number(location.lon),
    name: location.name?.trim() || undefined,
  };
};

const resolveOptions = (
  options: WeatherWidgetOptions | ResolvedWidgetOptions
): ResolvedWidgetOptions => {
  const merged = deepMerge(DEFAULT_OPTIONS, {
    ...options,
    modules: deepMerge(DEFAULT_OPTIONS.modules, options.modules ?? {}),
    icons: deepMerge(DEFAULT_OPTIONS.icons, options.icons ?? {}),
    cache: deepMerge(DEFAULT_OPTIONS.cache, options.cache ?? {}),
    hooks: deepMerge(DEFAULT_OPTIONS.hooks, options.hooks ?? {}),
    themeTokens: deepMerge(
      DEFAULT_OPTIONS.themeTokens,
      options.themeTokens ?? {}
    ),
  });

  const nextLocale = (options.locale ?? "").trim();
  merged.locale = nextLocale || undefined;

  const providedLocations = (options.locations ?? [])
    .filter(
      location => Number.isFinite(location.lat) && Number.isFinite(location.lon)
    )
    .map(location => normalizeLocation(location));

  if (providedLocations.length === 0) {
    const fallbackLocation = options.location ?? merged.location;
    providedLocations.push(normalizeLocation(fallbackLocation));
  }

  const requestedIndex = Math.floor(
    Number.isFinite(options.activeLocationIndex)
      ? Number(options.activeLocationIndex)
      : 0
  );
  const activeLocationIndex = clampIndex(
    requestedIndex,
    providedLocations.length
  );

  merged.locations = providedLocations;
  merged.activeLocationIndex = activeLocationIndex;
  merged.location = providedLocations[activeLocationIndex];

  return merged;
};

export const registerProvider = (name: string, provider: WeatherProvider) => {
  providers.set(name, provider);
};

export const registerLayout = (name: string, renderer: LayoutRenderer) => {
  layouts.set(name, renderer);
};

export class WeatherWidget {
  private options: ResolvedWidgetOptions;
  private root: Element | null = null;
  private abortController: AbortController | null = null;
  private refreshTimer: number | null = null;
  private data: WeatherPayload | null = null;
  private isRefreshing = false;
  private isFromCache = false;
  private mounted = false;

  constructor(options: WeatherWidgetOptions) {
    this.options = resolveOptions(options);
    this.handleRootClick = this.handleRootClick.bind(this);
  }

  mount(target: string | Element) {
    this.root = resolveElement(target);
    this.mounted = true;
    this.root.addEventListener("click", this.handleRootClick);
    this.applyContainerState();
    this.root.innerHTML = renderLoadingState();
    this.scheduleRefresh();
    void this.loadWeather(false);
  }

  async refresh() {
    await this.loadWeather(true);
  }

  unmount() {
    this.mounted = false;
    this.abortController?.abort();

    if (this.refreshTimer !== null) {
      window.clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.root) {
      this.root.removeEventListener("click", this.handleRootClick);
      this.root.innerHTML = "";
    }

    this.root = null;
  }

  setOptions(nextOptions: Partial<WeatherWidgetOptions>) {
    this.options = resolveOptions(
      deepMerge(this.options, nextOptions as Partial<ResolvedWidgetOptions>)
    );
    this.applyContainerState();
    this.scheduleRefresh();

    if (this.mounted) {
      void this.loadWeather(false);
    }
  }

  private applyContainerState() {
    if (!this.root) {
      return;
    }

    const host = this.root as HTMLElement;
    host.className = `weather-widget-root ww-theme-${this.options.theme} ww-density-${this.options.density}`;
    host.setAttribute("data-layout", this.options.layout);
    host.setAttribute(
      "data-location-index",
      String(this.options.activeLocationIndex)
    );

    for (const [tokenName, cssVarName] of Object.entries(
      THEME_TOKEN_TO_CSS_VAR
    ) as Array<[keyof typeof THEME_TOKEN_TO_CSS_VAR, string]>) {
      const value = this.options.themeTokens[tokenName];

      if (value === undefined || value === null || value === "") {
        host.style.removeProperty(cssVarName);
        continue;
      }

      host.style.setProperty(cssVarName, value);
    }
  }

  private resolveProvider() {
    if (typeof this.options.provider !== "string") {
      return this.options.provider;
    }

    const provider = providers.get(this.options.provider);
    if (!provider) {
      throw new Error(`Unknown provider: ${this.options.provider}`);
    }

    return provider;
  }

  private getFieldsRequested() {
    return {
      current: this.options.modules.current,
      detailFields: this.options.modules.details.enabled
        ? this.options.modules.details.fields
        : [],
      hourly: this.options.modules.hourly.enabled,
      hourlyHours: this.options.modules.hourly.hours,
      hourlyStepHours: this.options.modules.hourly.stepHours,
      daily: this.options.modules.daily.enabled,
      dailyDays: this.options.modules.daily.days,
    };
  }

  private scheduleRefresh() {
    if (typeof window === "undefined") {
      return;
    }

    if (this.refreshTimer !== null) {
      window.clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.options.refreshMinutes <= 0) {
      return;
    }

    this.refreshTimer = window.setInterval(() => {
      void this.loadWeather(true);
    }, this.options.refreshMinutes * 60_000);
  }

  private prefersReducedMotion() {
    return (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  private collectPayloadWeatherCodes(payload: WeatherPayload) {
    const codes: number[] = [];

    if (payload.current) {
      codes.push(payload.current.weatherCode);
    }

    for (const hourly of payload.hourly) {
      codes.push(hourly.weatherCode);
    }

    for (const daily of payload.daily) {
      codes.push(daily.weatherCode);
    }

    return [...new Set(codes)];
  }

  private async preloadIconsForPayload(payload: WeatherPayload) {
    await preloadWeatherIcons({
      codes: this.collectPayloadWeatherCodes(payload),
      style: this.options.icons.style,
      colorMode: this.options.icons.colorMode,
      reducedMotion: this.prefersReducedMotion(),
      pack: this.options.icons.pack,
    });
  }

  private render() {
    if (!this.root || !this.data) {
      return;
    }

    const renderer = layouts.get(this.options.layout) ?? layouts.get("card");
    if (!renderer) {
      return;
    }

    const context = buildRenderContext(
      this.data,
      this.options,
      this.isRefreshing,
      this.isFromCache
    );
    this.root.innerHTML = renderShell(context, renderer(context));
  }

  private async loadWeather(forceNetwork: boolean) {
    const provider = this.resolveProvider();
    const cacheKey = createCacheKey(this.options, provider.key);
    const cache = this.options.cache.enabled ? readCache(cacheKey) : null;
    const cacheExpired = cache ? cache.expiresAt <= Date.now() : true;

    if (cache && !forceNetwork) {
      await this.preloadIconsForPayload(cache.payload);
      this.data = cache.payload;
      this.isFromCache = true;
      this.render();

      if (!cacheExpired || !this.options.cache.staleWhileRevalidate) {
        return;
      }
    }

    if (!this.root) {
      return;
    }

    if (!this.data) {
      this.root.innerHTML = renderLoadingState();
    }

    this.abortController?.abort();
    this.abortController = new AbortController();
    this.isRefreshing = true;
    this.render();

    try {
      const payload = await provider.getWeather({
        lat: this.options.location.lat,
        lon: this.options.location.lon,
        units: this.options.units,
        signal: this.abortController.signal,
        apiKey: this.options.apiKey,
        locale: this.options.locale,
        fieldsRequested: this.getFieldsRequested(),
      });

      if (this.abortController.signal.aborted || !this.mounted) {
        return;
      }

      await this.preloadIconsForPayload(payload);

      this.data = payload;
      this.isFromCache = false;
      if (this.options.cache.enabled) {
        writeCache(cacheKey, payload, this.options.cache.ttlMinutes);
      }
      this.render();
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") {
        return;
      }

      if (this.options.debug) {
        console.error("WeatherWidget request failed", error);
      }
      this.options.onError?.(error);

      if (this.root && !this.data) {
        const message =
          error instanceof Error
            ? error.message
            : "Unexpected error while loading weather data.";
        this.root.innerHTML = renderErrorState(message);
      }
    } finally {
      this.isRefreshing = false;
      this.render();
    }
  }

  private switchLocation(nextIndex: number) {
    const safeIndex = clampIndex(nextIndex, this.options.locations.length);

    if (safeIndex === this.options.activeLocationIndex) {
      return;
    }

    this.options.activeLocationIndex = safeIndex;
    this.options.location = this.options.locations[safeIndex];
    this.isFromCache = false;
    this.data = null;
    this.abortController?.abort();

    if (this.root) {
      this.root.innerHTML = renderLoadingState();
    }

    void this.loadWeather(false);
  }

  private handleRootClick(event: Event) {
    const target = event.target as HTMLElement | null;
    const actionElement = target?.closest<HTMLElement>("[data-action]");
    const action = actionElement?.dataset.action;

    if (action === "refresh") {
      void this.refresh();
    }

    if (action === "switch-location") {
      const rawIndex = actionElement?.dataset.locationIndex;
      const parsedIndex = Number(rawIndex);

      if (Number.isInteger(parsedIndex)) {
        this.switchLocation(parsedIndex);
      }
    }
  }
}

export default WeatherWidget;
