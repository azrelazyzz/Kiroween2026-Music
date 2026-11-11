"use client";

import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Barcode,
  Camera,
  Check,
  ChevronDown,
  Disc3,
  ExternalLink,
  FileText,
  LoaderCircle,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { z } from "zod";

import { Artwork } from "@/components/artwork";
import { BarcodeCamera } from "@/components/barcode-camera";
import { useCollection } from "@/components/collection-provider";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { Input } from "@/components/ui/input";
import { DEMO_BARCODE } from "@/lib/demo/fixtures";
import { identifyResponseSchema } from "@/lib/domain/schemas";
import type {
  Condition,
  Evidence,
  IdentificationMethod,
  MatchCandidate,
} from "@/lib/domain/types";

type Mode = "barcode" | "search" | "runout" | "photo";
type IdentifySuccess = Extract<
  z.infer<typeof identifyResponseSchema>,
  { data: MatchCandidate[] }
>;

const modes: Array<{
  id: Mode;
  label: string;
  detail: string;
  icon: typeof Barcode;
}> = [
  { id: "barcode", label: "Barcode", detail: "Fastest", icon: Barcode },
  { id: "search", label: "Details", detail: "Artist & title", icon: Search },
  { id: "runout", label: "Runout", detail: "Exact pressing", icon: FileText },
  { id: "photo", label: "Photo", detail: "Optional AI", icon: Camera },
];

async function identify(evidence: Evidence): Promise<IdentifySuccess> {
  const response = await fetch("/api/identify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(evidence),
  });
  const payload: unknown = await response.json();
  const parsed = identifyResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(
      "The identification service returned an unexpected response.",
    );
  }
  if ("error" in parsed.data) throw new Error(parsed.data.error.message);
  return parsed.data;
}

