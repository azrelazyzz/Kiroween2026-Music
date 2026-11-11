import { ArrowRight, Disc3, ScanLine, Sparkles } from "lucide-react";
import Link from "next/link";

import { Artwork } from "@/components/artwork";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex h-20 max-w-[1480px] items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="font-display text-2xl"
          aria-label="Reverie home"
        >
          Reverie<span className="text-[var(--oxblood)]">.</span>
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-white/14 px-4 py-2 text-sm text-white/72 transition hover:bg-white/8 hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:outline-none"
        >
          Enter demo
        </Link>
      </nav>

      <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1480px] items-center gap-14 px-5 py-14 sm:px-8 lg:grid-cols-[1.03fr_0.97fr] lg:py-8">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1.5 text-xs font-medium text-[#d4c19e]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Built for records worth remembering
          </div>
          <h1 className="font-display text-[clamp(4.2rem,10vw,9.2rem)] leading-[0.82] tracking-[-0.065em]">
            Old records.
            <span className="block text-[var(--brass)] italic">
              New discoveries.
            </span>
          </h1>
          <p className="mt-9 max-w-xl text-lg leading-8 text-white/56 sm:text-xl">
            Identify a pressing from its barcode or markings, understand its
            story, and give your physical collection a beautifully organized
            second life.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/identify"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[var(--oxblood)] px-7 font-semibold text-white shadow-[0_18px_48px_rgba(105,23,39,.4)] transition hover:bg-[#a53a4c] focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:outline-none motion-safe:hover:-translate-y-1"
            >
              <ScanLine className="size-5" aria-hidden="true" />
              Identify a record
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-[var(--paper)] px-7 font-semibold text-[var(--ink)] transition hover:bg-white focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:outline-none motion-safe:hover:-translate-y-1"
            >
              Explore sample collection
            </Link>
          </div>
          <p className="mt-5 text-xs text-white/36">
            No account needed. Sample records are fictional and stay in this
            browser.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[680px] pb-20 lg:pb-0">
          <div className="vinyl-grooves absolute top-[8%] -right-[8%] size-[70%] rounded-full border border-[var(--brass)]/20 opacity-50" />
          <Artwork
            src="/demo/night-transit.svg"
            alt="Fictional Night Transit record artwork"
            priority
            className="relative z-10 ml-auto w-[74%] rotate-[2deg] rounded-sm"
          />
          <div className="paper-noise absolute bottom-1 left-0 z-20 w-[62%] -rotate-2 rounded-sm p-6 text-[var(--ink)] shadow-[0_30px_70px_rgba(0,0,0,.35)] sm:p-8">
            <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.18em] text-black/45 uppercase">
              <span>Match found</span>
              <span>Demo evidence</span>
            </div>
            <h2 className="font-display mt-5 text-3xl sm:text-4xl">
              Night Transit
            </h2>
            <p className="mt-1 text-sm text-black/55">Mara Voss · UK · 1987</p>
            <div className="mt-6 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[var(--moss)] text-white">
                <Disc3 className="size-5" aria-hidden="true" />
              </span>
              <span className="text-xs leading-relaxed text-black/58">
                Exact barcode
                <br />
                Two editions to compare
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
