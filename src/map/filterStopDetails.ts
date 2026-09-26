import { DateTime } from "luxon";
import type { StopInfoBus } from "./types";

interface DateRange {
  from: DateTime;
  to: DateTime;
}

export const easterSunday = (year: number): DateTime => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return DateTime.local(year, month, day);
};

export const movableHolidays = (year: number): DateTime[] => {
  const easter = easterSunday(year);

  return [
    easter.minus({ days: 2 }), // Wielki Piątek
    easter.minus({ days: 1 }),
    easter, // Niedziela Wielkanocna
    easter.plus({ days: 1 }), // Poniedziałek Wielkanocny
    easter.plus({ days: 49 }), // Zielone Świątki
    easter.plus({ days: 60 }), // Boże Ciało
  ];
};

export const fixedHolidays = (year: number): DateTime[] => [
  DateTime.local(year, 1, 1),
  DateTime.local(year, 1, 6),
  DateTime.local(year, 5, 1),
  DateTime.local(year, 5, 3),
  DateTime.local(year, 8, 15),
  DateTime.local(year, 11, 1),
  DateTime.local(year, 12, 25),
  DateTime.local(year, 12, 26),
];

export const holidaysForYear = (year: number): DateTime[] => [
  ...fixedHolidays(year),
  ...movableHolidays(year),
];

const holidaysCache: Record<number, DateTime[]> = {};

const holidaysForYearCached = (year: number) => {
  if (!holidaysCache[year]) {
    holidaysCache[year] = holidaysForYear(year).map((d) => d.startOf("day"));
  }
  return holidaysCache[year];
};

export const isHoliday = (date: DateTime): boolean =>
  holidaysForYearCached(date.year).some((h) => h.hasSame(date, "day"));

export const getSummerBreakStart = (year: number): DateTime => {
  let date = DateTime.local(year, 6, 30);
  while (date.weekday !== 5) {
    date = date.minus({ days: 1 });
  }
  return date.plus({ days: 1 });
};

const winterBreakByYear: Record<number, DateTime> = {
  2025: DateTime.local(2025, 2, 3),
  2026: DateTime.local(2026, 2, 2),
  2027: DateTime.local(2027, 1, 18),
};

export const getWinterBreakStart = (year: number): DateTime => {
  const date = winterBreakByYear[year];
  if (!date) {
    throw new Error(`Brak ferii zimowych dla roku ${year}`);
  }
  return date;
};

export const getChristmasBreakStart = (year: number): DateTime => {
  return DateTime.local(year, 12, 24).startOf("week");
};

const SchoolBreaks = (year: number): DateRange[] => {
  const summerBreakStart = getSummerBreakStart(year);

  const summerBreak = {
    from: summerBreakStart,
    to: DateTime.local(year, 8, 31),
  };

  const winterBreakStart = getWinterBreakStart(year);

  const winterBreak = {
    from: winterBreakStart,
    to: winterBreakStart.plus({ days: 13 }),
  };

  const christmasBreakStart = getChristmasBreakStart(year);

  const christmasBreak = {
    from: christmasBreakStart,
    to: DateTime.local(year, 12, 31),
  };

  return [summerBreak, winterBreak, christmasBreak];
};

const isFreeFromSchool = (date: DateTime): boolean => {
  const isSchoolBreak = SchoolBreaks(date.year).some(
    (r) => date >= r.from.startOf("day") && date <= r.to.endOf("day"),
  );

  const localEasterSunday = easterSunday(date.year);

  const daysFreeFromSchool: DateTime[] = [
    localEasterSunday.minus({ days: 3 }),
    localEasterSunday.plus({ days: 2 }),
  ];

  const dayFreeFromSchool = daysFreeFromSchool.some((d) =>
    date.hasSame(d, "day"),
  );

  return isSchoolBreak || dayFreeFromSchool;
};

const matchesOperatingDay = (
  bus: StopInfoBus,
  date: DateTime,
  holiday: boolean,
): boolean => {
  if (holiday || date.weekday === 7) {
    return bus.operating_days === "sunday";
  }

  if (date.weekday === 6) {
    return bus.operating_days === "saturday";
  }

  return bus.operating_days === "mon_fri";
};

const matchesSchoolRestriction = (
  bus: StopInfoBus,
  date: DateTime,
): boolean => {
  const schoolDay = !isFreeFromSchool(date);

  if (bus.school_restriction === "school_only") return schoolDay;
  if (bus.school_restriction === "free_day_only") return !schoolDay;

  return true;
};

const busDateTime = (bus: StopInfoBus, date: DateTime): DateTime | null => {
  const t = DateTime.fromFormat(bus.time.trim(), "HH:mm", {
    zone: date.zone,
  });

  if (!t.isValid) return null;

  return t.set({
    year: date.year,
    month: date.month,
    day: date.day,
    second: 0,
    millisecond: 0,
  });
};

export function filterBusForDay(
  date: DateTime,
  buses: StopInfoBus[],
  today: boolean = false,
): StopInfoBus[] {
  return buses
    .map((bus) => {
      if (!matchesOperatingDay(bus, date, isHoliday(date))) return null;
      if (!matchesSchoolRestriction(bus, date)) return null;

      const dt = busDateTime(bus, date);
      if (!dt) return null;

      if (today && dt < date) return null;
      return { bus, dt };
    })
    .filter(Boolean)
    .sort((a, b) => a?.dt?.toMillis() - b?.dt?.toMillis())
    .map((e) => e?.bus);
}

export default function filterStopDetails(
  buses: StopInfoBus[],
  limit = 15,
): StopInfoBus[] {
  const now = DateTime.now();

  const today = filterBusForDay(now, buses, true);

  if (today.length >= limit) {
    return today.slice(0, limit);
  }

  const tomorrow = filterBusForDay(now.plus({ days: 1 }), buses);

  return [...today, ...tomorrow].slice(0, limit);
}
