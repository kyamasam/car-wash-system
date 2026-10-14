"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { OrgProvider } from "@/contexts/org-context";
import { AntdRegistry } from '@ant-design/nextjs-registry';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AntdRegistry>
      <OrgProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </OrgProvider>
    </AntdRegistry>
  );
}
