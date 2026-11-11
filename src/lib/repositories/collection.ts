import { storedDemoCollectionSchema } from "@/lib/domain/schemas";
import type {
  CollectionCopy,
  CollectionUpdate,
  NewCollectionCopy,
} from "@/lib/domain/types";
import { demoCollectionSeed } from "@/lib/demo/fixtures";

export interface CollectionRepository {
  list(): Promise<CollectionCopy[]>;
  get(id: string): Promise<CollectionCopy | null>;
  add(input: NewCollectionCopy): Promise<CollectionCopy>;
  update(id: string, update: CollectionUpdate): Promise<CollectionCopy>;
  remove(id: string): Promise<void>;
  reset(): Promise<CollectionCopy[]>;
}

type StoredDemoCollection = {
  version: 1;
  copies: CollectionCopy[];
  idempotencyKeys: string[];
};

const STORAGE_KEY = "music-cataloguing-app:demo-collection:v1";

function cloneSeed(): CollectionCopy[] {
  return structuredClone(demoCollectionSeed);
}

export class DemoCollectionRepository implements CollectionRepository {
  constructor(private readonly storage: Storage) {}

  private read(): StoredDemoCollection {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: StoredDemoCollection = {
        version: 1,
        copies: cloneSeed(),
        idempotencyKeys: [],
      };
      this.write(initial);
      return initial;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      const result = storedDemoCollectionSchema.safeParse(parsed);
      if (result.success) return result.data;
    } catch {
      // Invalid local data is replaced with the clearly documented demo fixture.
    }

    const recovered: StoredDemoCollection = {
      version: 1,
      copies: cloneSeed(),
      idempotencyKeys: [],
    };
    this.write(recovered);
    return recovered;
  }

  private write(value: StoredDemoCollection): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(value));
  }

  async list(): Promise<CollectionCopy[]> {
    return structuredClone(this.read().copies);
  }

  async get(id: string): Promise<CollectionCopy | null> {
    const copy = this.read().copies.find((item) => item.id === id);
    return copy ? structuredClone(copy) : null;
  }

  async add(input: NewCollectionCopy): Promise<CollectionCopy> {
    const stored = this.read();
    if (stored.idempotencyKeys.includes(input.idempotencyKey)) {
      const existing = stored.copies.find(
        (copy) => copy.id === input.idempotencyKey,
      );
      if (existing) return structuredClone(existing);
      throw new Error("This save request was already handled.");
    }

    const timestamp = new Date().toISOString();
    const copy: CollectionCopy = {
      id: input.idempotencyKey,
      ownerId: "demo-user",
      release: structuredClone(input.release),
      evidence: structuredClone(input.evidence),
      identificationMethod: input.identificationMethod,
      ...(input.mediaCondition ? { mediaCondition: input.mediaCondition } : {}),
      ...(input.sleeveCondition
        ? { sleeveCondition: input.sleeveCondition }
        : {}),
      ...(input.notes ? { notes: input.notes } : {}),
      ...(input.shelf ? { shelf: input.shelf } : {}),
      tags: [...input.tags],
      favorite: input.favorite,
      addedAt: timestamp,
      updatedAt: timestamp,
    };

    this.write({
      ...stored,
      copies: [copy, ...stored.copies],
      idempotencyKeys: [...stored.idempotencyKeys, input.idempotencyKey],
    });
    return structuredClone(copy);
  }

  async update(id: string, update: CollectionUpdate): Promise<CollectionCopy> {
    const stored = this.read();
    const index = stored.copies.findIndex((copy) => copy.id === id);
    if (index < 0) throw new Error("Collection copy not found.");

    const current = stored.copies[index]!;
    const updated: CollectionCopy = {
      ...current,
      ...structuredClone(update),
      updatedAt: new Date().toISOString(),
    };
    const copies = [...stored.copies];
    copies[index] = updated;
    this.write({ ...stored, copies });
    return structuredClone(updated);
  }

  async remove(id: string): Promise<void> {
    const stored = this.read();
    this.write({
      ...stored,
      copies: stored.copies.filter((copy) => copy.id !== id),
    });
  }

  async reset(): Promise<CollectionCopy[]> {
    const copies = cloneSeed();
    this.write({ version: 1, copies, idempotencyKeys: [] });
    return structuredClone(copies);
  }
}
