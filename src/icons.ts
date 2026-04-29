import type { IconColorMode, IconPackResolver, IconStyle } from "./types";
import { escapeHtml } from "./core/widgetUtils";
import {
  animatedColoredLoaders,
  animatedThemedLoaders,
  staticColoredLoaders,
  staticThemedLoaders,
  SUPPORTED_METEOCON_SLUGS_SET,
} from "./generated/meteoconLoaders";
import type {
  MeteoconIconLoader,
  MeteoconLoaderMap,
} from "./generated/meteoconLoaders";
import { describeWeatherCode } from "./weatherCodes";

let inlineSvgInstanceCounter = 0;

const buildSlugLoaderIndex = (loaders: MeteoconLoaderMap) => {
  const index = new Map<string, MeteoconIconLoader>();

  for (const [filePath, loader] of Object.entries(loaders)) {
    const slug = filePath
      .split("/")
      .pop()
      ?.replace(/\.svg$/i, "")
      .toLowerCase();

    if (!slug) {
      continue;
    }

    index.set(slug, loader);
  }

  return index;
};

const LOADER_INDEX: Record<
  IconStyle,
  Record<IconColorMode, Map<string, MeteoconIconLoader>>
> = {
  animated: {
    colored: buildSlugLoaderIndex(animatedColoredLoaders),
    themed: buildSlugLoaderIndex(animatedThemedLoaders),
  },
  static: {
    colored: buildSlugLoaderIndex(staticColoredLoaders),
    themed: buildSlugLoaderIndex(staticThemedLoaders),
  },
};

const ICON_ASSET_CACHE = new Map<string, string>();
const ICON_ASSET_PENDING = new Map<string, Promise<string | undefined>>();

const getAssetCacheKey = (
  style: IconStyle,
  colorMode: IconColorMode,
  iconSlug: string
) => {
  return `${style}|${colorMode}|${iconSlug.toLowerCase()}`;
};

const getDefaultIconCandidates = (code: number, isDay: boolean) => {
  const preferred = describeWeatherCode(code, isDay).iconSlug.toLowerCase();
  const dayNightFallback = isDay ? "overcast-day" : "overcast-night";
  const candidates = [preferred, dayNightFallback, "overcast", "cloudy"];
  return [...new Set(candidates)].filter(candidate => {
    return SUPPORTED_METEOCON_SLUGS_SET.has(candidate);
  });
};

const loadDefaultIconAsset = async (input: {
  style: IconStyle;
  colorMode: IconColorMode;
  iconSlug: string;
}) => {
  const cacheKey = getAssetCacheKey(
    input.style,
    input.colorMode,
    input.iconSlug
  );
  const cached = ICON_ASSET_CACHE.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const pending = ICON_ASSET_PENDING.get(cacheKey);
  if (pending) {
    return pending;
  }

  const loader = LOADER_INDEX[input.style][input.colorMode].get(
    input.iconSlug.toLowerCase()
  );
  if (!loader) {
    return undefined;
  }

  const loading = loader()
    .then(value => {
      ICON_ASSET_CACHE.set(cacheKey, value);
      return value;
    })
    .catch(() => {
      return undefined;
    })
    .finally(() => {
      ICON_ASSET_PENDING.delete(cacheKey);
    });

  ICON_ASSET_PENDING.set(cacheKey, loading);
  return loading;
};

const readCachedDefaultIconAsset = (
  style: IconStyle,
  colorMode: IconColorMode,
  iconSlug: string
) => {
  return ICON_ASSET_CACHE.get(getAssetCacheKey(style, colorMode, iconSlug));
};

export const preloadWeatherIcons = async (input: {
  codes: number[];
  style: IconStyle;
  colorMode: IconColorMode;
  reducedMotion: boolean;
  pack?: string;
}) => {
  if ((input.pack ?? "default") !== "default") {
    return;
  }

  const style = input.reducedMotion ? "static" : input.style;
  const slugs = new Set<string>();

  for (const code of input.codes) {
    for (const isDay of [true, false]) {
      const candidates = getDefaultIconCandidates(code, isDay);
      for (const slug of candidates) {
        slugs.add(slug);
      }
    }
  }

  await Promise.all(
    [...slugs].map(async iconSlug => {
      await loadDefaultIconAsset({
        style,
        colorMode: input.colorMode,
        iconSlug,
      });
    })
  );
};

