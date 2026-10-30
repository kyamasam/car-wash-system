export type DatePreset = "today" | "yesterday" | "this_week" | "this_month" | "custom";
export type ReportGranularity = "day" | "week" | "month";

export interface ReportFilters {
  preset: DatePreset;
  startDate: string;
  endDate: string;
  branch?: string;
  granularity: ReportGranularity;
  workerId?: string;
}

function toIso(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function resolvePreset(preset: DatePreset): { startDate: string; endDate: string } {
  const today = new Date();
  const todayStr = toIso(today);

  if (preset === "today") {
    return { startDate: todayStr, endDate: todayStr };
  }

  if (preset === "yesterday") {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    const s = toIso(y);
    return { startDate: s, endDate: s };
  }

  if (preset === "this_week") {
    const day = today.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday = start
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    return { startDate: toIso(monday), endDate: todayStr };
  }

  if (preset === "this_month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: toIso(start), endDate: todayStr };
  }

  // custom — caller manages startDate/endDate directly
  return { startDate: todayStr, endDate: todayStr };
}

export const defaultFilters: ReportFilters = {
  preset: "this_month",
  ...resolvePreset("this_month"),
  granularity: "day",
};

/** Granularities that produce more than one bucket for the given range. */
export function allowedGranularities(startDate: string, endDate: string): ReportGranularity[] {
  const days =
    (new Date(endDate + "T00:00:00").getTime() - new Date(startDate + "T00:00:00").getTime()) /
      86_400_000 +
    1;
  const allowed: ReportGranularity[] = ["day"];
  if (days > 7) allowed.push("week");
  if (days > 31) allowed.push("month");
  return allowed;
}
