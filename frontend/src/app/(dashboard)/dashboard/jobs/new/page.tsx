import { CreateJobForm } from "@/components/jobs/create-job-form";

export default function NewJobPage() {
  return (
    <div className="flex flex-col lg:h-full">
      {/* POS layout — fills remaining height */}
      <div className="flex-1 lg:overflow-hidden">
        <CreateJobForm />
      </div>
    </div>
  );
}
