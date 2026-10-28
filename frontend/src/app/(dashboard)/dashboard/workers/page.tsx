"use client";

import * as React from "react";
import Link from "next/link";
import { PlusIcon, UsersIcon, SearchIcon, Loader2Icon } from "lucide-react";

import { useWorkersStore } from "@/stores/workers-store";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import { AddWorkerDialog } from "@/components/jobs/add-worker-dialog";
import { Button } from "@/components/ui/button";
import { WriteGuard } from "@/components/subscriptions/write-guard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Worker } from "@/types/workers/worker";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function WorkersPage() {
  const { data: currentUser } = useCurrentUser();
  const { workersList, workersListLoading, fetchWorkersList } = useWorkersStore();

  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);

  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  React.useEffect(() => {
    fetchWorkersList({ search: debouncedSearch || undefined, page });
  }, [debouncedSearch, page]);

  function handleWorkerCreated(worker: Worker) {
    fetchWorkersList({ search: debouncedSearch || undefined, page });
    void worker;
  }

  const workers = workersList?.results ?? [];
  const totalCount = workersList?.count ?? 0;
  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your car wash team members.
          </p>
        </div>
        {currentUser?.branch && (
          <WriteGuard>
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon />
              New Worker
            </Button>
          </WriteGuard>
        )}
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {workersListLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <UsersIcon className="size-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {search ? "No workers match your search" : "No workers yet"}
            </p>
            {!search && currentUser?.branch && (
              <>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Add your first worker to get started.
                </p>
                <WriteGuard>
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <PlusIcon />
                    Add Worker
                  </Button>
                </WriteGuard>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">National ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Commission</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workers.map((worker) => (
                <tr key={worker.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {worker.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{worker.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {worker.phone ?? <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {worker.national_id ?? <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant={worker.is_commission_eligible ? "secondary" : "outline"} className="text-xs">
                      {worker.is_commission_eligible ? "Eligible" : "Not eligible"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {worker.joined_at
                      ? new Date(worker.joined_at).toLocaleDateString()
                      : <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/workers/${worker.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || workersListLoading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || workersListLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {currentUser?.branch && (
        <AddWorkerDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={handleWorkerCreated}
          branchId={currentUser.branch}
        />
      )}
    </div>
  );
}
