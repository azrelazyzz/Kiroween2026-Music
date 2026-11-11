"use client";

import { Disc3, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { useCollection } from "@/components/collection-provider";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Release } from "@/lib/domain/types";

export default function ManualEntryPage() {
  const { addCopy, mode } = useCollection();
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [label, setLabel] = useState("");
  const [catalogue, setCatalogue] = useState("");
  const [country, setCountry] = useState("");
  const [format, setFormat] = useState("Vinyl");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const releaseId = crypto.randomUUID();
    const release: Release = {
      source: { provider: "manual", releaseId },
      artist: artist.trim(),
      title: title.trim(),
      ...(year ? { year: Number(year), releaseDate: year } : {}),
      ...(country.trim() ? { country: country.trim() } : {}),
      labels: label.trim()
        ? [
            {
              name: label.trim(),
              ...(catalogue.trim()
                ? { catalogueNumber: catalogue.trim() }
                : {}),
            },
          ]
        : [],
      formats: format.trim() ? [{ name: format.trim(), details: [] }] : [],
      identifiers: [],
      genres: [],
      styles: [],
      tracks: [],
    };
    const copy = await addCopy({
      release,
      evidence: { artist: artist.trim(), title: title.trim() },
      identificationMethod: "manual",
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      tags: ["Needs research"],
      favorite: false,
      idempotencyKey: crypto.randomUUID(),
    });
    setSavedId(copy.id);
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <PageHeading
        eyebrow="Unidentified records"
        title="Create an honest placeholder."
        description="Record only what you can verify from the object in front of you. Leave unknown fields blank and return when you learn more."
      />
      {savedId ? (
        <div className="mt-12 rounded-[2rem] bg-[var(--paper)] p-8 text-center text-[var(--ink)]">
          <Disc3 className="mx-auto size-10 text-[var(--oxblood)]" />
          <h2 className="font-display mt-5 text-4xl">Placeholder saved.</h2>
          <p className="mt-3 text-sm text-black/52">
            Stored in your {mode === "cloud" ? "private cloud" : "local demo"}{" "}
            collection with manual provenance.
          </p>
          <Link
            href={`/collection/${savedId}`}
            className="mt-7 inline-flex min-h-11 items-center rounded-full bg-[var(--oxblood)] px-6 text-sm font-semibold text-white"
          >
            View record
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(event) => void save(event)}
          className="mt-12 rounded-[1.8rem] bg-white/[0.045] p-6 sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Artist as printed"
              name="manualArtist"
              required
              value={artist}
              onChange={(event) => setArtist(event.target.value)}
            />
            <Input
              label="Title as printed"
              name="manualTitle"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <Input
              label="Year"
              name="manualYear"
              inputMode="numeric"
              value={year}
              onChange={(event) =>
                setYear(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
            />
            <Input
              label="Country"
              name="manualCountry"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            />
            <Input
              label="Label"
              name="manualLabel"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
            <Input
              label="Catalogue number"
              name="manualCatalogue"
              value={catalogue}
              onChange={(event) => setCatalogue(event.target.value)}
            />
            <Input
              label="Format"
              name="manualFormat"
              value={format}
              onChange={(event) => setFormat(event.target.value)}
            />
          </div>
          <label className="mt-5 grid gap-2 text-sm text-[var(--muted)]">
            <span className="font-medium text-[var(--paper)]">
              Notes from the object
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={5000}
              rows={4}
              className="rounded-2xl border border-white/12 bg-white/[0.055] p-4 text-base text-[var(--paper)] outline-none focus:border-[var(--brass)] focus:ring-2 focus:ring-[var(--brass)]/20"
            />
          </label>
          <Button
            type="submit"
            className="mt-7 w-full"
            disabled={saving || !artist.trim() || !title.trim()}
          >
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Disc3 className="size-4" />
            )}
            {saving ? "Saving…" : "Save manual record"}
          </Button>
        </form>
      )}
    </div>
  );
}
