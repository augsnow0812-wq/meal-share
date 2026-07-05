import { addWeeks, endOfWeek, format, startOfWeek } from "date-fns";

export type WeekRange = {
  start: Date;
  end: Date;
  label: string;
  key: string;
};

export function getWeekRange(offset: number = 0): WeekRange {
  const base = addWeeks(new Date(), offset);
  const start = startOfWeek(base, { weekStartsOn: 1 });
  const end = endOfWeek(base, { weekStartsOn: 1 });
  return {
    start,
    end,
    label: `${format(start, "yyyy-MM-dd")} ~ ${format(end, "MM-dd")}`,
    key: format(start, "yyyy-MM-dd"),
  };
}

export const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;

export function weekdayIndex(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 6 : d - 1;
}
