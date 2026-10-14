import { CreateJobForm } from "@/components/jobs/create-job-form";

export default function NewJobPage() {
  return (
    <div className="flex h-full flex-col">
      {/* POS layout — fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <CreateJobForm />
      </div>
    </div>
  );
}
