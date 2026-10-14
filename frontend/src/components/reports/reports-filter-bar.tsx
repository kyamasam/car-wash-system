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
  ReportGranularity,
} from "@/types/reports/filters";
import { resolvePreset } from "@/types/reports/filters";

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

  function setPreset(preset: DatePreset) {
    if (preset === "custom") {
      onChange({ ...value, preset: "custom" });
      return;
    }
    const { startDate, endDate } = resolvePreset(preset);
    onChange({ ...value, preset, startDate, endDate });
  }

  function setStartDate(d: Date | undefined) {
    if (!d) return;
    onChange({ ...value, startDate: isoFromDate(d) });
    setStartOpen(false);
  }

  function setEndDate(d: Date | undefined) {
    if (!d) return;
    onChange({ ...value, endDate: isoFromDate(d) });
    setEndOpen(false);
  }

  const showBranchSelector = !user?.branch;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date preset buttons */}
      <div className="flex items-center gap-1 bg-muted rounded-md p-1">
        {PRESETS.map((p) => (
          <Button
            key={p.value}
            variant={value.preset === p.value ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setPreset(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Custom date pickers */}
      {value.preset === "custom" && (
        <div className="flex items-center gap-1">
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
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
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
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
          <SelectTrigger className="h-8 w-44 text-xs">
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
      {showGranularity && (
        <div className="flex items-center gap-1 bg-muted rounded-md p-1 ml-auto">
          {(["day", "week", "month"] as ReportGranularity[]).map((g) => (
            <Button
              key={g}
              variant={value.granularity === g ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs capitalize"
              onClick={() => onChange({ ...value, granularity: g })}
            >
              {g}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
