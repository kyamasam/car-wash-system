"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, Loader2Icon, Trash2Icon } from "lucide-react";

import { useWorkersStore } from "@/stores/workers-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { UpdateWorkerPayload } from "@/types/workers/worker";
import { PageHeader } from "@/components/layout/page-header";

export default function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const {
    currentWorker,
    currentWorkerLoading,
    currentWorkerError,
    fetchWorkerById,
    updateWorker,
    deleteWorker,
  } = useWorkersStore();

  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    national_id: "",
    is_commission_eligible: true,
    joined_at: "",
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    fetchWorkerById(id);
  }, [id]);

  React.useEffect(() => {
    if (currentWorker) {
      setForm({
        name: currentWorker.name,
        phone: currentWorker.phone ?? "",
        national_id: currentWorker.national_id ?? "",
        is_commission_eligible: currentWorker.is_commission_eligible,
        joined_at: currentWorker.joined_at ?? "",
      });
      setDirty(false);
    }
  }, [currentWorker]);

  function handleChange(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: UpdateWorkerPayload = {
        name: form.name,
        phone: form.phone || null,
        national_id: form.national_id || null,
        is_commission_eligible: form.is_commission_eligible,
        joined_at: form.joined_at || null,
      };
      await updateWorker(id, payload);
      setDirty(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteWorker(id);
      router.push("/dashboard/workers");
    } finally {
      setIsDeleting(false);
    }
  }

  if (currentWorkerLoading) {
    return (
      <div className="flex flex-col gap-3 md:gap-6 md:p-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (currentWorkerError || !currentWorker) {
    return (
      <div className="flex flex-col gap-4 p-3 sm:p-6">
        <Link href="/dashboard/workers">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon />
            Back to Workers
          </Button>
        </Link>
        <p className="text-sm text-destructive">
          {currentWorkerError ?? "Worker not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:gap-6 md:p-6 max-w-2xl">
      <PageHeader
        back="/dashboard/workers"
        title={currentWorker.name}
        actions={
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2Icon className="size-4" />
            Delete
          </Button>
        }
      />

      {/* Edit form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="rounded-xl border border-border p-5 space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Basic information</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Worker's full name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="e.g. 0712345678"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="national-id">National ID</Label>
              <Input
                id="national-id"
                placeholder="National ID number"
                value={form.national_id}
                onChange={(e) => handleChange("national_id", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="joined-at">Joined Date</Label>
              <Input
                id="joined-at"
                type="date"
                value={form.joined_at}
                onChange={(e) => handleChange("joined_at", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="commission"
              checked={form.is_commission_eligible}
              onChange={(e) => handleChange("is_commission_eligible", e.target.checked)}
              className="accent-primary w-4 h-4"
            />
            <Label htmlFor="commission" className="cursor-pointer">
              Eligible for commission
            </Label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Added {new Date(currentWorker.created_at).toLocaleDateString()}
          </p>
          <Button type="submit" disabled={!dirty || isSaving || !form.name.trim()}>
            {isSaving ? (
              <>
                <Loader2Icon className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete worker?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{currentWorker.name}</strong> permanently? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
