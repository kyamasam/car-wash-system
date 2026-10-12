"use client";

import { useMyInvitations } from "@/hooks/org/use-my-invitations";
import { MailOpen, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export function PendingInvitationsBanner() {
  const { data: invitations } = useMyInvitations();
  const router = useRouter();

  if (!invitations || invitations.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 px-1 mb-3">
      {invitations.map((invite) => (
        <div
          key={invite.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <MailOpen className="w-4 h-4 text-primary shrink-0" />
            <p className="truncate text-muted-foreground">
              You have a pending invitation to join{" "}
              <span className="font-semibold text-foreground">
                {invite.organization_name}
              </span>
              {invite.invited_by_name && (
                <> from <span className="font-medium">{invite.invited_by_name}</span></>
              )}
              .
            </p>
          </div>
          <button
            onClick={() =>
              router.push(`/organizations/invitations/${invite.token}/accept`)
            }
            className="flex items-center gap-1.5 shrink-0 text-primary font-medium hover:underline"
          >
            Review <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
