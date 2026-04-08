import type {
  WeatherPayload,
  WeatherProvider,
  WeatherProviderRequest,
} from "../types";
import { describeWeatherCode } from "../weatherCodes";

const API_URL = "https://api.open-meteo.com/v1/forecast";

const toUtcIsoString = (value: string | undefined, fallback: string) => {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  const hasExplicitZone = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed);

  if (hasExplicitZone) {
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00.000Z`;
  }

  const date = new Date(`${trimmed}Z`);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
};

const getForecastDays = (request: WeatherProviderRequest) => {
  const dailyDays = request.fieldsRequested.daily
    ? request.fieldsRequested.dailyDays + 1
    : 0;
  const hourlyDays = request.fieldsRequested.hourly
    ? Math.ceil(request.fieldsRequested.hourlyHours / 24)
    : 0;

  return Math.max(2, dailyDays, hourlyDays);
};

const buildCurrentFields = () => {
  return [
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "wind_speed_10m",
    "precipitation",
    "uv_index",
    "shortwave_radiation",
    "cloud_cover",
    "weather_code",
    "is_day",
  ];
};

const buildHourlyFields = (request: WeatherProviderRequest) => {
  if (!request.fieldsRequested.hourly) {
    return [];
  }

  return [
    "temperature_2m",
    "apparent_temperature",
    "wind_speed_10m",
    "precipitation_probability",
    "uv_index",
    "shortwave_radiation",
    "cloud_cover",
    "weather_code",
  ];
};

const buildDailyFields = (request: WeatherProviderRequest) => {
  if (
    !request.fieldsRequested.daily &&
    !request.fieldsRequested.detailFields.some(
      field => field === "sunrise" || field === "sunset"
    )
  ) {
    return [];
  }

  return [
    "weather_code",
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_probability_max",
    "sunrise",
    "sunset",
  ];
};

const normalizeHourly = (json: Record<string, unknown>) => {
  const hourly = (json.hourly ?? {}) as Record<string, Array<number | string>>;
  const times = (hourly.time ?? []) as string[];
  const temperatures = (hourly.temperature_2m ?? []) as number[];
  const apparent = (hourly.apparent_temperature ?? []) as number[];
  const wind = (hourly.wind_speed_10m ?? []) as number[];
  const precipitation = (hourly.precipitation_probability ?? []) as number[];
  const uvIndex = (hourly.uv_index ?? []) as number[];
  const shortwaveRadiation = (hourly.shortwave_radiation ?? []) as number[];
  const cloudCover = (hourly.cloud_cover ?? []) as number[];
  const weatherCodes = (hourly.weather_code ?? []) as number[];

  return times.map((time, index) => ({
    time: toUtcIsoString(time, new Date().toISOString()),
    temperature: temperatures[index],
    feelsLike: apparent[index],
    windSpeed: wind[index],
    precipitationProbability: precipitation[index],
    uvIndex: uvIndex[index],
    shortwaveRadiation: shortwaveRadiation[index],
    cloudCover: cloudCover[index],
    weatherCode: weatherCodes[index],
    summary: describeWeatherCode(weatherCodes[index], true),
  }));
};

const normalizeDaily = (json: Record<string, unknown>) => {
  const daily = (json.daily ?? {}) as Record<string, Array<number | string>>;
  const dates = (daily.time ?? []) as string[];
  const highs = (daily.temperature_2m_max ?? []) as number[];
  const lows = (daily.temperature_2m_min ?? []) as number[];
  const precipitation = (daily.precipitation_probability_max ?? []) as number[];
  const weatherCodes = (daily.weather_code ?? []) as number[];
  const sunrise = (daily.sunrise ?? []) as string[];
  const sunset = (daily.sunset ?? []) as string[];

  return dates.map((date, index) => ({
    date,
    temperatureMax: highs[index],
    temperatureMin: lows[index],
    precipitationProbability: precipitation[index],
    weatherCode: weatherCodes[index],
    summary: describeWeatherCode(weatherCodes[index], true),
    sunrise: toUtcIsoString(sunrise[index], `${date}T06:00:00.000Z`),
    sunset: toUtcIsoString(sunset[index], `${date}T18:00:00.000Z`),
  }));
};

export const openMeteoProvider: WeatherProvider = {
  key: "open-meteo",
  async getWeather(request) {
    const params = new URLSearchParams({
      latitude: String(request.lat),
      longitude: String(request.lon),
      timezone: "UTC",
      temperature_unit: request.units === "metric" ? "celsius" : "fahrenheit",
      wind_speed_unit: request.units === "metric" ? "kmh" : "mph",
      precipitation_unit: request.units === "metric" ? "mm" : "inch",
      current: buildCurrentFields().join(","),
      forecast_days: String(getForecastDays(request)),
    });

    const hourlyFields = buildHourlyFields(request);
    if (hourlyFields.length > 0) {
      params.set("hourly", hourlyFields.join(","));
    }

    const dailyFields = buildDailyFields(request);
    if (dailyFields.length > 0) {
      params.set("daily", dailyFields.join(","));
    }

    const response = await fetch(`${API_URL}?${params.toString()}`, {
      signal: request.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Open-Meteo request failed with status ${response.status}`
      );
    }

    const json = (await response.json()) as Record<string, unknown>;
    const current = json.current as Record<string, number | string> | undefined;
    const isDay = Number(current?.is_day ?? 1) === 1;
    const currentCode = Number(current?.weather_code ?? 0);

    return {
      provider: "open-meteo",
      timezone: "UTC",
      updatedAt: new Date().toISOString(),
      current: current
        ? {
            time: toUtcIsoString(
              typeof current.time === "string" ? current.time : undefined,
              new Date().toISOString()
            ),
            temperature: Number(current.temperature_2m ?? 0),
            feelsLike: Number(current.apparent_temperature ?? 0),
            humidity: Number(current.relative_humidity_2m ?? 0),
            windSpeed: Number(current.wind_speed_10m ?? 0),
            precipitation: Number(current.precipitation ?? 0),
            uvIndex: Number(current.uv_index ?? 0),
            shortwaveRadiation: Number(current.shortwave_radiation ?? 0),
            cloudCover: Number(current.cloud_cover ?? 0),
            weatherCode: currentCode,
            summary: describeWeatherCode(currentCode, isDay),
            isDay,
          }
        : undefined,
      hourly: normalizeHourly(json),
      daily: normalizeDaily(json),
      units: {
        temperature: request.units === "metric" ? "C" : "F",
        windSpeed: request.units === "metric" ? "km/h" : "mph",
        precipitation: request.units === "metric" ? "mm" : "in",
      },
    } satisfies WeatherPayload;
  },
};

export default openMeteoProvider;
