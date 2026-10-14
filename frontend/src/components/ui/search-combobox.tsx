"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon, Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface ComboboxItem {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchComboboxProps {
  items: ComboboxItem[];
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  disabled?: boolean;
  footer?: React.ReactNode;
  className?: string;
  clearable?: boolean;
  emptyText?: string;
}

export function SearchCombobox({
  items,
  value,
  onSelect,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  loading = false,
  disabled = false,
  footer,
  className,
  clearable = true,
  emptyText = "No results found.",
}: SearchComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search.trim()) return items;
    const lower = search.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.sublabel?.toLowerCase().includes(lower)
    );
  }, [items, search]);

  const selected = items.find((item) => item.value === value);

  function handleSelect(itemValue: string) {
    onSelect(itemValue);
    setOpen(false);
    setSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onSelect("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate flex-1 text-left">
            {selected ? selected.label : placeholder}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {clearable && selected && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="rounded p-0.5 hover:bg-accent"
              >
                <XIcon className="size-3 text-muted-foreground" />
              </span>
            )}
            {loading ? (
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDownIcon className="size-4 text-muted-foreground opacity-50" />
            )}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-56 p-0"
        align="start"
        sideOffset={4}
      >
        <div className="flex items-center border-b px-3">
          <SearchIcon className="size-4 text-muted-foreground shrink-0 mr-2" />
          <input
            className="flex h-9 w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              {loading ? "Loading..." : emptyText}
            </div>
          ) : (
            <div className="p-1">
              {filtered.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleSelect(item.value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    item.value === value && "bg-accent/50"
                  )}
                >
                  <span className="flex-1 text-left">
                    <span className="block truncate">{item.label}</span>
                    {item.sublabel && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.sublabel}
                      </span>
                    )}
                  </span>
                  {item.value === value && (
                    <CheckIcon className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {footer && (
          <div className="border-t p-1">
            {footer}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
