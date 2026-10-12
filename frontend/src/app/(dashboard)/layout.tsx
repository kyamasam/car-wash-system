"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AntdRegistry } from '@ant-design/nextjs-registry';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("Dashboard page rendering");

  return (
    <AntdRegistry>
      <DashboardLayout>{children}</DashboardLayout>
    </AntdRegistry>);
}
