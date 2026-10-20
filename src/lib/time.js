// ---- Peak hours logic (minutes since midnight) ----
export const m = (h, min = 0) => h * 60 + min;
export const WEEKEND_PEAK = [[m(14), m(19)]];                      // 2:00 PM - 7:00 PM
export const WEEKDAY_PEAK = [[m(11, 30), m(14)], [m(17), m(20)]];  // 11:30 AM - 2:00 PM, 5:00 PM - 8:00 PM

export const isPeak = (day, minutes) =>
  (day === "weekend" ? WEEKEND_PEAK : WEEKDAY_PEAK).some(([s, e]) => minutes >= s && minutes < e);

export const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const min = String(minutes % 60).padStart(2, "0");
  return `${h % 12 === 0 ? 12 : h % 12}:${min} ${h >= 12 ? "PM" : "AM"}`;
};

// ---- Mall hours: 10:00 AM (600) to 10:00 PM (1320) ----
export const OPEN = m(10);
export const CLOSE = m(22);
export const HOURS = Array.from({ length: 13 }, (_, i) => 10 + i);
export const hourLabel = (h) => (h === 10 ? "10AM" : h === 13 ? "1PM" : h === 22 ? "10PM" : String(h > 12 ? h - 12 : h));
export const pct = (minutes) => ((minutes - OPEN) / (CLOSE - OPEN)) * 100;

// [left %, width %] of each peak band on the timeline
export const peakBands = (day) =>
  (day === "weekend" ? WEEKEND_PEAK : WEEKDAY_PEAK).map(([s, e]) => [pct(s), pct(e) - pct(s)]);