export function IdentifyWorkspace() {
  const [mode, setMode] = useState<Mode>("barcode");
  const [barcode, setBarcode] = useState("");
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [catalogueNumber, setCatalogueNumber] = useState("");
  const [country, setCountry] = useState("");
  const [year, setYear] = useState("");
  const [format, setFormat] = useState("Vinyl");
  const [matrix, setMatrix] = useState("");
  const [selected, setSelected] = useState<MatchCandidate | null>(null);
  const [submittedEvidence, setSubmittedEvidence] = useState<Evidence>({});
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: identify,
    onSuccess: () => setSelected(null),
  });

  function submitEvidence(evidence: Evidence) {
    setSubmittedEvidence(evidence);
    mutation.mutate(evidence);
  }

  function handleBarcode(event: FormEvent) {
    event.preventDefault();
    if (!barcode.trim()) return;
    submitEvidence({ barcode: barcode.trim() });
  }

  function detailEvidence(includeMatrix = false): Evidence {
    return {
      ...(artist.trim() ? { artist: artist.trim() } : {}),
      ...(title.trim() ? { title: title.trim() } : {}),
      ...(label.trim() ? { label: label.trim() } : {}),
      ...(catalogueNumber.trim()
        ? { catalogueNumber: catalogueNumber.trim() }
        : {}),
      ...(country.trim() ? { country: country.trim() } : {}),
      ...(year.trim() ? { year: Number(year) } : {}),
      ...(format.trim() ? { format: format.trim() } : {}),
      ...(includeMatrix && matrix.trim() ? { matrix: matrix.trim() } : {}),
    };
  }

  function handleDetails(event: FormEvent) {
    event.preventDefault();
    submitEvidence(detailEvidence());
  }

  function handleRunout(event: FormEvent) {
    event.preventDefault();
    submitEvidence(detailEvidence(true));
  }

  async function handlePhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPhotoStatus("Checking image support…");
    try {
      const response = await fetch("/api/vision", {
        method: "POST",
        body: formData,
      });
      const payload: unknown = await response.json();
      const message =
        typeof payload === "object" &&
        payload !== null &&
        "error" in payload &&
        typeof payload.error === "object" &&
        payload.error !== null &&
        "message" in payload.error &&
        typeof payload.error.message === "string"
          ? payload.error.message
          : "Photo analysis is unavailable.";
      setPhotoStatus(message);
    } catch {
      setPhotoStatus(
        "The photo could not be checked. Your image was not saved.",
      );
    }
  }

  const result = mutation.data;

  return (
    <div className="mx-auto max-w-[1480px] px-5 py-12 sm:px-8 sm:py-16">
      <PageHeading
        eyebrow="Identification studio"
        title="Find your pressing."
        description="Start with the strongest clue you have. We rank structured release records and show exactly what matched, what conflicts, and what still needs checking."
      />

      <div className="mt-12 grid gap-10 xl:grid-cols-[0.78fr_1.22fr] xl:gap-14">
        <section aria-labelledby="identify-method-heading">
          <h2 id="identify-method-heading" className="sr-only">
            Choose an identification method
          </h2>
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2"
            role="tablist"
            aria-label="Identification method"
          >
            {modes.map((item) => {
              const Icon = item.icon;
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls="identify-panel"
                  onClick={() => {
                    setMode(item.id);
                    mutation.reset();
                    setSelected(null);
                  }}
                  className={`rounded-[1.3rem] p-4 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] ${active ? "bg-[var(--paper)] text-[var(--ink)]" : "bg-white/[0.045] text-white/58 hover:bg-white/7"}`}
                >
                  <Icon
                    className="size-5"
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                  <span className="mt-5 block text-sm font-semibold">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-[10px] opacity-48">
                    {item.detail}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            id="identify-panel"
            role="tabpanel"
            className="mt-3 rounded-[1.8rem] bg-white/[0.045] p-5 sm:p-7"
          >
            {mode === "barcode" ? (
              <form onSubmit={handleBarcode} className="space-y-5">
                <div>
                  <h2 className="font-display text-3xl">Scan the jacket</h2>
                  <p className="mt-2 text-sm leading-6 text-white/42">
                    Barcodes narrow the release, but regional editions can still
                    share one. Compare the details before saving.
                  </p>
                </div>
                <BarcodeCamera
                  onDetected={(value) => {
                    setBarcode(value);
                    submitEvidence({ barcode: value });
                  }}
                />
                <Input
                  label="Barcode number"
                  name="barcode"
                  inputMode="numeric"
                  autoComplete="off"
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  placeholder="e.g. 0712345678901"
                  hint="Spaces and punctuation are ignored for matching; the value you enter is preserved."
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending || barcode.trim().length < 6}
                >
                  {mutation.isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Barcode className="size-4" />
                  )}
                  Find releases
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setBarcode(DEMO_BARCODE);
                    submitEvidence({ barcode: DEMO_BARCODE });
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--brass)] hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:outline-none"
                >
                  <Sparkles className="size-3.5" /> Try fictional demo barcode
                </button>
              </form>
            ) : null}

            {mode === "search" ? (
              <form onSubmit={handleDetails} className="space-y-5">
                <div>
                  <h2 className="font-display text-3xl">
                    Describe the release
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/42">
                    Artist and title are enough to begin. Add edition clues to
                    improve the ranking.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Artist"
                    name="artist"
                    value={artist}
                    onChange={(event) => setArtist(event.target.value)}
                    placeholder="Artist name"
                  />
                  <Input
                    label="Release title"
                    name="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Album or single"
                  />
                  <Input
                    label="Label"
                    name="label"
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    placeholder="Record label"
                  />
                  <Input
                    label="Catalogue number"
                    name="catalogueNumber"
                    value={catalogueNumber}
                    onChange={(event) => setCatalogueNumber(event.target.value)}
                    placeholder="e.g. ST-2047"
                  />
                  <Input
                    label="Country"
                    name="country"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    placeholder="e.g. GB or Japan"
                  />
                  <Input
                    label="Release year"
                    name="year"
                    inputMode="numeric"
                    value={year}
                    onChange={(event) =>
                      setYear(event.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="e.g. 1978"
                  />
                </div>
                <Input
                  label="Format"
                  name="format"
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                  placeholder="Vinyl"
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    mutation.isPending ||
                    (!artist.trim() && !title.trim() && !catalogueNumber.trim())
                  }
                >
                  {mutation.isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                  Search and rank
                </Button>
              </form>
            ) : null}

            {mode === "runout" ? (
              <form onSubmit={handleRunout} className="space-y-5">
                <div>
                  <h2 className="font-display text-3xl">Read the dead wax</h2>
                  <p className="mt-2 text-sm leading-6 text-white/42">
                    Enter the marking exactly as seen. MusicBrainz does not
                    index runouts consistently, so artist or title helps find
                    candidates.
                  </p>
                </div>
                <Input
                  label="Matrix / runout marking"
                  name="matrix"
                  value={matrix}
                  onChange={(event) => setMatrix(event.target.value)}
                  placeholder="e.g. AE 017 A1 LUMEN"
                  hint="We normalize separators for comparison without changing your original note."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Artist (recommended)"
                    name="runoutArtist"
                    value={artist}
                    onChange={(event) => setArtist(event.target.value)}
                    placeholder="Artist name"
                  />
                  <Input
                    label="Title (recommended)"
                    name="runoutTitle"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Release title"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending || matrix.trim().length < 2}
                >
                  {mutation.isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                  Compare runout
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    const value = "AE 017 A1 LUMEN";
                    setMatrix(value);
                    submitEvidence({ matrix: value, format: "Vinyl" });
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--brass)] hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:outline-none"
                >
                  <Sparkles className="size-3.5" /> Try fictional demo runout
                </button>
              </form>
            ) : null}

            {mode === "photo" ? (
              <form
                onSubmit={(event) => void handlePhoto(event)}
                className="space-y-5"
              >
                <div>
                  <h2 className="font-display text-3xl">
                    Photograph the cover
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/42">
                    AI can extract visible clues, but it cannot reliably
                    distinguish pressings that share artwork. Structured
                    metadata must verify every suggestion.
                  </p>
                </div>
                <label className="grid min-h-56 cursor-pointer place-items-center rounded-[1.4rem] border border-dashed border-white/18 bg-black/15 p-6 text-center focus-within:ring-2 focus-within:ring-[var(--brass)] hover:border-[var(--brass)]/55">
                  <span>
                    <Upload
                      className="mx-auto size-7 text-[var(--brass)]"
                      aria-hidden="true"
                    />
                    <span className="mt-4 block text-sm font-medium">
                      Choose a cover photo
                    </span>
                    <span className="mt-2 block text-xs text-white/35">
                      JPEG, PNG, or WebP up to 8 MB
                    </span>
                  </span>
                  <input
                    name="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    required
                  />
                </label>
                <Button type="submit" className="w-full">
                  <Camera className="size-4" /> Check photo support
                </Button>
                {photoStatus ? (
                  <p
                    role="status"
                    className="rounded-xl bg-[var(--brass)]/10 p-4 text-sm leading-6 text-[#dfbf8b]"
                  >
                    {photoStatus}
                  </p>
                ) : null}
              </form>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="candidate-heading" className="min-w-0">
          <div className="flex items-end justify-between border-b border-white/8 pb-5">
            <div>
              <p className="text-[10px] font-bold tracking-[0.17em] text-white/30 uppercase">
                Candidate desk
              </p>
              <h2 id="candidate-heading" className="font-display mt-2 text-3xl">
                Possible editions
              </h2>
            </div>
            {result ? (
              <span className="text-xs text-white/35">
                {result.data.length} found
              </span>
            ) : null}
          </div>

          <div aria-live="polite" aria-busy={mutation.isPending}>
            {mutation.isPending ? <CandidateSkeleton /> : null}
            {mutation.isError ? (
              <div
                className="mt-6 rounded-[1.6rem] bg-red-950/32 p-6"
                role="alert"
              >
                <AlertTriangle
                  className="size-5 text-red-300"
                  aria-hidden="true"
                />
                <h3 className="mt-4 font-semibold">Identification paused</h3>
                <p className="mt-2 text-sm leading-6 text-red-100/62">
                  {mutation.error.message}
                </p>
                <Button
                  variant="outline"
                  size="small"
                  className="mt-5"
                  onClick={() => mutation.mutate(submittedEvidence)}
                >
                  Try again
                </Button>
              </div>
            ) : null}

            {!mutation.isPending && !mutation.isError && !result ? (
              <CandidateEmpty />
            ) : null}

            {result?.meta.demo ? (
              <div className="mt-6 flex gap-3 rounded-xl bg-[var(--brass)]/10 p-4 text-xs leading-5 text-[#dfbf8b]">
                <Sparkles
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                These are fictional demonstration candidates, not external
                search results.
              </div>
            ) : null}

            {result && result.data.length === 0 ? (
              <div className="mt-8 rounded-[1.6rem] bg-white/4 px-6 py-14 text-center">
                <Disc3
                  className="mx-auto size-9 text-white/24"
                  aria-hidden="true"
                />
                <h3 className="font-display mt-5 text-3xl">
                  No reliable candidate yet.
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/42">
                  Keep your original clue and add an artist, title, label, or
                  catalogue number. Missing metadata is better than a guessed
                  edition.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setMode("search")}
                  >
                    Add more details
                  </Button>
                  <Link
                    href="/manual"
                    className="inline-flex min-h-9 items-center rounded-full px-4 text-xs font-semibold text-[var(--brass)] underline underline-offset-4"
                  >
                    Create a manual record
                  </Link>
                </div>
              </div>
            ) : null}

            <AnimatePresence mode="popLayout">
              {result?.data.map((candidate, index) => (
                <motion.div
                  key={`${candidate.release.source.provider}:${candidate.release.source.releaseId}`}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                >
                  <CandidateCard
                    candidate={candidate}
                    rank={index + 1}
                    selected={
                      selected?.release.source.releaseId ===
                      candidate.release.source.releaseId
                    }
                    onSelect={() => setSelected(candidate)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {selected ? (
          <SavePanel
            candidate={selected}
            evidence={submittedEvidence}
            method={
              result?.meta.demo ? "demo" : mode === "search" ? "search" : mode
            }
            onClose={() => setSelected(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CandidateCard({
  candidate,
  rank,
  selected,
  onSelect,
}: {
  candidate: MatchCandidate;
  rank: number;
  selected: boolean;
  onSelect(): void;
}) {
  const { release } = candidate;
  const label = release.labels[0];
  const format = release.formats[0];
  return (
    <article
      className={`mt-5 rounded-[1.6rem] p-4 transition sm:p-5 ${selected ? "bg-white/10 ring-1 ring-[var(--brass)]/60" : "bg-white/[0.045] hover:bg-white/[0.065]"}`}
    >
      <div className="grid grid-cols-[92px_1fr] gap-4 sm:grid-cols-[128px_1fr] sm:gap-6">
        <Artwork
          src={release.coverArtUrl}
          alt={`Cover of ${release.title}`}
          className="rounded-sm"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-white/28">#{rank}</span>
            <ConfidenceBadge
              confidence={candidate.confidence}
              score={candidate.score}
            />
            {release.demo ? (
              <span className="rounded-full bg-white/8 px-2 py-1 text-[9px] font-bold tracking-wider text-white/45 uppercase">
                Demo
              </span>
            ) : null}
          </div>
          <h3 className="font-display mt-3 truncate text-2xl sm:text-3xl">
            {release.title}
          </h3>
          <p className="mt-1 truncate text-sm text-white/52">
            {release.artist}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-xs sm:grid-cols-3">
            <MiniFact label="Date" value={release.releaseDate} />
            <MiniFact label="Country" value={release.country} />
            <MiniFact label="Label" value={label?.name} />
            <MiniFact label="Catalogue" value={label?.catalogueNumber} />
            <MiniFact
              label="Format"
              value={
                format ? [format.name, ...format.details].join(", ") : undefined
              }
            />
            <MiniFact label="Barcode" value={release.barcode} />
          </dl>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/7 pt-4">
        <details className="group flex-1">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs text-white/48 hover:text-white">
            Why this rank{" "}
            <ChevronDown className="size-3.5 transition group-open:rotate-180" />
          </summary>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {candidate.reasons.map((item) => (
              <li
                key={`${item.field}-${item.explanation}`}
                className="flex items-start gap-2 text-xs leading-5 text-white/48"
              >
                <span
                  className={`mt-1.5 size-1.5 shrink-0 rounded-full ${item.outcome === "match" ? "bg-emerald-400" : item.outcome === "conflict" ? "bg-red-400" : "bg-white/25"}`}
                />
                {item.explanation}{" "}
                <span className="text-white/24">
                  ({item.points > 0 ? "+" : ""}
                  {item.points})
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] leading-4 text-white/28">
            The 0–100 evidence score is a deterministic ranking aid, not a
            calibrated probability.
          </p>
        </details>
        {release.source.url ? (
          <a
            href={release.source.url}
            target="_blank"
            rel="noreferrer"
            className="grid size-10 place-items-center rounded-full text-white/38 hover:bg-white/6 hover:text-white"
            aria-label="Open authoritative release source"
          >
            <ExternalLink className="size-4" />
          </a>
        ) : null}
        <Button size="small" onClick={onSelect}>
          Add this copy <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </article>
  );
}

function MiniFact({
  label,
  value,
}: {
  label: string;
  value?: string | undefined;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-bold tracking-wider text-white/25 uppercase">
        {label}
      </dt>
      <dd className="mt-1 truncate text-white/58" title={value}>
        {value ?? "Not listed"}
      </dd>
    </div>
  );
}

function CandidateSkeleton() {
  return (
    <div className="mt-5 space-y-5" aria-label="Searching release data">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="grid animate-pulse grid-cols-[92px_1fr] gap-5 rounded-[1.6rem] bg-white/4 p-4"
        >
          <div className="aspect-square rounded bg-white/8" />
          <div>
            <div className="h-4 w-28 rounded bg-white/8" />
            <div className="mt-4 h-7 w-2/3 rounded bg-white/8" />
            <div className="mt-3 h-3 w-1/3 rounded bg-white/8" />
            <div className="mt-5 h-12 rounded bg-white/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CandidateEmpty() {
  return (
    <div className="mt-5 grid min-h-[420px] place-items-center rounded-[1.8rem] bg-white/[0.025] p-8 text-center">
      <div>
        <span className="vinyl-grooves mx-auto grid size-24 place-items-center rounded-full text-[var(--brass)]">
          <Disc3 className="size-9" strokeWidth={1} />
        </span>
        <h3 className="font-display mt-7 text-3xl">
          Every pressing leaves clues.
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/38">
          Choose a method and submit what you can see. Your evidence stays in
          place if an external provider is unavailable.
        </p>
      </div>
    </div>
  );
}

function SavePanel({
  candidate,
  evidence,
  method,
  onClose,
}: {
  candidate: MatchCandidate;
  evidence: Evidence;
  method: IdentificationMethod;
  onClose(): void;
}) {
  const { addCopy, duplicateCount, mode } = useCollection();
  const idempotencyKey = useRef(crypto.randomUUID());
  const [mediaCondition, setMediaCondition] =
    useState<Condition>("Very Good Plus");
  const [sleeveCondition, setSleeveCondition] =
    useState<Condition>("Very Good");
  const [shelf, setShelf] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const duplicates = duplicateCount(candidate.release);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const copy = await addCopy({
        release: candidate.release,
        evidence,
        identificationMethod: method,
        mediaCondition,
        sleeveCondition,
        ...(shelf.trim() ? { shelf: shelf.trim() } : {}),
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 30),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        favorite,
        idempotencyKey: idempotencyKey.current,
      });
      setSavedId(copy.id);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The record could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/72 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-copy-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <motion.div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-[var(--paper)] p-6 text-[var(--ink)] shadow-2xl sm:rounded-[2rem] sm:p-8"
        initial={{ y: 36 }}
        animate={{ y: 0 }}
        exit={{ y: 36 }}
      >
        {savedId ? (
          <div className="py-8 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--moss)] text-white">
              <Check className="size-7" />
            </span>
            <h2 id="save-copy-title" className="font-display mt-6 text-4xl">
              Back in the collection.
            </h2>
            <p className="mt-3 text-sm text-black/52">
              {candidate.release.title} was saved to your{" "}
              {mode === "cloud" ? "private cloud" : "browser’s demo"}{" "}
              collection.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={`/collection/${savedId}`}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--oxblood)] px-6 text-sm font-semibold text-white"
              >
                View saved copy
              </Link>
              <Button
                variant="ghost"
                className="text-[var(--ink)]"
                onClick={onClose}
              >
                Keep identifying
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-4">
              <Artwork
                src={candidate.release.coverArtUrl}
                alt=""
                className="w-20 shrink-0 rounded-sm shadow-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-wider text-black/38 uppercase">
                  Add physical copy
                </p>
                <h2
                  id="save-copy-title"
                  className="font-display mt-1 truncate text-3xl"
                >
                  {candidate.release.title}
                </h2>
                <p className="mt-1 truncate text-sm text-black/48">
                  {candidate.release.artist}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-3 py-2 text-sm text-black/45 hover:bg-black/5"
              >
                Close
              </button>
            </div>
            {duplicates > 0 ? (
              <p className="mt-5 rounded-xl bg-[var(--brass)]/22 p-4 text-xs leading-5 text-black/58">
                <strong>
                  You already own {duplicates}{" "}
                  {duplicates === 1 ? "copy" : "copies"} of this source release.
                </strong>{" "}
                Saving another creates a separate physical copy with its own
                condition and notes.
              </p>
            ) : null}
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <LightSelect
                label="Media condition"
                value={mediaCondition}
                onChange={setMediaCondition}
              />
              <LightSelect
                label="Sleeve condition"
                value={sleeveCondition}
                onChange={setSleeveCondition}
              />
              <LightInput
                label="Shelf or location"
                value={shelf}
                onChange={setShelf}
                placeholder="Optional"
              />
              <LightInput
                label="Tags"
                value={tags}
                onChange={setTags}
                placeholder="DJ bag, favorite pressing"
              />
            </div>
            <label className="mt-4 grid gap-2 text-sm font-semibold">
              Personal notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={5000}
                rows={3}
                className="rounded-xl border border-black/12 bg-white/55 p-3 font-normal outline-none focus:ring-2 focus:ring-[var(--oxblood)]"
                placeholder="Anything unique about this copy"
              />
            </label>
            <label className="mt-5 inline-flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={favorite}
                onChange={(event) => setFavorite(event.target.checked)}
                className="size-4 accent-[var(--oxblood)]"
              />
              Mark as a favorite
            </label>
            {error ? (
              <p className="mt-5 text-sm text-red-800" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              className="mt-7 w-full"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Disc3 className="size-4" />
              )}
              {saving ? "Saving copy…" : "Save to collection"}
            </Button>
            <p className="mt-3 text-center text-[10px] leading-4 text-black/38">
              {mode === "cloud"
                ? "This copy is protected by owner-scoped row-level security. Source identity and evidence are preserved."
                : "This demo saves locally in your browser. Source identity and identification evidence are preserved."}
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

const conditionOptions: Condition[] = [
  "Mint",
  "Near Mint",
  "Very Good Plus",
  "Very Good",
  "Good Plus",
  "Good",
  "Fair",
  "Poor",
];
function LightSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Condition;
  onChange(value: Condition): void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Condition)}
        className="h-11 rounded-xl border border-black/12 bg-white/55 px-3 font-normal outline-none focus:ring-2 focus:ring-[var(--oxblood)]"
      >
        {conditionOptions.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
function LightInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={800}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-black/12 bg-white/55 px-3 font-normal outline-none focus:ring-2 focus:ring-[var(--oxblood)]"
      />
    </label>
  );
}
