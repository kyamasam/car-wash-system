"use client";

import { forwardRef } from "react";
import DatePicker from "react-datepicker";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthYearPickerProps {
  value: string; // "yyyy-MM-dd" or ""
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const CustomInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ value, onClick, onChange, placeholder, disabled, className }, ref) => (
  <div className="relative w-full">
    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    <input
      ref={ref}
      value={value as string}
      onClick={onClick}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete="off"
      className={cn(
        "w-full pl-9 pr-3 py-2 text-sm border border-neutral-border rounded-md bg-background",
        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        !value && "text-neutral-muted",
        className,
      )}
    />
  </div>
));
CustomInput.displayName = "CustomInput";

export function MonthYearPicker({
  value,
  onChange,
  placeholder = "e.g. August 2025",
  disabled,
  minDate,
  maxDate,
  className,
}: MonthYearPickerProps) {
  const selected = value ? new Date(value) : null;

  return (
    <DatePicker
      selected={selected}
      onChange={(date: Date | null) => {
        if (date) {
          // Store as first day of selected month
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          onChange(`${year}-${month}-01`);
        } else {
          onChange("");
        }
      }}
      showMonthYearPicker
      dateFormat="MMMM yyyy"
      placeholderText={placeholder}
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
      customInput={<CustomInput className={className} />}
      popperPlacement="bottom-start"
      wrapperClassName="w-full"
      showPopperArrow={false}
    />
  );
}
