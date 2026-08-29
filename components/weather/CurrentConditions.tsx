"use client";

import { WeatherIcon, wmoLabel } from "./WeatherIcon";
import type { WeatherCurrent } from "@/lib/weather";

function windDirection(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

type Props = {
  current: WeatherCurrent;
  locationLabel: string;
  onChangeLocation: () => void;
};

export function CurrentConditions({ current, locationLabel, onChangeLocation }: Props) {
  return (
    <>
      {/* Location header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-sand-line">
        <span className="minion text-ink-soft truncate pr-2">{locationLabel}</span>
        <button
          type="button"
          onClick={onChangeLocation}
          className="minion text-marigold underline underline-offset-2 hover:text-marigold transition-colors duration-100 shrink-0"
        >
          Change
        </button>
      </div>

      {/* Temperature + icon */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex flex-col gap-1">
          <span className="o-type-display canon kirk">
            {Math.round(current.temperature_2m)}°
          </span>
          <span className="brevier text-ink">
            {wmoLabel(current.weather_code)}
          </span>
          <span className="minion text-ink-soft">
            Feels like {Math.round(current.apparent_temperature)}°
          </span>
        </div>
        <WeatherIcon code={current.weather_code} size={64} />
      </div>

      {/* Secondary stats */}
      <div className="flex gap-5 px-4 pb-4 minion text-ink-soft o-type-tabular">
        <span>{current.precipitation} mm rain</span>
        <span>{current.relative_humidity_2m}% humidity</span>
        <span>
          {Math.round(current.wind_speed_10m)} mph{" "}
          {windDirection(current.wind_direction_10m)}
        </span>
      </div>
    </>
  );
}
