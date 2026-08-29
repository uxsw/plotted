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
      <p className="minion text-ink-soft o-type-weight--medium mb-2">5-day forecast</p>
      <div className="flex gap-1.5">
        {daily.time.map((date, i) => {
          const isToday = i === 0;
          return (
            <div
              key={date}
              className={[
                "flex-1 flex flex-col items-center gap-1.5 py-3 px-1 border",
                isToday ? "border-marigold" : "border-sand-line",
              ].join(" ")}
            >
              <span
                className={[
                  "minion o-type-leading--none",
                  isToday ? "text-ink kirk" : "text-ink-soft o-type-weight--medium",
                ].join(" ")}
              >
                {formatDay(date, i)}
              </span>
              <WeatherIcon code={daily.weather_code[i]} size={20} />
              <span className="brevier o-type-weight--medium o-type-leading--none text-ink o-type-tabular">
                {Math.round(daily.temperature_2m_max[i])}°
              </span>
              <span className="minion o-type-leading--none text-ink-soft o-type-tabular">
                {Math.round(daily.temperature_2m_min[i])}°
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