const escapeRegex = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const namespaceSvgIds = (svgContent: string, namespace: string) => {
  const ids = [...svgContent.matchAll(/\bid=("([^"]+)"|'([^']+)')/g)]
    .map(match => match[2] ?? match[3] ?? "")
    .filter(Boolean);

  if (ids.length === 0) {
    return svgContent;
  }

  let output = svgContent;

  for (const originalId of ids) {
    const escapedId = escapeRegex(originalId);
    const namespacedId = `${namespace}-${originalId}`;

    output = output.replace(
      new RegExp(`\\bid=("|')${escapedId}("|')`, "g"),
      `id="${namespacedId}"`
    );

    output = output.replace(
      new RegExp(`\\b(xlink:href|href)=("|')#${escapedId}("|')`, "g"),
      (_, attrName: string) => `${attrName}="#${namespacedId}"`
    );

    output = output.replace(
      new RegExp(`url\\(#${escapedId}\\)`, "g"),
      `url(#${namespacedId})`
    );
  }

  return output;
};

const wrapInlineSvg = (
  label: string,
  size: number,
  svgContent: string,
  colorMode: IconColorMode
) => {
  const escapedLabel = escapeHtml(label);
  const namespacedSvg = namespaceSvgIds(
    svgContent,
    `wwi${inlineSvgInstanceCounter++}`
  );
  const isColored = colorMode === "colored";
  const wrapperClass = isColored
    ? "ww-icon ww-icon-colored"
    : "ww-icon ww-icon-themed";
  const svgClassSuffix = isColored
    ? "ww-icon-svg-colored"
    : "ww-icon-svg-themed";
  const renderedSvg = namespacedSvg.replace(
    /<svg\b([^>]*)>/i,
    (_, rawAttrs) => {
      const attrs = String(rawAttrs ?? "");
      const existingClassMatch = attrs.match(
        /\sclass=("([^"]*)"|'([^']*)'|([^\s>]+))/i
      );
      const existingClasses = (
        existingClassMatch?.[2] ??
        existingClassMatch?.[3] ??
        existingClassMatch?.[4] ??
        ""
      ).trim();

      const cleanedAttrs = attrs.replace(
        /\s(?:class|width|height|role|aria-label|aria-hidden|focusable)=("[^"]*"|'[^']*'|[^\s>]+)/gi,
        ""
      );

      const classAttr = [existingClasses, "ww-icon-svg", svgClassSuffix]
        .filter(Boolean)
        .join(" ");

      return `<svg${cleanedAttrs} class="${classAttr}" width="${size}" height="${size}" aria-hidden="true" focusable="false">`;
    }
  );

  return `<div class="${wrapperClass}" style="width:${size}px;height:${size}px" role="img" aria-label="${escapedLabel}">${renderedSvg}</div>`;
};

const wrapIconImage = (label: string, size: number, src: string) => {
  return `<img class="ww-icon ww-icon-colored" src="${escapeHtml(src)}" width="${size}" height="${size}" alt="${escapeHtml(label)}" decoding="async" draggable="false" />`;
};

const resolveDefaultIconMarkup = (input: {
  code: number;
  isDay: boolean;
  label: string;
  size: number;
  style: IconStyle;
  colorMode: IconColorMode;
}) => {
  const candidates = getDefaultIconCandidates(input.code, input.isDay);

  for (const iconSlug of candidates) {
    const cachedAsset = readCachedDefaultIconAsset(
      input.style,
      input.colorMode,
      iconSlug
    );
    if (!cachedAsset) {
      continue;
    }

    if (input.colorMode === "themed") {
      return wrapInlineSvg(
        input.label,
        input.size,
        cachedAsset,
        input.colorMode
      );
    }

    return wrapIconImage(input.label, input.size, cachedAsset);
  }

  return "";
};

const createBundledPack = (style: IconStyle): IconPackResolver => {
  return ({ code, isDay, label, size, colorMode }) => {
    return resolveDefaultIconMarkup({
      code,
      isDay,
      label,
      size,
      style,
      colorMode,
    });
  };
};

const staticPack = createBundledPack("static");

const animatedPack = createBundledPack("animated");

const iconPacks = new Map<
  string,
  { static: IconPackResolver; animated: IconPackResolver }
>([["default", { static: staticPack, animated: animatedPack }]]);

export const registerIconPack = (
  name: string,
  resolver: { static: IconPackResolver; animated: IconPackResolver }
) => {
  iconPacks.set(name, resolver);
};

export const resolveWeatherIcon = (input: {
  code: number;
  isDay?: boolean;
  label: string;
  size: number;
  style: IconStyle;
  colorMode: IconColorMode;
  pack?: string;
  reducedMotion: boolean;
}) => {
  // Fire-and-forget hydration in case preload was skipped by host integration.
  const packageSlug = describeWeatherCode(
    input.code,
    input.isDay ?? true
  ).iconSlug;
  void loadDefaultIconAsset({
    style: input.reducedMotion ? "static" : input.style,
    colorMode: input.colorMode,
    iconSlug: packageSlug,
  });

  const pack =
    iconPacks.get(input.pack ?? "default") ?? iconPacks.get("default");
  const preferredStyle = input.reducedMotion ? "static" : input.style;
  const resolver = pack?.[preferredStyle] ?? pack?.static ?? staticPack;

  return resolver({
    code: input.code,
    isDay: input.isDay ?? true,
    label: input.label,
    size: input.size,
    style: preferredStyle,
    colorMode: input.colorMode,
  });
};
