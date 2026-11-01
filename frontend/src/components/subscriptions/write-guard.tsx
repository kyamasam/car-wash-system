"use client";

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSubscriptionAccess } from "@/hooks/subscriptions/use-subscription-access";

export const EXPIRED_WRITE_MESSAGE = "Subscription expired: renew to make changes";

/**
 * Blocks the wrapped write action (button, or link around a button) while the
 * business is in read-only (expired) mode. The 402 interceptor is the safety net.
 */
export function WriteGuard({ children, className }: { children: ReactNode; className?: string }) {
  const { isExpired } = useSubscriptionAccess();

  if (!isExpired) return <>{children}</>;

  const content = isValidElement(children)
    ? cloneElement(children as ReactElement<{ disabled?: boolean; tabIndex?: number }>, {
        disabled: true,
        tabIndex: -1,
      })
    : children;

  return (
    <span title={EXPIRED_WRITE_MESSAGE} className={cn("inline-flex cursor-not-allowed", className)}>
      <span className="pointer-events-none inline-flex flex-1 opacity-60 [&>*]:flex-1">{content}</span>
    </span>
  );
}

/** For places where wrapping isn't convenient (e.g. a form's submit `disabled`). */
export function useCanWrite() {
  const { isExpired } = useSubscriptionAccess();
  return !isExpired;
}
