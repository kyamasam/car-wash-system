"use client";

import { LoginModal } from "@/components/auth/login-modal";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import { LucideMenu, LucideX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CurrencySwitcher } from "./currency-switcher";
import { OrgSwitcher } from "./org-switcher";
import { UserMenu } from "./user-menu";

export const TopNavigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: user, isAuthenticated } = useCurrentUser();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  let navLinks = [
    { label: "Home", href: "/" },
    { label: "Pricing", href: "/#pricing" },

  ];
  if (isAuthenticated) {
    navLinks.push({ label: "Dashboard", href: "/dashboard" })
  }

  return (
    <div className="w-full">
      <nav
        className={`w-full transition-all duration-300 z-50 border-b border-border ${scrolled
          ? "fixed top-0 left-0 bg-background/90 backdrop-blur-md"
          : "relative bg-background"
          }`}
      >
        <div className="w-full flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 shrink-0">
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
              <span className="text-[17px] font-black tracking-tight text-primary/90 uppercase">Samfast</span>
              <span className="text-[9px] font-light tracking-[0.3em] text-primary uppercase">Networks</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth — desktop */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <OrgSwitcher />
                <UserMenu />
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/register">Register</Link>
                </Button>
                <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => setShowLogin(true)}>
                  Login
                </Button>
              </>
            )}
            <CurrencySwitcher />
            <ModeToggle />
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <LucideX size={22} /> : <LucideMenu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
                <ModeToggle />
                {isAuthenticated && user ? (
                  <>
                    <OrgSwitcher />
                    <UserMenu />
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/register">Register</Link>
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setShowLogin(true);
                        setMobileMenuOpen(false);
                      }}
                    >
                      Login
                    </Button>
                  </>
                )}
                <div className="pt-1">
                  <CurrencySwitcher />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {showLogin && !isAuthenticated && (
        <LoginModal onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
};
