"use client";

import { useState } from "react";
import { useActiveOrg } from "@/contexts/org-context";
import { useOrgMembers } from "@/hooks/org/use-org-members";
import { useInviteMember } from "@/hooks/org/use-invite-member";
import { useRemoveMember } from "@/hooks/org/use-remove-member";
import { useResendInvite } from "@/hooks/org/use-resend-invite";
import { useCancelInvite } from "@/hooks/org/use-cancel-invite";
import { useChangeMemberRole } from "@/hooks/org/use-change-member-role";
import type { OrganizationMember, OrgRole } from "@/types/org/organization";
import { INVITABLE_ROLES, ORG_ROLE_LABELS, CHANGEABLE_ROLES } from "@/types/org/organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RefreshCw, Trash2, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const ROLE_BADGE_VARIANTS: Record<OrgRole, string> = {
  OWNER: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  ADMIN: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  VIEWER: "bg-muted text-muted-foreground",
};

export default function MembersPage() {
  const { activeOrg } = useActiveOrg();
  const orgSlug = activeOrg?.slug ?? "";
  const { data: members = [], isLoading } = useOrgMembers(activeOrg?.slug);
  const { mutate: invite, isPending: isInviting } = useInviteMember(orgSlug);
  const { mutate: removeMember, isPending: isRemoving } = useRemoveMember(orgSlug);
  const { mutate: resendInvite } = useResendInvite(orgSlug);
  const { mutate: cancelInvite, isPending: isCancelling } = useCancelInvite(orgSlug);
  const { mutate: changeRole } = useChangeMemberRole(orgSlug);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("VIEWER");
  const [memberToRemove, setMemberToRemove] = useState<OrganizationMember | null>(null);
  const [memberToCancel, setMemberToCancel] = useState<OrganizationMember | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    invite(
      { email: inviteEmail, role: inviteRole },
      {
        onSuccess: () => {
          setInviteEmail("");
          setInviteRole("VIEWER");
        },
      },
    );
  };

  const handleRemove = () => {
    if (!memberToRemove) return;
    removeMember(
      { memberId: memberToRemove.id },
      { onSuccess: () => setMemberToRemove(null) },
    );
  };

  const handleCancelInvite = () => {
    if (!memberToCancel) return;
    cancelInvite(
      { memberId: memberToCancel.id },
      { onSuccess: () => setMemberToCancel(null) },
    );
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">Team members</h2>
        <p className="text-sm text-muted-foreground">
          Invite people to your organization or remove existing members.
        </p>
      </div>

      {/* Invite form */}
      <div className="border border-border rounded-xl p-5 space-y-4">
        <p className="text-sm font-medium">Invite a member</p>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="invite-email" className="sr-only">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <div className="w-full sm:w-44">
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as OrgRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVITABLE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ORG_ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isInviting} className="gap-2 shrink-0">
            <UserPlus size={14} />
            {isInviting ? "Inviting…" : "Send invite"}
          </Button>
        </form>
      </div>

      {/* Members table */}
      <div className="border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No members yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Member</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  onRemove={() => setMemberToRemove(member)}
                  onResend={() => resendInvite({ memberId: member.id })}
                  onCancelInvite={() => setMemberToCancel(member)}
                  onRoleChange={(role) => changeRole({ memberId: member.id, role })}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Remove confirm dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {memberToRemove?.user_name} from the organization? They will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              {isRemoving ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel invite confirm dialog */}
      <AlertDialog open={!!memberToCancel} onOpenChange={(open) => !open && setMemberToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invite?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel the invite sent to {memberToCancel?.invited_email ?? memberToCancel?.user_email}? They will no longer be able to join the organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep invite</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancelInvite}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling…" : "Cancel invite"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MemberRow({
  member,
  onRemove,
  onResend,
  onCancelInvite,
  onRoleChange,
}: {
  member: OrganizationMember;
  onRemove: () => void;
  onResend: () => void;
  onCancelInvite: () => void;
  onRoleChange: (role: OrgRole) => void;
}) {
  const displayName = member.user_name || member.user_email;
  const isOwner = member.role === "OWNER";
  const canChangeRole = !member.is_pending && !isOwner;

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {getInitials(displayName)}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{member.user_email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {canChangeRole ? (
          <Select value={member.role} onValueChange={(v) => onRoleChange(v as OrgRole)}>
            <SelectTrigger className="h-7 w-40 text-xs px-2 border-transparent hover:border-border focus:border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANGEABLE_ROLES.map((role) => (
                <SelectItem key={role} value={role} className="text-xs">
                  {ORG_ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              ROLE_BADGE_VARIANTS[member.role] ?? "bg-muted text-muted-foreground",
            )}
          >
            {ORG_ROLE_LABELS[member.role]}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge variant={member.is_pending ? "outline" : "secondary"} className="text-xs">
          {member.is_pending ? "Pending" : "Active"}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        {member.is_pending ? (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              title="Resend invite"
              onClick={onResend}
            >
              <RefreshCw size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Cancel invite"
              onClick={onCancelInvite}
            >
              <X size={13} />
            </Button>
          </div>
        ) : !isOwner ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 size={13} />
          </Button>
        ) : null}
      </td>
    </tr>
  );
}
