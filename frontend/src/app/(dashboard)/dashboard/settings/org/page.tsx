"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useActiveOrg } from "@/contexts/org-context";
import { useUpdateOrg } from "@/hooks/org/use-update-org";
import { useDeleteOrg } from "@/hooks/org/use-delete-org";
import { useOrgMembers } from "@/hooks/org/use-org-members";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education",
  "Retail", "Agriculture", "Media", "Transport", "Other",
];

export default function OrgSettingsPage() {
  const router = useRouter();
  const { activeOrg, setActiveOrg, orgs, switchOrg, isLoading } = useActiveOrg();
  const { mutate: updateOrg, isPending } = useUpdateOrg(activeOrg?.slug ?? "");
  const { mutate: deleteOrg, isPending: isDeleting } = useDeleteOrg(activeOrg?.slug ?? "");
  const { data: currentUser } = useCurrentUser();
  const { data: members = [] } = useOrgMembers(activeOrg?.slug);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const myMember = members.find((m) => m.user === currentUser?.id);
  const isOwner = myMember?.role === "OWNER";

  const [form, setForm] = useState({
    name: "",
    billing_email: "",
    tax_id: "",
    location: "",
    country: "",
    industry: "",
  });

  useEffect(() => {
    if (activeOrg) {
      console.log("adctive", activeOrg?.industry)
      setForm({
        name: activeOrg.name ?? "",
        billing_email: activeOrg.billing_email ?? "",
        tax_id: activeOrg.tax_id ?? "",
        location: activeOrg.location ?? "",
        country: activeOrg.country ?? "",
        industry: activeOrg.industry ?? "",
      });
    }
  }, [activeOrg]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) return;
    updateOrg(
      {
        name: form.name || undefined,
        billing_email: form.billing_email || undefined,
        tax_id: form.tax_id || undefined,
        location: form.location || undefined,
        country: form.country || undefined,
        industry: form.industry || undefined,
      },
      { onSuccess: (updated) => setActiveOrg(updated) },
    );
  };

  const handleDelete = () => {
    if (!activeOrg) return;
    deleteOrg(undefined, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        const remaining = orgs.filter((o) => o.slug !== activeOrg.slug);
        if (remaining.length > 0) {
          switchOrg(remaining[0]);
        } else {
          router.push("/dashboard");
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-xl space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!activeOrg) return null;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Organization info</h2>
        <p className="text-sm text-muted-foreground">Update your organization details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-slug">Slug</Label>
          <Input id="org-slug" value={activeOrg.slug} disabled className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Slug cannot be changed after creation.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-name">Name</Label>
          <Input
            id="org-name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Acme Inc."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-billing-email">Billing email</Label>
          <Input
            id="org-billing-email"
            type="email"
            value={form.billing_email}
            onChange={(e) => handleChange("billing_email", e.target.value)}
            placeholder="billing@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-tax-id">Tax ID / VAT</Label>
          <Input
            id="org-tax-id"
            value={form.tax_id}
            onChange={(e) => handleChange("tax_id", e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="org-location">Location</Label>
            <Input
              id="org-location"
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Nairobi"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-country">Country</Label>
            <Input
              id="org-country"
              value={form.country}
              onChange={(e) => handleChange("country", e.target.value)}
              placeholder="Kenya"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Industry</Label>
          <Select
            key={activeOrg.id + form.industry} // Forces re-mount when data loads
            value={form.industry}
            onValueChange={(v) => handleChange("industry", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      {isOwner && (
        <div className="border border-destructive/40 rounded-xl p-5 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently delete this organization and all its data. This action cannot be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 size={14} className="mr-2" />
            Delete organization
          </Button>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{activeOrg?.name}</strong> and remove all
              members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete organization"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
