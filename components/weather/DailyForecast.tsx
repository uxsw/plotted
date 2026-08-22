"use client";

import { WeatherIcon } from "./WeatherIcon";
import type { WeatherDaily } from "@/lib/weather";

function formatDay(dateStr: string, index: number): string {
  if (index === 0) return "Today";
  // Use noon to avoid any midnight DST edge cases
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "short" });
}

type Props = { daily: WeatherDaily };

export function DailyForecast({ daily }: Props) {
  return (
    <div className="px-4 py-3 border-t border-sand-line">
      <p className="font-sans text-xs text-ink-soft font-medium mb-2">5-day forecast</p>
      <div className="flex gap-1.5">
        {daily.time.map((date, i) => {
          const isToday = i === 0;
          return (
            <div
              key={date}
              className={[
                "flex-1 flex flex-col items-center gap-1.5 py-3 px-1",
                isToday
                  ? "bg-marigold"
                  : "border border-sand-line",
              ].join(" ")}
            >
              <span
                className={[
                  "font-sans text-[11px] font-medium leading-none",
                  isToday ? "text-marigold" : "text-ink-soft",
                ].join(" ")}
              >
                {formatDay(date, i)}
              </span>
              <WeatherIcon code={daily.weather_code[i]} size={20} />
              <span
                className={[
                  "font-sans text-sm font-medium leading-none",
                  isToday ? "text-marigold" : "text-ink",
                ].join(" ")}
              >
                {Math.round(daily.temperature_2m_max[i])}°
              </span>
              <span
                className={[
                  "font-sans text-xs leading-none",
                  isToday ? "text-marigold" : "text-ink-soft",
                ].join(" ")}
              >
                {Math.round(daily.temperature_2m_min[i])}°
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
