"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BusinessGuard } from "@/components/onboarding/business-guard";
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
        <BusinessGuard>
          <DashboardLayout>{children}</DashboardLayout>
        </BusinessGuard>
      </OrgProvider>
    </AntdRegistry>
  );
}
