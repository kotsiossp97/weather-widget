interface WeatherCodeEntry {
  description: string;
  iconSlug: string;
}

interface WeatherCodeDesc {
  day: WeatherCodeEntry;
  night: WeatherCodeEntry;
}

const entry = (
  dayDescription: string,
  dayIconSlug: string,
  nightDescription = dayDescription,
  nightIconSlug = dayIconSlug
): WeatherCodeDesc => ({
  day: { description: dayDescription, iconSlug: dayIconSlug },
  night: { description: nightDescription, iconSlug: nightIconSlug },
});

const byRange = (
  start: number,
  end: number,
  descriptor: WeatherCodeDesc
): Array<[number, WeatherCodeDesc]> => {
  const codes: Array<[number, WeatherCodeDesc]> = [];
  for (let code = start; code <= end; code += 1) {
    codes.push([code, descriptor]);
  }
  return codes;
};

const WEATHER_CODE_MAP: Record<number, WeatherCodeDesc> = Object.fromEntries([
  ...byRange(0, 0, entry("Sunny", "clear-day", "Clear", "clear-night")),
  ...byRange(
    1,
    1,
    entry(
      "Mostly Sunny",
      "mostly-clear-day",
      "Mostly Clear",
      "mostly-clear-night"
    )
  ),
  ...byRange(
    2,
    2,
    entry(
      "Partly Cloudy",
      "partly-cloudy-day",
      "Partly Cloudy",
      "partly-cloudy-night"
    )
  ),
  ...byRange(3, 3, entry("Cloudy", "overcast-day", "Cloudy", "overcast-night")),

  ...byRange(4, 5, entry("Haze", "haze-day", "Haze", "haze-night")),
  ...byRange(
    6,
    8,
    entry("Dust in Air", "dust-day", "Dust in Air", "dust-night")
  ),
  ...byRange(
    9,
    9,
    entry("Duststorm Nearby", "dust-day", "Duststorm Nearby", "dust-night")
  ),

  ...byRange(10, 12, entry("Mist", "mist")),
  ...byRange(
    13,
    13,
    entry(
      "Distant Lightning",
      "thunderstorms-day",
      "Distant Lightning",
      "thunderstorms-night"
    )
  ),
  ...byRange(
    14,
    16,
    entry(
      "Precipitation Nearby",
      "overcast-day-rain",
      "Precipitation Nearby",
      "overcast-night-rain"
    )
  ),
  ...byRange(
    17,
    17,
    entry(
      "Thunderstorm",
      "thunderstorms-day",
      "Thunderstorm",
      "thunderstorms-night"
    )
  ),
  ...byRange(18, 18, entry("Squalls", "wind")),
  ...byRange(19, 19, entry("Funnel Clouds", "tornado")),

  ...byRange(
    20,
    20,
    entry(
      "Recent Drizzle",
      "overcast-day-drizzle",
      "Recent Drizzle",
      "overcast-night-drizzle"
    )
  ),
  ...byRange(
    21,
    22,
    entry(
      "Recent Rain",
      "overcast-day-rain",
      "Recent Rain",
      "overcast-night-rain"
    )
  ),
  ...byRange(
    23,
    23,
    entry(
      "Recent Mixed Precip",
      "overcast-day-sleet",
      "Recent Mixed Precip",
      "overcast-night-sleet"
    )
  ),
  ...byRange(
    24,
    24,
    entry(
      "Recent Freezing Rain",
      "overcast-day-sleet",
      "Recent Freezing Rain",
      "overcast-night-sleet"
    )
  ),
  ...byRange(
    25,
    27,
    entry(
      "Recent Showers",
      "overcast-day-rain",
      "Recent Showers",
      "overcast-night-rain"
    )
  ),
  ...byRange(
    28,
    28,
    entry("Recent Fog", "overcast-day-fog", "Recent Fog", "overcast-night-fog")
  ),
  ...byRange(
    29,
    29,
    entry(
      "Recent Thunderstorm",
      "thunderstorms-day",
      "Recent Thunderstorm",
      "thunderstorms-night"
    )
  ),

  ...byRange(
    30,
    35,
    entry("Dust or Sandstorm", "dust-day", "Dust or Sandstorm", "dust-night")
  ),
  ...byRange(
    36,
    39,
    entry(
      "Blowing Snow",
      "overcast-day-snow",
      "Blowing Snow",
      "overcast-night-snow"
    )
  ),

  ...byRange(
    40,
    49,
    entry("Fog", "overcast-day-fog", "Fog", "overcast-night-fog")
  ),

  ...byRange(
    50,
    55,
    entry(
      "Drizzle",
      "overcast-day-drizzle",
      "Drizzle",
      "overcast-night-drizzle"
    )
  ),
  ...byRange(
    56,
    57,
    entry(
      "Freezing Drizzle",
      "overcast-day-sleet",
      "Freezing Drizzle",
      "overcast-night-sleet"
    )
  ),
  ...byRange(
    58,
    59,
    entry(
      "Drizzle and Rain",
      "overcast-day-rain",
      "Drizzle and Rain",
      "overcast-night-rain"
    )
  ),

  ...byRange(
    60,
    65,
    entry("Rain", "overcast-day-rain", "Rain", "overcast-night-rain")
  ),
  ...byRange(
    66,
    67,
    entry(
      "Freezing Rain",
      "overcast-day-sleet",
      "Freezing Rain",
      "overcast-night-sleet"
    )
  ),
  ...byRange(
    68,
    69,
    entry(
      "Rain and Snow",
      "overcast-day-sleet",
      "Rain and Snow",
      "overcast-night-sleet"
    )
  ),

  ...byRange(
    70,
    76,
    entry("Snow", "overcast-day-snow", "Snow", "overcast-night-snow")
  ),
  ...byRange(
    77,
    79,
    entry(
      "Ice Pellets",
      "overcast-day-hail",
      "Ice Pellets",
      "overcast-night-hail"
    )
  ),

  ...byRange(
    80,
    82,
    entry(
      "Rain Showers",
      "overcast-day-rain",
      "Rain Showers",
      "overcast-night-rain"
    )
  ),
  ...byRange(
    83,
    84,
    entry(
      "Mixed Showers",
      "overcast-day-sleet",
      "Mixed Showers",
      "overcast-night-sleet"
    )
  ),
  ...byRange(
    85,
    86,
    entry(
      "Snow Showers",
      "overcast-day-snow",
      "Snow Showers",
      "overcast-night-snow"
    )
  ),
  ...byRange(
    87,
    90,
    entry(
      "Hail Showers",
      "overcast-day-hail",
      "Hail Showers",
      "overcast-night-hail"
    )
  ),

  ...byRange(
    91,
    94,
    entry(
      "Thunderstorm with Precip",
      "thunderstorms-day-rain",
      "Thunderstorm with Precip",
      "thunderstorms-night-rain"
    )
  ),
  ...byRange(
    95,
    95,
    entry(
      "Thunderstorm",
      "thunderstorms-day",
      "Thunderstorm",
      "thunderstorms-night"
    )
  ),
  ...byRange(
    96,
    96,
    entry(
      "Thunderstorm with Hail",
      "thunderstorms-day-hail",
      "Thunderstorm with Hail",
      "thunderstorms-night-hail"
    )
  ),
  ...byRange(
    97,
    97,
    entry(
      "Strong Thunderstorm",
      "thunderstorms-extreme-day",
      "Strong Thunderstorm",
      "thunderstorms-extreme-night"
    )
  ),
  ...byRange(
    98,
    98,
    entry(
      "Thunderstorm with Dust",
      "thunderstorms-extreme-day",
      "Thunderstorm with Dust",
      "thunderstorms-extreme-night"
    )
  ),
  ...byRange(
    99,
    99,
    entry(
      "Severe Thunderstorm with Hail",
      "thunderstorms-extreme-day-hail",
      "Severe Thunderstorm with Hail",
      "thunderstorms-extreme-night-hail"
    )
  ),
]);

const FALLBACK: WeatherCodeDesc = {
  day: { description: "Weather update", iconSlug: "not-available" },
  night: { description: "Weather update", iconSlug: "not-available" },
};

export const describeWeatherCode = (code: number, isDay = true) => {
  const entry = WEATHER_CODE_MAP[code] ?? FALLBACK;
  return isDay ? entry.day : entry.night;
};
