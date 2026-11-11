"use client";

import {
  Check,
  Cloud,
  Database,
  ExternalLink,
  LogOut,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useCollection } from "@/components/collection-provider";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { mode, userEmail, resetDemo, signOut } = useCollection();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  async function handleReset() {
    await resetDemo();
    setConfirmReset(false);
    setResetDone(true);
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <PageHeading
        eyebrow="Control room"
        title="Settings"
        description="Understand what is connected, where your records live, and what leaves this browser."
      />

      <div className="mt-14 space-y-5">
        <section className="rounded-[1.8rem] bg-[var(--paper)] p-6 text-[var(--ink)] sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--moss)] text-white">
              {mode === "cloud" ? (
                <Cloud className="size-5" aria-hidden="true" />
              ) : (
                <Database className="size-5" aria-hidden="true" />
              )}
            </span>
            <div className="flex-1">
              <p className="text-xs font-bold tracking-wider text-black/45 uppercase">
                Current persistence
              </p>
              <h2 className="font-display mt-2 text-3xl">
                {mode === "cloud"
                  ? "Private cloud collection"
                  : "Local demonstration mode"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/58">
                {mode === "cloud"
                  ? `Signed in as ${userEmail ?? "a Supabase user"}. Collection copies are stored with owner-scoped row-level security.`
                  : "Collection changes are stored only in this browser. The sample records are fictional. Live MusicBrainz searches send only the search clues you submit."}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {mode === "cloud" ? (
                  <Button variant="danger" onClick={() => void signOut()}>
                    <LogOut className="size-4" aria-hidden="true" /> Sign out
                    and open demo
                  </Button>
                ) : !confirmReset ? (
                  <Button
                    variant="danger"
                    onClick={() => {
                      setConfirmReset(true);
                      setResetDone(false);
                    }}
                  >
                    <RotateCcw className="size-4" aria-hidden="true" /> Reset
                    demo collection
                  </Button>
                ) : (
                  <div
                    className="flex flex-wrap items-center gap-3"
                    role="group"
                    aria-label="Confirm reset"
                  >
                    <Button variant="danger" onClick={() => void handleReset()}>
                      Yes, restore fixtures
                    </Button>
                    <Button
                      className="border-black/15 text-[var(--ink)] hover:bg-black/5"
                      variant="outline"
                      onClick={() => setConfirmReset(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                {resetDone ? (
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-800">
                    <Check className="size-4" /> Demo restored
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-[1.8rem] bg-white/[0.045] p-6 sm:p-8">
            <ShieldCheck
              className="size-6 text-[var(--brass)]"
              aria-hidden="true"
            />
            <h2 className="font-display mt-5 text-3xl">Privacy by design</h2>
            <p className="mt-3 text-sm leading-6 text-white/48">
              Provider credentials stay server-side. Cloud collections use
              owner-scoped row-level security. Uploaded-image storage is private
              and owner scoped.
            </p>
          </div>
          <div className="rounded-[1.8rem] bg-white/[0.045] p-6 sm:p-8">
            <ExternalLink
              className="size-6 text-[var(--brass)]"
              aria-hidden="true"
            />
            <h2 className="font-display mt-5 text-3xl">Metadata sources</h2>
            <p className="mt-3 text-sm leading-6 text-white/48">
              MusicBrainz is enabled for structured search. Cover Art Archive
              images remain copyrighted by their owners. Discogs and AI vision
              are not enabled.
            </p>
            <Link
              href="/about-demo-data"
              className="mt-5 inline-flex text-sm text-[var(--brass)] underline underline-offset-4"
            >
              Data and demo details
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
