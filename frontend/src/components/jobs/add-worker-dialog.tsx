"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";
import { useApiMutation } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Worker } from "@/types/workers/worker";

interface WorkerPayload {
  name: string;
  phone: string;
  national_id: string;
}

interface AddWorkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (worker: Worker) => void;
  branchId: string;
}

export function AddWorkerDialog({
  open,
  onOpenChange,
  onCreated,
  branchId,
}: AddWorkerDialogProps) {
  const [form, setForm] = React.useState<WorkerPayload>({
    name: "",
    phone: "",
    national_id: "",
  });

  const { mutate, isPending } = useApiMutation<Worker, WorkerPayload>({
    method: "POST",
    url: `/branch/${branchId}/workers/`,
    onSuccess: (data) => {
      onCreated(data);
      onOpenChange(false);
      setForm({ name: "", phone: "", national_id: "" });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Worker</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="w-name">Name <span className="text-destructive">*</span></Label>
            <Input
              id="w-name"
              placeholder="Worker's full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-phone">Phone</Label>
            <Input
              id="w-phone"
              placeholder="e.g. 0712345678"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-nid">National ID</Label>
            <Input
              id="w-nid"
              placeholder="National ID number"
              value={form.national_id}
              onChange={(e) => setForm((f) => ({ ...f, national_id: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !branchId}>
              {isPending ? "Saving..." : "Add Worker"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddWorkerButton({
  onCreated,
  branchId,
}: {
  onCreated: (worker: Worker) => void;
  branchId: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent"
      >
        <PlusIcon className="size-4" />
        Add new worker
      </button>
      <AddWorkerDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={onCreated}
        branchId={branchId}
      />
    </>
  );
}
