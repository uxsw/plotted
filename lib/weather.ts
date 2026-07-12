export type WeatherCurrent = {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  precipitation: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  weather_code: number;
};

export type WeatherHourly = {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  precipitation: number[];
};

export type WeatherDaily = {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  weather_code: number[];
};

export type WeatherForecastData = {
  latitude: number;
  longitude: number;
  timezone: string;
  current: WeatherCurrent;
  hourly: WeatherHourly;
  daily: WeatherDaily;
};

// Round to 2dp so minor coordinate jitter doesn't bust the cache.
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function fetchForecast(
  latitude: number,
  longitude: number
): Promise<WeatherForecastData> {
  const lat = round2(latitude);
  const lng = round2(longitude);

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code"
  );
  url.searchParams.set(
    "hourly",
    "temperature_2m,precipitation_probability,precipitation"
  );
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code"
  );
  url.searchParams.set("forecast_days", "5");
  url.searchParams.set("wind_speed_unit", "mph");
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url.toString(), {
    next: { revalidate: 7200 }, // 2-hour cache — URL encodes rounded lat/lng as the key
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo error: ${res.status}`);
  }

  return res.json();
}
