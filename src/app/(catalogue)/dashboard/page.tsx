"use client";

import {
  ArrowRight,
  Disc3,
  Heart,
  Library,
  ScanLine,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Artwork } from "@/components/artwork";
import { useCollection } from "@/components/collection-provider";
import { PageHeading } from "@/components/page-heading";
import { calculateCollectionAnalytics } from "@/lib/domain/analytics";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { copies, loading, error, mode } = useCollection();
  const analytics = calculateCollectionAnalytics(copies);
  const recent = [...copies]
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-[1480px] px-5 py-12 sm:px-8 sm:py-16">
      <PageHeading
        eyebrow="Your listening archive"
        title="Good evening."
        description={
          mode === "demo"
            ? "Four fictional records are waiting in this local demo. Add one through the guided identification flow, or search live MusicBrainz data."
            : "Your private cloud collection is ready. Identify a pressing, compare the evidence, and save its physical-copy details."
        }
        action={
          <Link
            href="/identify"
            className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[var(--oxblood)] px-6 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(105,23,39,.35)] transition hover:bg-[#a53a4c] focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:outline-none motion-safe:hover:-translate-y-0.5"
          >
            <ScanLine className="size-4" aria-hidden="true" />
            Identify a record
          </Link>
        }
      />

      {error ? (
        <div
          role="alert"
          className="mt-8 rounded-2xl bg-red-950/40 p-4 text-sm text-red-100"
        >
          {error}
        </div>
      ) : null}

      <section
        className="mt-14 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Collection summary"
      >
        {[
          { label: "Records owned", value: analytics.totalCopies, icon: Disc3 },
          {
            label: "Unique releases",
            value: analytics.uniqueReleases,
            icon: Library,
          },
          { label: "Favorites", value: analytics.favorites, icon: Heart },
          {
            label: "Need research",
            value: analytics.unidentified,
            icon: Sparkles,
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`min-h-40 rounded-[1.7rem] p-6 ${
                index === 0
                  ? "bg-[var(--paper)] text-[var(--ink)]"
                  : "bg-white/[0.045] text-[var(--paper)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-[0.08em] uppercase opacity-55">
                  {stat.label}
                </span>
                <Icon className="size-4 opacity-50" aria-hidden="true" />
              </div>
              <p className="font-display mt-6 text-6xl leading-none">
                {loading ? (
                  <span className="animate-pulse opacity-20">—</span>
                ) : (
                  stat.value
                )}
              </p>
            </div>
          );
        })}
      </section>

      <section className="mt-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-[var(--brass)] uppercase">
              Back on the turntable
            </p>
            <h2 className="font-display mt-2 text-4xl">Recently added</h2>
          </div>
          <Link
            href="/collection"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/52 hover:bg-white/6 hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:outline-none"
          >
            View all <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="aspect-square animate-pulse rounded-md bg-white/6"
              />
            ))}
          </div>
        ) : recent.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-7">
            {recent.map((copy) => (
              <Link
                key={copy.id}
                href={`/collection/${copy.id}`}
                className="group rounded-sm focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:outline-none"
              >
                <Artwork
                  src={copy.release.coverArtUrl}
                  alt={`Cover of ${copy.release.title}`}
                  className="rounded-sm transition duration-500 motion-safe:group-hover:-translate-y-1"
                />
                <h3 className="font-display mt-4 truncate text-xl">
                  {copy.release.title}
                </h3>
                <p className="mt-1 truncate text-xs text-white/42">
                  {copy.release.artist} · {formatDate(copy.addedAt)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[2rem] bg-white/4 p-10 text-center">
            <p className="font-display text-3xl">
              Your first record belongs here.
            </p>
            <Link
              href="/identify"
              className="mt-5 inline-flex text-sm text-[var(--brass)] underline underline-offset-4"
            >
              Start identifying
            </Link>
          </div>
        )}
      </section>

      {(analytics.topGenres.length > 0 || analytics.decades.length > 0) && (
        <section className="mt-20 grid gap-12 border-t border-white/8 pt-14 lg:grid-cols-2">
          <Distribution
            title="Genres in rotation"
            items={analytics.topGenres}
            total={analytics.totalCopies}
          />
          <Distribution
            title="Across the decades"
            items={analytics.decades}
            total={analytics.totalCopies}
          />
        </section>
      )}
    </div>
  );
}

function Distribution({
  title,
  items,
  total,
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
  total: number;
}) {
  return (
    <div>
      <h2 className="font-display text-3xl">{title}</h2>
      <div className="mt-7 space-y-5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-white/68">{item.label}</span>
              <span className="text-white/36">{item.count}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-[var(--brass)]"
                style={{
                  width: `${Math.max(8, (item.count / Math.max(1, total)) * 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
