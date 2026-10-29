import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, type LucideIcon } from "lucide-react";
import Link from "next/link";

interface PrimaryAction {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: React.ReactNode;
  /** The page's main create action: a header button on desktop, an extended FAB on mobile. */
  primaryAction?: PrimaryAction;
  /** Secondary actions, kept on the same row as the title. */
  actions?: React.ReactNode;
  /** Renders a back button linking here. */
  back?: string;
  className?: string;
}

/**
 * Page title row. Follows Material compact-window guidance: one row for
 * title + actions, Title Large type on mobile, primary action as a FAB.
 */
export function PageHeader({ title, primaryAction, actions, back, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {back && (
          <Link href={back} className="shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 md:ml-0" aria-label="Back">
              <ArrowLeftIcon className="size-4" />
            </Button>
          </Link>
        )}
        <h1 className="text-lg leading-7 md:text-2xl font-semibold tracking-tight truncate min-w-0">{title}</h1>
      </div>
      {(actions || primaryAction) && (
        <div className="flex items-center gap-2 shrink-0 max-md:**:data-[slot=button]:h-8 max-md:**:data-[slot=button]:px-3">
          {actions}
          {primaryAction && (
            <ActionButton action={primaryAction} className="hidden md:inline-flex" />
          )}
        </div>
      )}
      {primaryAction && <Fab action={primaryAction} />}
    </div>
  );
}

function ActionButton({ action, className }: { action: PrimaryAction; className?: string }) {
  const Icon = action.icon;
  const content = (
    <>
      <Icon />
      {action.label}
    </>
  );
  if (action.href) {
    return (
      <Button asChild className={className}>
        <Link href={action.href}>{content}</Link>
      </Button>
    );
  }
  return (
    <Button onClick={action.onClick} className={className}>
      {content}
    </Button>
  );
}

/** Material extended FAB: 56dp tall, 16dp corners, 16dp above the bottom nav bar. */
function Fab({ action }: { action: PrimaryAction }) {
  const Icon = action.icon;
  const className = cn(
    "md:hidden fixed z-30 right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)]",
    "h-14 inline-flex items-center gap-3 rounded-2xl pl-4 pr-5",
    "bg-primary text-primary-foreground text-sm font-medium shadow-lg",
    "active:scale-95 transition-transform",
  );
  const content = (
    <>
      <Icon className="size-6" />
      {action.label}
    </>
  );
  return action.href ? (
    <Link href={action.href} className={className} data-fab>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={action.onClick} className={className} data-fab>
      {content}
    </button>
  );
}
