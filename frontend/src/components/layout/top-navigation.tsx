"use client";

import { LoginModal } from "@/components/auth/login-modal";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import { LucideMenu, LucideX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BranchSwitcher } from "./branch-switcher";
import { CurrencySwitcher } from "./currency-switcher";
import { UserMenu } from "./user-menu";
import { AppLogoMark } from "./sidebar-brand";

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
              <AppLogoMark />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[17px] font-black tracking-tight text-primary/90 uppercase">Carwash</span>
              <span className="text-[9px] font-light tracking-[0.3em] text-primary uppercase">Manager</span>
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
                <BranchSwitcher />
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
                    <BranchSwitcher />
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
