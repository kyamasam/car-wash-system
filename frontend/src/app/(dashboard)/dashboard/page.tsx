"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Car, CheckCircle2, Wallet } from "lucide-react";
import type { ElementType } from "react";

function formatKes(value: number) {
  return `KES ${value.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-black tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your car wash operations at a glance.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Jobs Today"
          value="—"
          sub="Total jobs checked in today"
          icon={Car}
        />
        <StatCard
          label="Active Jobs"
          value="—"
          sub="Currently in progress"
          icon={Activity}
        />
        <StatCard
          label="Completed Today"
          value="—"
          sub="Ready or collected"
          icon={CheckCircle2}
        />
        <StatCard
          label="Revenue Today"
          value="—"
          sub="Payments received today"
          icon={Wallet}
        />
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <Car className="w-10 h-10 text-muted-foreground/40" />
          <div>
            <p className="font-semibold text-sm">Welcome to SF Car Wash</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create your first job to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
