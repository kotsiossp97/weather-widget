const WEATHER_CODE_MAP: Record<
  number,
  { day: string; night: string; kind: string }
> = {
  0: { day: "Clear sky", night: "Clear night", kind: "clear" },
  1: { day: "Mostly clear", night: "Mostly clear", kind: "partly-cloudy" },
  2: { day: "Partly cloudy", night: "Partly cloudy", kind: "partly-cloudy" },
  3: { day: "Overcast", night: "Overcast", kind: "cloudy" },
  45: { day: "Fog", night: "Fog", kind: "fog" },
  48: { day: "Depositing rime fog", night: "Depositing rime fog", kind: "fog" },
  51: { day: "Light drizzle", night: "Light drizzle", kind: "rain" },
  53: { day: "Drizzle", night: "Drizzle", kind: "rain" },
  55: { day: "Dense drizzle", night: "Dense drizzle", kind: "rain" },
  56: { day: "Freezing drizzle", night: "Freezing drizzle", kind: "snow" },
  57: {
    day: "Dense freezing drizzle",
    night: "Dense freezing drizzle",
    kind: "snow",
  },
  61: { day: "Light rain", night: "Light rain", kind: "rain" },
  63: { day: "Rain", night: "Rain", kind: "rain" },
  65: { day: "Heavy rain", night: "Heavy rain", kind: "rain" },
  66: { day: "Freezing rain", night: "Freezing rain", kind: "snow" },
  67: {
    day: "Heavy freezing rain",
    night: "Heavy freezing rain",
    kind: "snow",
  },
  71: { day: "Light snow", night: "Light snow", kind: "snow" },
  73: { day: "Snow", night: "Snow", kind: "snow" },
  75: { day: "Heavy snow", night: "Heavy snow", kind: "snow" },
  77: { day: "Snow grains", night: "Snow grains", kind: "snow" },
  80: { day: "Rain showers", night: "Rain showers", kind: "rain" },
  81: { day: "Rain showers", night: "Rain showers", kind: "rain" },
  82: {
    day: "Violent rain showers",
    night: "Violent rain showers",
    kind: "storm",
  },
  85: { day: "Snow showers", night: "Snow showers", kind: "snow" },
  86: { day: "Heavy snow showers", night: "Heavy snow showers", kind: "snow" },
  95: { day: "Thunderstorm", night: "Thunderstorm", kind: "storm" },
  96: {
    day: "Thunderstorm with hail",
    night: "Thunderstorm with hail",
    kind: "storm",
  },
  99: {
    day: "Thunderstorm with heavy hail",
    night: "Thunderstorm with heavy hail",
    kind: "storm",
  },
};

const FALLBACK = {
  day: "Weather update",
  night: "Weather update",
  kind: "cloudy",
};

export const describeWeatherCode = (code: number, isDay = true) => {
  const entry = WEATHER_CODE_MAP[code] ?? FALLBACK;
  return isDay ? entry.day : entry.night;
};

export const getWeatherKind = (code: number) => {
  return (WEATHER_CODE_MAP[code] ?? FALLBACK).kind;
};
