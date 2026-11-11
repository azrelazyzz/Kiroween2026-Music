"use client";

import {
  ArrowLeft,
  ExternalLink,
  Heart,
  MapPin,
  PencilLine,
  Tag,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Artwork } from "@/components/artwork";
import { useCollection } from "@/components/collection-provider";
import { Button } from "@/components/ui/button";
import type { Condition } from "@/lib/domain/types";
import { formatDate } from "@/lib/utils";

const conditions: Condition[] = [
  "Mint",
  "Near Mint",
  "Very Good Plus",
  "Very Good",
  "Good Plus",
  "Good",
  "Fair",
  "Poor",
];

export default function RecordDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getCopy, loading, updateCopy, removeCopy } = useCollection();
  const copy = getCopy(params.id);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notes, setNotes] = useState("");
  const [shelf, setShelf] = useState("");
  const [tags, setTags] = useState("");
  const [mediaCondition, setMediaCondition] = useState<Condition>("Very Good");
  const [sleeveCondition, setSleeveCondition] =
    useState<Condition>("Very Good");
  const [status, setStatus] = useState("");

  function beginEditing() {
    if (!copy) return;
    setNotes(copy.notes ?? "");
    setShelf(copy.shelf ?? "");
    setTags(copy.tags.join(", "));
    setMediaCondition(copy.mediaCondition ?? "Very Good");
    setSleeveCondition(copy.sleeveCondition ?? "Very Good");
    setEditing(true);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20 text-white/45">
        Opening sleeve notes…
      </div>
    );
  }

  if (!copy) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="font-display text-5xl">
          That copy is not on this shelf.
        </h1>
        <p className="mt-4 text-white/45">
          It may have been removed or the demo collection may have been reset.
        </p>
        <Link
          href="/collection"
          className="mt-8 inline-flex text-[var(--brass)] underline underline-offset-4"
        >
          Return to collection
        </Link>
      </div>
    );
  }

  const release = copy.release;
  const label = release.labels[0];
  const format = release.formats[0];

  async function saveEdits() {
    await updateCopy(copy!.id, {
      notes: notes.trim(),
      shelf: shelf.trim(),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 30),
      mediaCondition,
      sleeveCondition,
    });
    setEditing(false);
    setStatus("Copy details saved.");
  }

  async function deleteCopy() {
    await removeCopy(copy!.id);
    router.push("/collection");
  }

  return (
    <div className="mx-auto max-w-[1320px] px-5 py-10 sm:px-8 sm:py-16">
      <Link
        href="/collection"
        className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm text-white/48 hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:outline-none"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to collection
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(300px,0.78fr)_1.22fr] lg:gap-20">
        <div>
          <Artwork
            src={release.coverArtUrl}
            alt={`Cover of ${release.title} by ${release.artist}`}
            priority
            className="rounded-sm"
          />
          {release.demo ? (
            <p className="mt-4 rounded-xl bg-[var(--brass)]/12 px-4 py-3 text-xs leading-5 text-[#e0bd86]">
              Fictional demonstration release and original demo artwork.
            </p>
          ) : null}
        </div>

        <div className="pt-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold tracking-[0.18em] text-[var(--brass)] uppercase">
              {release.source.provider} release
            </span>
            <span className="size-1 rounded-full bg-white/20" />
            <span className="text-xs text-white/38">
              Added {formatDate(copy.addedAt)}
            </span>
          </div>
          <h1 className="font-display mt-5 text-5xl leading-[0.96] tracking-[-0.045em] sm:text-7xl">
            {release.title}
          </h1>
          <p className="mt-4 text-xl text-white/52">{release.artist}</p>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7 border-y border-white/8 py-8 sm:grid-cols-3">
            <Fact
              term="Released"
              value={
                release.releaseDate ??
                (release.year ? String(release.year) : undefined)
              }
            />
            <Fact term="Country" value={release.country} />
            <Fact
              term="Format"
              value={
                format ? [format.name, ...format.details].join(", ") : undefined
              }
            />
            <Fact term="Label" value={label?.name} />
            <Fact term="Catalogue" value={label?.catalogueNumber} />
            <Fact term="Barcode" value={release.barcode} />
          </dl>

          {release.identifiers.length > 0 ? (
            <section className="mt-9">
              <h2 className="text-xs font-bold tracking-[0.16em] text-white/38 uppercase">
                Edition identifiers
              </h2>
              <dl className="mt-4 space-y-3">
                {release.identifiers.map((identifier) => (
                  <div
                    key={`${identifier.type}-${identifier.value}`}
                    className="flex flex-col gap-1 rounded-xl bg-white/4 px-4 py-3 sm:flex-row sm:justify-between"
                  >
                    <dt className="text-xs text-white/38">{identifier.type}</dt>
                    <dd className="font-mono text-xs text-white/72">
                      {identifier.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <section className="mt-10 rounded-[1.6rem] bg-[var(--paper)] p-6 text-[var(--ink)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.16em] text-black/40 uppercase">
                  Your physical copy
                </p>
                <h2 className="font-display mt-1 text-3xl">Sleeve notes</h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  void updateCopy(copy.id, { favorite: !copy.favorite })
                }
                className={`grid size-11 place-items-center rounded-full outline-none focus:ring-2 focus:ring-[var(--oxblood)] ${copy.favorite ? "bg-[var(--oxblood)] text-white" : "bg-black/7 text-black/48"}`}
                aria-label={
                  copy.favorite ? "Remove from favorites" : "Add to favorites"
                }
              >
                <Heart
                  className={`size-5 ${copy.favorite ? "fill-current" : ""}`}
                  aria-hidden="true"
                />
              </button>
            </div>

            {editing ? (
              <div className="mt-7 grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectCondition
                    label="Media condition"
                    value={mediaCondition}
                    onChange={setMediaCondition}
                  />
                  <SelectCondition
                    label="Sleeve condition"
                    value={sleeveCondition}
                    onChange={setSleeveCondition}
                  />
                </div>
                <label className="grid gap-2 text-sm font-medium">
                  Shelf or location
                  <input
                    value={shelf}
                    onChange={(event) => setShelf(event.target.value)}
                    maxLength={100}
                    className="h-11 rounded-xl border border-black/12 bg-white/55 px-3 outline-none focus:ring-2 focus:ring-[var(--oxblood)]"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Tags
                  <input
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    maxLength={800}
                    placeholder="DJ bag, favorite pressing"
                    className="h-11 rounded-xl border border-black/12 bg-white/55 px-3 outline-none focus:ring-2 focus:ring-[var(--oxblood)]"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Personal notes
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={5000}
                    rows={4}
                    className="rounded-xl border border-black/12 bg-white/55 p-3 outline-none focus:ring-2 focus:ring-[var(--oxblood)]"
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => void saveEdits()}>Save changes</Button>
                  <Button
                    variant="ghost"
                    className="text-[var(--ink)]"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-7">
                <div className="grid gap-5 sm:grid-cols-2">
                  <CopyFact label="Media" value={copy.mediaCondition} />
                  <CopyFact label="Sleeve" value={copy.sleeveCondition} />
                  <CopyFact
                    label="Shelf"
                    value={copy.shelf}
                    icon={<MapPin className="size-3.5" />}
                  />
                  <CopyFact
                    label="Tags"
                    value={copy.tags.join(", ") || undefined}
                    icon={<Tag className="size-3.5" />}
                  />
                </div>
                {copy.notes ? (
                  <p className="mt-6 border-t border-black/10 pt-6 text-sm leading-7 text-black/60">
                    {copy.notes}
                  </p>
                ) : null}
                <Button className="mt-7" onClick={beginEditing}>
                  <PencilLine className="size-4" /> Edit copy details
                </Button>
              </div>
            )}
          </section>

          {release.tracks.length > 0 ? (
            <section className="mt-12">
              <h2 className="font-display text-3xl">Track listing</h2>
              <ol className="mt-5 divide-y divide-white/7">
                {release.tracks.map((track, index) => (
                  <li
                    key={`${track.position}-${track.title}-${index}`}
                    className="grid grid-cols-[2.5rem_1fr_auto] gap-3 py-4 text-sm"
                  >
                    <span className="font-mono text-xs text-white/30">
                      {track.position ?? index + 1}
                    </span>
                    <span className="text-white/72">{track.title}</span>
                    <span className="text-white/30">{track.duration}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-white/8 pt-8">
            {release.source.url ? (
              <a
                href={release.source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[var(--brass)] underline underline-offset-4"
              >
                View authoritative source <ExternalLink className="size-3.5" />
              </a>
            ) : null}
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="ml-auto inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs text-red-300/65 hover:bg-red-950/30 hover:text-red-200"
              >
                <Trash2 className="size-3.5" /> Remove this copy
              </button>
            ) : (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-white/45">
                  Remove permanently?
                </span>
                <Button
                  size="small"
                  variant="danger"
                  onClick={() => void deleteCopy()}
                >
                  Remove
                </Button>
                <Button
                  size="small"
                  variant="ghost"
                  onClick={() => setConfirmDelete(false)}
                >
                  Keep
                </Button>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-emerald-300" role="status">
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}

function Fact({ term, value }: { term: string; value?: string | undefined }) {
  return (
    <div>
      <dt className="text-[10px] font-bold tracking-[0.14em] text-white/30 uppercase">
        {term}
      </dt>
      <dd className="mt-2 text-sm text-white/72">
        {value ?? "Not documented"}
      </dd>
    </div>
  );
}

function CopyFact({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | undefined;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-black/38 uppercase">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm text-black/65">{value ?? "Not recorded"}</p>
    </div>
  );
}

function SelectCondition({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Condition;
  onChange(value: Condition): void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Condition)}
        className="h-11 rounded-xl border border-black/12 bg-white/55 px-3 outline-none focus:ring-2 focus:ring-[var(--oxblood)]"
      >
        {conditions.map((condition) => (
          <option key={condition}>{condition}</option>
        ))}
      </select>
    </label>
  );
}
