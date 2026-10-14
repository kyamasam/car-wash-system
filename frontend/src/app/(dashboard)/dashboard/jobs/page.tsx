import Link from "next/link";
import { PlusIcon, ClipboardListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JobsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage all car wash jobs.
          </p>
        </div>
        <Link href="/dashboard/jobs/new">
          <Button>
            <PlusIcon />
            New Job
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
        <ClipboardListIcon className="size-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No jobs yet</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Create your first job to get started.
        </p>
        <Link href="/dashboard/jobs/new">
          <Button size="sm">
            <PlusIcon />
            Create Job
          </Button>
        </Link>
      </div>
    </div>
  );
}
