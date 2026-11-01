import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FEATURE_LABELS, formatPrice } from "@/types/subscriptions/subscription";
import { BarChart3, Car, CheckCircle2, Gift, Users, Wallet } from "lucide-react";
import Link from "next/link";

// USD figures are approximate (≈129 KES/USD).
const PLANS: {
  name: string;
  kes: number;
  usd: string;
  period: string;
  savings?: string;
  recommended?: boolean;
}[] = [
  { name: "Daily", kes: 100, usd: "0.80", period: "day" },
  { name: "Weekly", kes: 600, usd: "4.70", period: "week", savings: "Save 1 day" },
  { name: "Monthly", kes: 2200, usd: "17", period: "month", savings: "Save 8 days", recommended: true },
  { name: "Yearly", kes: 33000, usd: "255", period: "year", savings: "Save 1 month" },
];


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-b from-primary/5 via-background to-muted/30 px-6 py-20 text-center">
        <div className="absolute left-1/2 top-20 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="mx-auto max-w-5xl">
          <Badge variant="outline" className="mb-5 rounded-full bg-background/70 px-4 py-1 text-sm">
            Built for car wash businesses in Kenya
          </Badge>

          <h1 className="mb-6 text-5xl font-black tracking-tight text-foreground md:text-7xl">
            Run Your Car Wash.
            <br />
            <span className="text-primary">Simply.</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
            Track jobs, manage workers, collect M-Pesa payments, and grow your business
            — all from one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="rounded-full px-10">
              <Link href="/register">Get started free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-10">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4 rounded-full">Features</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Everything you need to run your car wash
            </h2>
            <p className="text-muted-foreground">
              From job check-in to payout — SF Car Wash handles it all.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="rounded-3xl border-primary/20 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <CardHeader>
                <Car className="mb-3 h-9 w-9 text-primary" />
                <CardTitle>Job Management</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                Check in vehicles, track job status from queued to collected, and handle carpet jobs with tag numbers.
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-primary/20 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <CardHeader>
                <Wallet className="mb-3 h-9 w-9 text-primary" />
                <CardTitle>M-Pesa Payments</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                Accept cash, M-Pesa, and card payments per job. Track partial payments and outstanding balances in KES.
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-primary/20 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <CardHeader>
                <Users className="mb-3 h-9 w-9 text-primary" />
                <CardTitle>Worker Commissions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                Auto-calculate commissions per job, track pending payouts, and pay workers with full audit trail.
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-primary/20 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <CardHeader>
                <CheckCircle2 className="mb-3 h-9 w-9 text-primary" />
                <CardTitle>Service Catalogue</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                Define services with per-branch pricing and vehicle-category rates. Support per-job, per-item, and per-sqft pricing.
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-primary/20 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <CardHeader>
                <BarChart3 className="mb-3 h-9 w-9 text-primary" />
                <CardTitle>Reports</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                Daily revenue summaries, worker performance, and expense tracking across all branches.
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-primary/20 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <CardHeader>
                <Car className="mb-3 h-9 w-9 text-primary" />
                <CardTitle>Multi-branch</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                Manage multiple branches from one account. Assign staff to specific branches or give owners full access.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4 rounded-full">Pricing</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Simple, flexible pricing
            </h2>
            <p className="text-muted-foreground">
              Start with a 5-day free trial. Pay daily, weekly, monthly or yearly — every plan
              includes all features.
            </p>
          </div>

          <Card className="mb-8 rounded-3xl border-dashed border-primary/40 bg-background shadow-sm">
            <CardContent className="flex flex-col items-center justify-between gap-4 py-2 text-center sm:flex-row sm:text-left">
              <div className="flex items-center gap-4">
                <Gift className="h-9 w-9 shrink-0 text-primary" />
                <div>
                  <p className="text-lg font-semibold">5-day free trial</p>
                  <p className="text-sm text-muted-foreground">
                    Full access to every feature. No payment required.
                  </p>
                </div>
              </div>
              <Button asChild className="rounded-full px-8">
                <Link href="/register">Get started free</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-3xl bg-background shadow-sm transition hover:-translate-y-1 hover:shadow-md",
                  plan.recommended
                    ? "border-primary shadow-lg ring-2 ring-primary lg:scale-105"
                    : "border-primary/20",
                )}
              >
                {plan.recommended && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3">
                    Recommended
                  </Badge>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.savings && (
                      <Badge variant="secondary" className="rounded-full">
                        {plan.savings}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <p className="text-3xl font-black tracking-tight">
                    {formatPrice(plan.kes)}
                    <span className="text-base font-normal text-muted-foreground"> / {plan.period}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">≈ USD {plan.usd}</p>
                  <Button
                    asChild
                    variant={plan.recommended ? "default" : "outline"}
                    className="mt-6 w-full rounded-full"
                  >
                    <Link href="/register">Start free trial</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="mb-4 text-sm font-medium text-muted-foreground">All plans include</p>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {Object.values(FEATURE_LABELS).map((label) => (
                <li key={label} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl rounded-3xl bg-primary px-6 py-14 text-primary-foreground shadow-xl">
          <h2 className="mb-4 text-3xl font-black md:text-4xl">
            Ready to manage your car wash?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
            Create your account and start tracking jobs in minutes.
          </p>
          <Button asChild size="lg" variant="secondary" className="rounded-full px-10">
            <Link href="/register">Start for free</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
