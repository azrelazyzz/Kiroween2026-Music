import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { evidenceSchema, releaseSchema } from "@/lib/domain/schemas";
import type {
  CollectionCopy,
  CollectionUpdate,
  NewCollectionCopy,
} from "@/lib/domain/types";
import type { CollectionRepository } from "@/lib/repositories/collection";

const copyColumns =
  "id, owner_id, release_snapshot, identification_method, evidence, media_condition, sleeve_condition, notes, shelf, tags, is_favorite, created_at, updated_at";

const databaseCopySchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  release_snapshot: releaseSchema,
  identification_method: z.enum([
    "search",
    "barcode",
    "photo",
    "runout",
    "manual",
    "demo",
  ]),
  evidence: z.object(evidenceSchema.shape).strict(),
  media_condition: z
    .enum([
      "Mint",
      "Near Mint",
      "Very Good Plus",
      "Very Good",
      "Good Plus",
      "Good",
      "Fair",
      "Poor",
    ])
    .nullable(),
  sleeve_condition: z
    .enum([
      "Mint",
      "Near Mint",
      "Very Good Plus",
      "Very Good",
      "Good Plus",
      "Good",
      "Fair",
      "Poor",
    ])
    .nullable(),
  notes: z.string().nullable(),
  shelf: z.string().nullable(),
  tags: z.array(z.string()),
  is_favorite: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

type DatabaseCopy = z.infer<typeof databaseCopySchema>;

function mapCopy(row: DatabaseCopy): CollectionCopy {
  return {
    id: row.id,
    ownerId: row.owner_id,
    release: row.release_snapshot,
    evidence: row.evidence,
    identificationMethod: row.identification_method,
    ...(row.media_condition ? { mediaCondition: row.media_condition } : {}),
    ...(row.sleeve_condition ? { sleeveCondition: row.sleeve_condition } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
    ...(row.shelf ? { shelf: row.shelf } : {}),
    tags: row.tags,
    favorite: row.is_favorite,
    addedAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseCopy(value: unknown): CollectionCopy {
  const parsed = databaseCopySchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      "Stored collection data did not match the application schema.",
    );
  }
  return mapCopy(parsed.data);
}

export class SupabaseCollectionRepository implements CollectionRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly ownerId: string,
  ) {}

  async list(): Promise<CollectionCopy[]> {
    const { data, error } = await this.client
      .from("collection_copies")
      .select(copyColumns)
      .order("created_at", { ascending: false });
    if (error) throw new Error("The cloud collection could not be loaded.");
    const parsed = z.array(databaseCopySchema).safeParse(data as unknown);
    if (!parsed.success) {
      throw new Error("The cloud collection contained unexpected data.");
    }
    return parsed.data.map(mapCopy);
  }

  async get(id: string): Promise<CollectionCopy | null> {
    const { data, error } = await this.client
      .from("collection_copies")
      .select(copyColumns)
      .eq("owner_id", this.ownerId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error("The cloud record could not be loaded.");
    return data ? parseCopy(data as unknown) : null;
  }

  async add(input: NewCollectionCopy): Promise<CollectionCopy> {
    const row = {
      owner_id: this.ownerId,
      release_id: null,
      release_snapshot: input.release,
      identification_method: input.identificationMethod,
      evidence: input.evidence,
      media_condition: input.mediaCondition ?? null,
      sleeve_condition: input.sleeveCondition ?? null,
      notes: input.notes ?? null,
      shelf: input.shelf ?? null,
      tags: input.tags,
      is_favorite: input.favorite,
      idempotency_key: input.idempotencyKey,
    };
    const { data, error } = await this.client
      .from("collection_copies")
      .insert(row)
      .select(copyColumns)
      .single();

    if (error?.code === "23505") {
      const existing = await this.client
        .from("collection_copies")
        .select(copyColumns)
        .eq("owner_id", this.ownerId)
        .eq("idempotency_key", input.idempotencyKey)
        .single();
      if (existing.error)
        throw new Error("The saved copy could not be reloaded.");
      return parseCopy(existing.data as unknown);
    }
    if (error)
      throw new Error("The record could not be saved to the cloud collection.");
    return parseCopy(data as unknown);
  }

  async update(id: string, update: CollectionUpdate): Promise<CollectionCopy> {
    const values: Record<string, unknown> = {};
    if ("mediaCondition" in update) {
      values.media_condition = update.mediaCondition ?? null;
    }
    if ("sleeveCondition" in update) {
      values.sleeve_condition = update.sleeveCondition ?? null;
    }
    if ("notes" in update) values.notes = update.notes || null;
    if ("shelf" in update) values.shelf = update.shelf || null;
    if ("tags" in update) values.tags = update.tags ?? [];
    if ("favorite" in update) values.is_favorite = update.favorite;

    const { data, error } = await this.client
      .from("collection_copies")
      .update(values)
      .eq("owner_id", this.ownerId)
      .eq("id", id)
      .select(copyColumns)
      .single();
    if (error) throw new Error("The cloud record could not be updated.");
    return parseCopy(data as unknown);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client
      .from("collection_copies")
      .delete()
      .eq("owner_id", this.ownerId)
      .eq("id", id);
    if (error) throw new Error("The cloud record could not be removed.");
  }

  async reset(): Promise<CollectionCopy[]> {
    throw new Error("Cloud collections cannot be reset from demo settings.");
  }
}
