"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { useBranches } from "@/hooks/commons/use-branches";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import type {
  ReportFilters,
  DatePreset,
} from "@/types/reports/filters";
import { allowedGranularities, resolvePreset } from "@/types/reports/filters";

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "this_week" },
  { label: "This Month", value: "this_month" },
  { label: "Custom", value: "custom" },
];

interface Props {
  value: ReportFilters;
  onChange: (filters: ReportFilters) => void;
  showGranularity?: boolean;
}

function formatDateDisplay(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isoFromDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export function ReportsFilterBar({ value, onChange, showGranularity = false }: Props) {
  const { data: user } = useCurrentUser();
  const { data: branches } = useBranches();

  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const granularities = allowedGranularities(value.startDate, value.endDate);

  // Fall back to "day" when the range is too short for the current granularity.
  function setRange(next: ReportFilters) {
    const allowed = allowedGranularities(next.startDate, next.endDate);
    onChange(allowed.includes(next.granularity) ? next : { ...next, granularity: "day" });
  }

  function setPreset(preset: DatePreset) {
    if (preset === "custom") {
      onChange({ ...value, preset: "custom" });
      return;
    }
    const { startDate, endDate } = resolvePreset(preset);
    setRange({ ...value, preset, startDate, endDate });
  }

  function setStartDate(d: Date | undefined) {
    if (!d) return;
    setRange({ ...value, startDate: isoFromDate(d) });
    setStartOpen(false);
  }

  function setEndDate(d: Date | undefined) {
    if (!d) return;
    setRange({ ...value, endDate: isoFromDate(d) });
    setEndOpen(false);
  }

  const showBranchSelector = !user?.branch;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date preset dropdown — mobile */}
      <Select value={value.preset} onValueChange={(v) => setPreset(v as DatePreset)}>
        <SelectTrigger className="h-9 w-full justify-start [&>svg:last-child]:ml-auto bg-background border-foreground/15 text-sm sm:hidden">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <SelectValue className="flex-1 text-left" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date preset buttons — desktop */}
      <div className="hidden sm:flex items-center gap-1">
        {PRESETS.map((p) => (
          <Button
            key={p.value}
            variant={value.preset === p.value ? "default" : "ghost"}
            size="sm"
            className={`h-7 px-3 text-xs border ${value.preset === p.value ? "border-transparent" : "border-foreground/15"}`}
            onClick={() => setPreset(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Custom date pickers */}
      {value.preset === "custom" && (
        <div className="flex w-full sm:w-auto items-center gap-1">
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 flex-1 sm:flex-none justify-start gap-1.5 text-xs">
                <CalendarIcon className="w-3.5 h-3.5" />
                {formatDateDisplay(value.startDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={new Date(value.startDate + "T00:00:00")}
                onSelect={setStartDate}
                disabled={(d) => d > new Date(value.endDate + "T00:00:00")}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground text-xs">to</span>

          <Popover open={endOpen} onOpenChange={setEndOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 flex-1 sm:flex-none justify-start gap-1.5 text-xs">
                <CalendarIcon className="w-3.5 h-3.5" />
                {formatDateDisplay(value.endDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={new Date(value.endDate + "T00:00:00")}
                onSelect={setEndDate}
                disabled={(d) => d < new Date(value.startDate + "T00:00:00")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Branch selector — only for business-level users */}
      {showBranchSelector && branches && branches.length > 1 && (
        <Select
          value={value.branch ?? "all"}
          onValueChange={(v) => onChange({ ...value, branch: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="h-8 w-full sm:w-44 text-xs">
            <SelectValue placeholder="All branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Granularity toggle */}
      {showGranularity && granularities.length > 1 && (
        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="text-xs text-muted-foreground">Group by</span>
          <div className="flex items-center gap-1">
            {granularities.map((g) => (
              <Button
                key={g}
                variant="ghost"
                size="sm"
                className={`h-7 px-2.5 text-xs capitalize border ${
                  value.granularity === g
                    ? "border-foreground/25 bg-foreground/5 text-foreground"
                    : "border-transparent text-muted-foreground"
                }`}
                onClick={() => onChange({ ...value, granularity: g })}
              >
                {g}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
