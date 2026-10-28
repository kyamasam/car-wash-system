"use client";

import {
  LucideFacebook,
  LucideInstagram,
  LucideLinkedin,
  LucideTwitter,
} from "lucide-react";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
];

const SOCIALS = [
  { icon: LucideLinkedin, href: "#", label: "LinkedIn" },
  { icon: LucideTwitter, href: "#", label: "Twitter / X" },
  { icon: LucideFacebook, href: "#", label: "Facebook" },
  { icon: LucideInstagram, href: "#", label: "Instagram" },
];

export const Footer = () => {
  return (
    <footer className="w-full bg-background">
      {/* Thick primary accent bar at the very top */}
      <div
        className="w-full h-[3px]"
        style={{
          background:
            "linear-gradient(to right, hsl(var(--primary) / 0) 0%, hsl(var(--primary)) 30%, hsl(var(--primary)) 70%, hsl(var(--primary) / 0) 100%)",
        }}
      />

      <div className="px-6 lg:px-12">
        {/* ── Main content row ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 py-10">
          {/* Left — logo + tagline */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 shrink-0">
                <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <rect width="36" height="36" rx="9" fill="#10b981" />
                  <line x1="18" y1="18" x2="10" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                  <line x1="18" y1="18" x2="26" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                  <line x1="18" y1="18" x2="18" y2="27" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                  <line x1="10" y1="11" x2="26" y2="11" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
                  <circle cx="18" cy="18" r="3.5" fill="white" />
                  <circle cx="10" cy="11" r="2.2" fill="white" opacity="0.9" />
                  <circle cx="26" cy="11" r="2.2" fill="white" opacity="0.9" />
                  <circle cx="18" cy="27" r="2.2" fill="white" opacity="0.9" />
                </svg>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[15px] font-black tracking-tight text-primary/90 uppercase">
                  Carwash 
                </span>
                <span className="text-[8px] font-light tracking-[0.3em] text-primary uppercase">
                  Manager
                </span>
              </div>
            </div>
            <p className="text-xs text-foreground/40 max-w-[200px] leading-relaxed">
              Car wash management made simple. Track jobs, staff and payments, pay via M-Pesa.
            </p>
          </div>

          {/* Center — nav links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-3 md:justify-center">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[13px] font-medium text-foreground/50 hover:text-primary transition-colors duration-150"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right — socials */}
          <div className="flex flex-col gap-3 md:items-end">
            <p
              className="text-[9px] font-semibold tracking-[0.2em] uppercase"
              style={{ color: "hsl(var(--primary) / 0.6)" }}
            >
              Follow Us
            </p>
            <div className="flex items-center gap-2">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-md flex items-center justify-center border border-border/50 text-foreground/40 hover:text-primary hover:border-primary/40 transition-all duration-150"
                >
                  <Icon size={13} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom copyright ── */}
        <div className="flex items-center justify-between border-t border-border/30 py-5">
          <p className="text-[11px] text-foreground/30">
            © {new Date().getFullYear()} CarwashManager. All rights reserved.
          </p>
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "hsl(var(--primary) / 0.4)" }}
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
