import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { CreateJobForm } from "@/components/jobs/create-job-form";

export default function NewJobPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/dashboard/jobs" className="hover:text-foreground transition-colors">
          Jobs
        </Link>
        <ChevronRightIcon className="size-4" />
        <span className="text-foreground font-medium">New Job</span>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Job</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the details below. Services are required; everything else is optional.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <CreateJobForm />
      </div>
    </div>
  );
}
