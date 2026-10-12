import { notFound } from "next/navigation";

// This catches all undefined routes under /dashboard/*
export default function CatchAllPage() {
  console.log("Catch-all route triggered - showing 404");
  notFound(); // This triggers the parent not-found.tsx
}
