"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

export default function DashboardNotFound() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
      {/* Dot-grid background texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--neutral-border) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.6,
        }}
      />

      {/* ── Cloud "404" illustration ── */}
      <div className="relative z-10 w-full max-w-[560px] mb-8">
        <svg
          width="100%"
          viewBox="0 0 560 200"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="404"
          role="img"
        >
          {/* ━━━━ LEFT "4" ━━━━ */}
          <rect
            x="30"
            y="20"
            width="44"
            height="110"
            rx="22"
            className="fill-primary"
          />
          <rect
            x="30"
            y="88"
            width="130"
            height="44"
            rx="22"
            className="fill-primary"
          />
          <rect
            x="116"
            y="20"
            width="44"
            height="150"
            rx="22"
            className="fill-primary"
          />
          {/* Top cloud bumps */}
          <circle cx="52" cy="20" r="22" className="fill-primary" />
          <circle cx="78" cy="12" r="26" className="fill-primary" />
          <circle cx="108" cy="18" r="20" className="fill-primary" />
          <circle cx="138" cy="20" r="20" className="fill-primary" />
          {/* Bottom cloud bumps */}
          <circle cx="52" cy="130" r="20" className="fill-primary" />
          <circle cx="76" cy="140" r="18" className="fill-primary" />
          <circle cx="100" cy="143" r="16" className="fill-primary" />
          <circle cx="126" cy="140" r="18" className="fill-primary" />
          <circle cx="150" cy="132" r="18" className="fill-primary" />
          {/* Outline layer */}
          <rect
            x="30"
            y="20"
            width="44"
            height="110"
            rx="22"
            fill="none"
            className="stroke-foreground"
            strokeWidth="2.5"
          />
          <rect
            x="30"
            y="88"
            width="130"
            height="44"
            rx="22"
            fill="none"
            className="stroke-foreground"
            strokeWidth="2.5"
          />
          <rect
            x="116"
            y="20"
            width="44"
            height="150"
            rx="22"
            fill="none"
            className="stroke-foreground"
            strokeWidth="2.5"
          />

          {/* ━━━━ CENTRE "0" ━━━━ */}
          <ellipse cx="280" cy="95" rx="76" ry="84" className="fill-primary" />
          {/* Hole — punched through with page background */}
          <ellipse
            cx="280"
            cy="95"
            rx="36"
            ry="46"
            className="fill-background"
          />
          {/* Top arc cloud bumps */}
          <circle cx="226" cy="34" r="18" className="fill-primary" />
          <circle cx="250" cy="20" r="22" className="fill-primary" />
          <circle cx="280" cy="14" r="24" className="fill-primary" />
          <circle cx="310" cy="20" r="22" className="fill-primary" />
          <circle cx="334" cy="34" r="18" className="fill-primary" />
          {/* Side bumps */}
          <circle cx="207" cy="70" r="18" className="fill-primary" />
          <circle cx="204" cy="100" r="16" className="fill-primary" />
          <circle cx="352" cy="70" r="18" className="fill-primary" />
          <circle cx="356" cy="100" r="16" className="fill-primary" />
          {/* Bottom bumps */}
          <circle cx="210" cy="168" r="18" className="fill-primary" />
          <circle cx="238" cy="178" r="18" className="fill-primary" />
          <circle cx="266" cy="182" r="17" className="fill-primary" />
          <circle cx="294" cy="182" r="17" className="fill-primary" />
          <circle cx="322" cy="178" r="18" className="fill-primary" />
          <circle cx="350" cy="168" r="18" className="fill-primary" />
          {/* Outline layer */}
          <ellipse
            cx="280"
            cy="95"
            rx="76"
            ry="84"
            fill="none"
            className="stroke-foreground"
            strokeWidth="2.5"
          />
          <ellipse
            cx="280"
            cy="95"
            rx="36"
            ry="46"
            fill="none"
            className="stroke-foreground"
            strokeWidth="2.5"
          />

          {/* ━━━━ RIGHT "4" ━━━━ */}
          <rect
            x="390"
            y="20"
            width="44"
            height="110"
            rx="22"
            className="fill-primary"
          />
          <rect
            x="390"
            y="88"
            width="130"
            height="44"
            rx="22"
            className="fill-primary"
          />
          <rect
            x="476"
            y="20"
            width="44"
            height="150"
            rx="22"
            className="fill-primary"
          />
          {/* Top cloud bumps */}
          <circle cx="412" cy="20" r="20" className="fill-primary" />
          <circle cx="438" cy="12" r="24" className="fill-primary" />
          <circle cx="464" cy="18" r="20" className="fill-primary" />
          <circle cx="490" cy="14" r="22" className="fill-primary" />
          <circle cx="516" cy="20" r="20" className="fill-primary" />
          {/* Bottom cloud bumps */}
          <circle cx="410" cy="130" r="20" className="fill-primary" />
          <circle cx="436" cy="140" r="18" className="fill-primary" />
          <circle cx="460" cy="143" r="16" className="fill-primary" />
          <circle cx="486" cy="140" r="18" className="fill-primary" />
          <circle cx="510" cy="132" r="18" className="fill-primary" />
          {/* Outline layer */}
          <rect
            x="390"
            y="20"
            width="44"
            height="110"
            rx="22"
            fill="none"
            className="stroke-foreground"
            strokeWidth="2.5"
          />
          <rect
            x="390"
            y="88"
            width="130"
            height="44"
            rx="22"
            fill="none"
            className="stroke-foreground"
            strokeWidth="2.5"
          />
          <rect
            x="476"
            y="20"
            width="44"
            height="150"
            rx="22"
            fill="none"
            className="stroke-foreground"
            strokeWidth="2.5"
          />
        </svg>
      </div>

      {/* ── Content card ── */}
      <div className="relative z-10 w-full max-w-sm  rounded-2xl p-8 text-center">
        {/* CTA row */}
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full
                       border-[1.5px] border-border bg-transparent
                       text-sm font-medium text-foreground cursor-pointer
                       hover:border-primary transition-colors duration-200"
          >
            <ArrowLeft size={14} />
            Go back
          </button>

          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full
                       bg-primary text-primary-foreground
                       text-sm font-bold
                       hover:opacity-90 active:scale-[0.98] transition-all duration-200"
          >
            <Home size={14} />
            Take me home
          </Link>
        </div>
      </div>
    </div>
  );
}
