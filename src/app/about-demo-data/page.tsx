import Link from "next/link";

export default function AboutDemoDataPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <Link
        href="/dashboard"
        className="text-sm text-[var(--brass)] underline underline-offset-4"
      >
        ← Return to the app
      </Link>
      <p className="mt-16 text-[11px] font-bold tracking-[0.2em] text-[var(--brass)] uppercase">
        Provenance
      </p>
      <h1 className="font-display mt-3 text-6xl tracking-[-0.04em]">
        About the demo data
      </h1>
      <div className="mt-10 space-y-6 text-base leading-8 text-white/58">
        <p>
          Mara Voss, The Pale Fires, Juno Quartet, Solenne Arc, their releases,
          labels, identifiers, and notes are fictional examples created for this
          application. Their abstract cover artwork was created specifically for
          the demo and is stored with the project.
        </p>
        <p>
          Results labeled MusicBrainz are live external metadata, not fixtures.
          Each live result links to its MusicBrainz release page. Cover Art
          Archive artwork is externally hosted and remains copyrighted by its
          respective owner.
        </p>
        <p>
          Demo collection changes stay in this browser. Resetting the demo
          removes your local changes and restores the original fictional
          fixtures.
        </p>
      </div>
    </main>
  );
}
