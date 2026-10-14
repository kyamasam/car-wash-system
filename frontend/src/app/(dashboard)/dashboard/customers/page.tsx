"use client";

import * as React from "react";
import Link from "next/link";
import { PlusIcon, UsersIcon, SearchIcon } from "lucide-react";

import { useCustomersStore } from "@/stores/customers-store";
import { AddCustomerDialog } from "@/components/jobs/add-customer-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Customer } from "@/types/customers/customer";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function CustomersPage() {
  const { customersList, customersListLoading, fetchCustomersList } = useCustomersStore();

  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [createOpen, setCreateOpen] = React.useState(false);

  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  React.useEffect(() => {
    fetchCustomersList({ search: debouncedSearch || undefined, page });
  }, [debouncedSearch, page]);

  function handleCustomerCreated(customer: Customer) {
    fetchCustomersList({ search: debouncedSearch || undefined, page });
    void customer;
  }

  const customers = customersList?.results ?? [];
  const totalCount = customersList?.count ?? 0;
  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your customer profiles and their vehicles.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          New Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, phone or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {customersListLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <UsersIcon className="size-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {search ? "No customers match your search" : "No customers yet"}
            </p>
            {!search && (
              <>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Add your first customer to get started.
                </p>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <PlusIcon />
                  Add Customer
                </Button>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {(customer.name ?? customer.phone).charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">
                        {customer.name ?? <span className="text-muted-foreground/50 font-normal">—</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{customer.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {customer.email ?? <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/customers/${customer.id}`}>
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
              disabled={page <= 1 || customersListLoading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || customersListLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AddCustomerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCustomerCreated}
      />
    </div>
  );
}
