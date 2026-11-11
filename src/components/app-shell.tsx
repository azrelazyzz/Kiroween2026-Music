"use client";

import {
  Disc3,
  Grid2X2,
  LayoutDashboard,
  ScanLine,
  Settings2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCollection } from "@/components/collection-provider";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/collection", label: "Collection", icon: Grid2X2 },
  { href: "/identify", label: "Identify", icon: ScanLine, primary: true },
  { href: "/batch", label: "Batch", icon: Disc3 },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mode, userEmail } = useCollection();

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[var(--ink)]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-[1480px] items-center justify-between px-5 sm:px-8">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:outline-none"
          >
            <span className="vinyl-grooves grid size-9 place-items-center rounded-full text-[var(--brass)] transition-transform duration-500 motion-safe:group-hover:rotate-45">
              <span className="size-2 rounded-full bg-[var(--oxblood)]" />
            </span>
            <span>
              <span className="font-display block text-xl leading-none">
                Reverie
              </span>
              <span className="mt-1 block text-[9px] font-semibold tracking-[0.22em] text-white/42 uppercase">
                Music catalogue
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Main navigation"
          >
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm text-white/60 transition hover:bg-white/7 hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:outline-none",
                    active && !item.primary && "bg-white/8 text-white",
                    item.primary &&
                      "ml-2 bg-[var(--paper)] text-[var(--ink)] hover:bg-white hover:text-[var(--ink)]",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href={mode === "cloud" ? "/settings" : "/auth"}
            className="hidden items-center gap-2 rounded-full bg-[var(--moss)]/18 px-3 py-1.5 text-xs text-[#c8cdbd] hover:bg-[var(--moss)]/28 focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:outline-none sm:flex"
            title={userEmail ?? "Local demonstration mode"}
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            {mode === "cloud" ? "Cloud collection" : "Demo · stored locally"}
          </Link>
        </div>
      </header>

      <main>{children}</main>

      <nav
        className="fixed right-3 bottom-3 left-3 z-50 grid grid-cols-5 rounded-[1.35rem] border border-white/10 bg-[#1c1917]/94 p-1.5 shadow-2xl backdrop-blur-xl lg:hidden"
        aria-label="Mobile navigation"
      >
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-medium text-white/48 focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:outline-none",
                active && "bg-white/8 text-[var(--paper)]",
                item.primary && "bg-[var(--oxblood)] text-white shadow-lg",
              )}
            >
              <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
