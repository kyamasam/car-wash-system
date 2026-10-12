"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

export function SidebarToggle({ isOpen, onClick }: SidebarToggleProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      className={cn(
        " z-10",
        "w-full h-6",
        "text-muted border-t",
        "flex items-center justify-center",
        "cursor-pointer transition-all duration-300",
        // Hover: yellow accent background + dark text
        "hover:bg-primary/40 hover:text-primary-foreground ",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-muted",
      )}
    >
      {isOpen ? (
        <ChevronLeft size={16} strokeWidth={2} />
      ) : (
        <ChevronRight size={16} strokeWidth={2} />
      )}
    </button>
  );
}
