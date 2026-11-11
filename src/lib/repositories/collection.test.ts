import { describe, expect, it } from "vitest";

import { demoIdentificationCandidates } from "@/lib/demo/fixtures";
import { calculateCollectionAnalytics } from "@/lib/domain/analytics";
import { DemoCollectionRepository } from "@/lib/repositories/collection";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("demo collection repository", () => {
  it("preserves separate physical copies of the same source release", async () => {
    const repository = new DemoCollectionRepository(new MemoryStorage());
    const release = demoIdentificationCandidates[0]!;
    const firstKey = "90df96ca-1638-45ae-8452-28f8eea5299e";
    const secondKey = "81f441f6-2ab8-4d3c-9d14-426043ac55b8";

    await repository.add({
      release,
      evidence: { barcode: release.barcode },
      identificationMethod: "barcode",
      tags: [],
      favorite: false,
      idempotencyKey: firstKey,
    });
    await repository.add({
      release,
      evidence: { barcode: release.barcode },
      identificationMethod: "barcode",
      tags: ["Duplicate"],
      favorite: false,
      idempotencyKey: secondKey,
    });

    const added = (await repository.list()).filter(
      (copy) => copy.id === firstKey || copy.id === secondKey,
    );
    expect(added).toHaveLength(2);
    expect(new Set(added.map((copy) => copy.id)).size).toBe(2);

    const analytics = calculateCollectionAnalytics(added);
    expect(analytics.totalCopies).toBe(2);
    expect(analytics.uniqueReleases).toBe(1);
  });

  it("makes a retried save idempotent", async () => {
    const repository = new DemoCollectionRepository(new MemoryStorage());
    const release = demoIdentificationCandidates[0]!;
    const input = {
      release,
      evidence: { barcode: release.barcode },
      identificationMethod: "barcode" as const,
      tags: [],
      favorite: false,
      idempotencyKey: "13fe4867-9578-4527-9370-a9ee92ba29fe",
    };

    const first = await repository.add(input);
    const retry = await repository.add(input);

    expect(retry.id).toBe(first.id);
    expect(
      (await repository.list()).filter((copy) => copy.id === first.id),
    ).toHaveLength(1);
  });
});
