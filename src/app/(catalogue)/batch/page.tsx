"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Images,
  LoaderCircle,
  RotateCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";

type QueueStatus = "pending" | "identifying" | "awaiting" | "saved" | "failed";
type QueueItem = {
  id: string;
  file: File;
  status: QueueStatus;
  message?: string | undefined;
};

const statusLabels: Record<QueueStatus, string> = {
  pending: "Pending",
  identifying: "Identifying",
  awaiting: "Awaiting confirmation",
  saved: "Saved",
  failed: "Failed",
};

export default function BatchPage() {
  const [items, setItems] = useState<QueueItem[]>([]);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const accepted = [...files]
      .filter((file) =>
        ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      )
      .filter((file) => file.size <= 8 * 1024 * 1024)
      .slice(0, Math.max(0, 12 - items.length))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "pending" as const,
      }));
    setItems((current) => [...current, ...accepted]);
  }

  async function processItem(item: QueueItem) {
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? { ...entry, status: "identifying", message: undefined }
          : entry,
      ),
    );
    const form = new FormData();
    form.set("image", item.file);
    try {
      const response = await fetch("/api/vision", {
        method: "POST",
        body: form,
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
          : "No candidate was produced.";
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, status: response.ok ? "awaiting" : "failed", message }
            : entry,
        ),
      );
    } catch {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: "failed",
                message:
                  "The image could not be processed. It remains available for retry.",
              }
            : entry,
        ),
      );
    }
  }

  async function processPending() {
    for (const item of items.filter(
      (entry) => entry.status === "pending" || entry.status === "failed",
    )) {
      await processItem(item);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <PageHeading
        eyebrow="High-volume intake"
        title="Batch desk"
        description="Stage up to 12 cover photos, monitor each item independently, and retry failures without losing the rest of the queue. Vision identification is optional and honestly reports when it is unavailable."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <section className="rounded-[1.8rem] bg-white/[0.045] p-6">
          <span className="grid size-12 place-items-center rounded-full bg-[var(--oxblood)]/20 text-[#e8a5b0]">
            <Images className="size-5" />
          </span>
          <h2 className="font-display mt-6 text-3xl">Add cover photos</h2>
          <p className="mt-3 text-sm leading-6 text-white/42">
            Files remain in this page until processing starts. This deployment
            does not store uploads because AI vision is not configured.
          </p>
          <label className="mt-7 grid min-h-44 cursor-pointer place-items-center rounded-[1.4rem] border border-dashed border-white/18 bg-black/15 p-5 text-center focus-within:ring-2 focus-within:ring-[var(--brass)] hover:border-[var(--brass)]/55">
            <span>
              <Upload className="mx-auto size-6 text-[var(--brass)]" />
              <span className="mt-3 block text-sm font-medium">
                Choose multiple images
              </span>
              <span className="mt-1 block text-xs text-white/32">
                JPEG, PNG, WebP · 8 MB each
              </span>
            </span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          <Button
            className="mt-5 w-full"
            onClick={() => void processPending()}
            disabled={
              !items.some(
                (item) => item.status === "pending" || item.status === "failed",
              )
            }
          >
            Process queue
          </Button>
        </section>

        <section aria-labelledby="queue-title">
          <div className="flex items-center justify-between border-b border-white/8 pb-5">
            <h2 id="queue-title" className="font-display text-3xl">
              Processing queue
            </h2>
            <span className="text-xs text-white/32">{items.length} / 12</span>
          </div>
          {items.length === 0 ? (
            <div className="mt-5 grid min-h-80 place-items-center rounded-[1.8rem] bg-white/[0.025] p-8 text-center">
              <div>
                <Clock3 className="mx-auto size-9 text-white/22" />
                <p className="font-display mt-5 text-3xl">
                  The queue is clear.
                </p>
                <p className="mt-2 text-sm text-white/36">
                  Add several cover photos to prepare a cataloguing session.
                </p>
              </div>
            </div>
          ) : (
            <ul className="mt-5 space-y-3" aria-live="polite">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-[1.3rem] bg-white/[0.045] p-4"
                >
                  <div className="flex items-center gap-4">
                    <StatusIcon status={item.status} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.file.name}
                      </p>
                      <p className="mt-1 text-xs text-white/32">
                        {statusLabels[item.status]} ·{" "}
                        {(item.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    {item.status === "failed" || item.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => void processItem(item)}
                        className="grid size-10 place-items-center rounded-full text-white/40 hover:bg-white/7 hover:text-white"
                        aria-label={`Process ${item.file.name}`}
                      >
                        <RotateCw className="size-4" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        setItems((current) =>
                          current.filter((entry) => entry.id !== item.id),
                        )
                      }
                      className="grid size-10 place-items-center rounded-full text-white/35 hover:bg-red-950/30 hover:text-red-200"
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  {item.message ? (
                    <p className="mt-3 border-t border-white/7 pt-3 text-xs leading-5 text-white/42">
                      {item.message}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: QueueStatus }) {
  const classes = "size-5 shrink-0";
  if (status === "identifying")
    return (
      <LoaderCircle className={`${classes} animate-spin text-[var(--brass)]`} />
    );
  if (status === "failed")
    return <AlertCircle className={`${classes} text-red-300`} />;
  if (status === "saved")
    return <CheckCircle2 className={`${classes} text-emerald-300`} />;
  return <Clock3 className={`${classes} text-white/30`} />;
}
