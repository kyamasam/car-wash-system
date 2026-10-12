"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import { cn, getUserInitials } from "@/lib/utils";
import { LogOut, MoreHorizontal, Settings, User } from "lucide-react";

interface SidebarUserProps {
  isOpen: boolean;
}

export function SidebarUser({ isOpen }: SidebarUserProps) {
  const { data: currentUser } = useCurrentUser();

  const name = currentUser
    ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.username || ""
    : "";
  const email = currentUser?.email ?? "";
  console.log("currentUser", currentUser)
  const initials = !currentUser ? 'U' : getUserInitials(currentUser)

  return (
    <div className="p-[10px] border-t border-[var(--sidebar-border)]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center gap-[10px] px-[10px] py-2 rounded-[10px]",
              "transition-all duration-200 cursor-pointer",
              // Hover: neutral border tint
              "hover:bg-[var(--neutral-border)]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
            )}
          >
            {/* Avatar — yellow ring, dark initials */}
            <div className="relative shrink-0">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center",
                  "text-[13px] font-bold",
                  // Yellow background, dark foreground — matches your brand
                  "bg-[var(--primary)] text-[var(--primary-foreground)]",
                )}
              >
                {initials}
              </div>
              {/* Online dot */}
              <span
                className={cn(
                  "absolute bottom-0 right-0 w-[9px] h-[9px] rounded-full",
                  "bg-[var(--success)] border-2 border-[var(--sidebar)]",
                )}
              />
            </div>

            {/* Name + email */}
            <div
              className={cn(
                "flex-1 text-left overflow-hidden transition-all duration-300",
                isOpen ? "opacity-100" : "opacity-0 w-0",
              )}
            >
              <p className="text-[13px] font-semibold text-[var(--sidebar-foreground)] truncate">
                {name}
              </p>
              <p className="text-[11px] text-[var(--neutral-muted)] truncate mt-px">
                {email}
              </p>
            </div>

            {/* More icon */}
            <MoreHorizontal
              size={14}
              className={cn(
                "text-[var(--neutral-muted)] shrink-0 transition-all duration-300",
                isOpen ? "opacity-100" : "opacity-0",
              )}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold">{name}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="text-[var(--error)] focus:text-[var(--error)]">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
