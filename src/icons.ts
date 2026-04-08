import type { IconColorMode, IconPackResolver, IconStyle } from "./types";
import { escapeHtml } from "./core/widgetUtils";
import { getWeatherKind } from "./weatherCodes";

const importedIconAssets = import.meta.glob("./icons/**/*.svg", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const importedRawIconAssets = import.meta.glob("./icons/**/*.svg", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const iconAssetFallbackKind = "cloudy";
let inlineSvgInstanceCounter = 0;

const WEATHER_KIND_ALIASES: Record<string, string[]> = {
  clear: ["clear"],
  "partly-cloudy": ["partly-cloudy"],
  cloudy: ["cloudy", "overcast"],
  fog: ["fog", "mist"],
  rain: ["rain", "drizzle"],
  snow: ["snow", "sleet"],
  storm: ["thunderstorms", "storm"],
};

const rawIconAssetMap = new Map<string, string>(
  Object.entries(importedRawIconAssets).map(([path, svg]) => {
    const normalized = path
      .replace(/^\.\/icons\//, "")
      .replace(/\.svg$/i, "")
      .toLowerCase();
    return [normalized, svg];
  })
);

const iconAssetMap = new Map<string, string>(
  Object.entries(importedIconAssets).map(([path, url]) => {
    const normalized = path
      .replace(/^\.\/icons\//, "")
      .replace(/\.svg$/i, "")
      .toLowerCase();
    return [normalized, url];
  })
);

const getBundledSvgKey = (input: {
  kind: string;
  isDay: boolean;
  style: IconStyle;
  colorMode: IconColorMode;
}) => {
  const daySuffix = input.isDay ? "-day" : "-night";
  const kindAliases = WEATHER_KIND_ALIASES[input.kind] ?? [input.kind];
  const fallbackAliases = WEATHER_KIND_ALIASES[iconAssetFallbackKind] ?? [
    iconAssetFallbackKind,
  ];

  const styleCandidates = [input.style, "static"];
  const modeCandidates: IconColorMode[] = [input.colorMode, "themed"];

  const candidates: string[] = [];

  for (const mode of modeCandidates) {
    for (const style of styleCandidates) {
      for (const alias of kindAliases) {
        candidates.push(`${mode}/${style}/${alias}${daySuffix}`);
        candidates.push(`${mode}/${style}/${alias}`);
      }

      for (const fallbackAlias of fallbackAliases) {
        candidates.push(`${mode}/${style}/${fallbackAlias}${daySuffix}`);
        candidates.push(`${mode}/${style}/${fallbackAlias}`);
      }
    }

    for (const alias of kindAliases) {
      candidates.push(`${mode}/${alias}${daySuffix}`);
      candidates.push(`${mode}/${alias}`);
    }
  }

  const dedupedCandidates = [...new Set(candidates)];

  for (const key of dedupedCandidates) {
    if (iconAssetMap.has(key)) {
      return key;
    }
  }

  return undefined;
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

const createBundledPack = (style: IconStyle): IconPackResolver => {
  return ({ code, isDay, label, size, colorMode }) => {
    const kind = getWeatherKind(code);
    const bundledSvgKey = getBundledSvgKey({ kind, isDay, style, colorMode });

    if (!bundledSvgKey) {
      return "";
    }

    if (colorMode === "themed") {
      const rawSvg = rawIconAssetMap.get(bundledSvgKey);
      if (rawSvg) {
        return wrapInlineSvg(label, size, rawSvg, colorMode);
      }
    }

    const bundledSvgUrl = iconAssetMap.get(bundledSvgKey);
    if (!bundledSvgUrl) {
      return "";
    }

    return wrapIconImage(label, size, bundledSvgUrl);
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
