import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Business", "Branch"];

interface Props {
  /** Zero-based index of the active step. */
  current: number;
}

export function OnboardingSteps({ current }: Props) {
  return (
    <ol className="flex items-center justify-center gap-3" aria-label="Onboarding progress">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-3">
            {i > 0 && (
              <span
                aria-hidden
                className={cn("h-px w-8 sm:w-12", done || active ? "bg-primary" : "bg-border")}
              />
            )}
            <span
              className="flex items-center gap-2"
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary text-primary",
                  !done && !active && "border-border text-muted-foreground",
                )}
              >
                {done ? <Check size={14} /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  active || done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
