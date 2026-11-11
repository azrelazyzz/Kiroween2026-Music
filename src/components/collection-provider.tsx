"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  CollectionCopy,
  CollectionUpdate,
  NewCollectionCopy,
} from "@/lib/domain/types";
import {
  DemoCollectionRepository,
  type CollectionRepository,
} from "@/lib/repositories/collection";
import { SupabaseCollectionRepository } from "@/lib/repositories/supabase-collection";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type PersistenceMode = "demo" | "cloud";

type CollectionContextValue = {
  copies: CollectionCopy[];
  loading: boolean;
  error: string | null;
  mode: PersistenceMode;
  userEmail: string | null;
  supabaseConfigured: boolean;
  addCopy(input: NewCollectionCopy): Promise<CollectionCopy>;
  updateCopy(id: string, update: CollectionUpdate): Promise<CollectionCopy>;
  removeCopy(id: string): Promise<void>;
  resetDemo(): Promise<void>;
  signOut(): Promise<void>;
  getCopy(id: string): CollectionCopy | undefined;
  duplicateCount(release: CollectionCopy["release"]): number;
};

const CollectionContext = createContext<CollectionContextValue | null>(null);

export function CollectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const repository = useRef<CollectionRepository | null>(null);
  const supabase = useRef<SupabaseClient | null>(null);
  const [copies, setCopies] = useState<CollectionCopy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<PersistenceMode>("demo");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!repository.current) return;
    try {
      setCopies(await repository.current.list());
      setError(null);
    } catch {
      setError(
        "The collection could not be loaded. Check browser storage or your cloud connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const activateDemoRepository = useCallback(async () => {
    repository.current = new DemoCollectionRepository(window.localStorage);
    setMode("demo");
    setUserEmail(null);
    setLoading(true);
    setCopies(await repository.current.list());
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      await Promise.resolve();
      try {
        const client = createBrowserSupabaseClient();
        supabase.current = client;
        if (client) {
          const { data } = await client.auth.getUser();
          if (!active) return;
          if (data.user) {
            repository.current = new SupabaseCollectionRepository(
              client,
              data.user.id,
            );
            setMode("cloud");
            setUserEmail(data.user.email ?? null);
            await refresh();
            return;
          }
        }
        await activateDemoRepository();
      } catch {
        if (!active) return;
        setError(
          "Collection storage could not start. Enable site storage or check the Supabase configuration.",
        );
        setLoading(false);
      }
    }

    void initialize();
    return () => {
      active = false;
    };
  }, [refresh, activateDemoRepository]);

  const addCopy = useCallback(
    async (input: NewCollectionCopy) => {
      if (!repository.current)
        throw new Error("Collection storage is not ready.");
      const copy = await repository.current.add(input);
      await refresh();
      return copy;
    },
    [refresh],
  );

  const updateCopy = useCallback(
    async (id: string, update: CollectionUpdate) => {
      if (!repository.current)
        throw new Error("Collection storage is not ready.");
      const copy = await repository.current.update(id, update);
      await refresh();
      return copy;
    },
    [refresh],
  );

  const removeCopy = useCallback(
    async (id: string) => {
      if (!repository.current)
        throw new Error("Collection storage is not ready.");
      await repository.current.remove(id);
      await refresh();
    },
    [refresh],
  );

  const resetDemo = useCallback(async () => {
    if (mode !== "demo") {
      throw new Error("Only the local demo collection can be reset.");
    }
    if (!repository.current)
      throw new Error("Collection storage is not ready.");
    setCopies(await repository.current.reset());
    setError(null);
  }, [mode]);

  const signOut = useCallback(async () => {
    if (supabase.current) await supabase.current.auth.signOut();
    await activateDemoRepository();
  }, [activateDemoRepository]);

  const value = useMemo<CollectionContextValue>(
    () => ({
      copies,
      loading,
      error,
      mode,
      userEmail,
      supabaseConfigured: isSupabaseConfigured(),
      addCopy,
      updateCopy,
      removeCopy,
      resetDemo,
      signOut,
      getCopy: (id) => copies.find((copy) => copy.id === id),
      duplicateCount: (release) =>
        copies.filter(
          (copy) =>
            copy.release.source.provider === release.source.provider &&
            copy.release.source.releaseId === release.source.releaseId,
        ).length,
    }),
    [
      copies,
      loading,
      error,
      mode,
      userEmail,
      addCopy,
      updateCopy,
      removeCopy,
      resetDemo,
      signOut,
    ],
  );

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection(): CollectionContextValue {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error("useCollection must be used within CollectionProvider.");
  }
  return context;
}
