"use client";

import {
  ArrowRight,
  Cloud,
  Disc3,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { useCollection } from "@/components/collection-provider";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const { mode, userEmail, supabaseConfigured } = useCollection();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    const client = createBrowserSupabaseClient();
    if (!client) {
      setStatus("Cloud sign-in is not configured in this deployment.");
      return;
    }

    setSending(true);
    setStatus(null);
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setSending(false);
    setStatus(
      error
        ? "The secure sign-in link could not be sent. Check the address and try again."
        : "Check your inbox for a secure sign-in link. You can close this page after it arrives.",
    );
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex flex-col justify-between bg-[var(--paper)] p-6 text-[var(--ink)] sm:p-10 lg:p-14">
        <Link href="/" className="font-display text-2xl">
          Reverie<span className="text-[var(--oxblood)]">.</span>
        </Link>
        <div className="my-20 max-w-xl">
          <p className="text-[10px] font-bold tracking-[0.2em] text-[var(--oxblood)] uppercase">
            Your archive, your choice
          </p>
          <h1 className="font-display mt-5 text-6xl leading-[0.92] tracking-[-0.05em] sm:text-7xl">
            Keep it local.
            <br />
            <em>Or take it anywhere.</em>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-black/55">
            Explore without an account, or connect a private cloud collection
            when Supabase is configured. Demo records never enter your cloud
            library.
          </p>
        </div>
        <p className="text-xs text-black/38">Old Records. New Discoveries.</p>
      </section>

      <section className="flex items-center justify-center px-5 py-16 sm:px-10">
        <div className="w-full max-w-lg">
          {mode === "cloud" ? (
            <div className="rounded-[2rem] bg-white/[0.055] p-7 sm:p-9">
              <span className="grid size-12 place-items-center rounded-full bg-emerald-300/12 text-emerald-200">
                <Cloud className="size-5" />
              </span>
              <h2 className="font-display mt-6 text-4xl">
                Your cloud collection is ready.
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/48">
                Signed in as {userEmail}. New records and copy details persist
                through your Supabase project.
              </p>
              <Link
                href="/dashboard"
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--oxblood)] px-6 text-sm font-semibold text-white"
              >
                Open collection <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-[2rem] bg-white/[0.055] p-7 sm:p-9">
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-full bg-[var(--oxblood)]/20 text-[#e9a6b1]">
                    <LockKeyhole className="size-5" />
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase ${supabaseConfigured ? "bg-emerald-300/12 text-emerald-200" : "bg-white/7 text-white/38"}`}
                  >
                    {supabaseConfigured
                      ? "Cloud available"
                      : "Cloud not configured"}
                  </span>
                </div>
                <h2 className="font-display mt-7 text-4xl">Email sign-in</h2>
                <p className="mt-3 text-sm leading-6 text-white/45">
                  We send a one-time secure link. No password is stored by this
                  app.
                </p>
                <form
                  onSubmit={(event) => void signIn(event)}
                  className="mt-7 space-y-4"
                >
                  <label
                    className="grid gap-2 text-sm font-medium"
                    htmlFor="auth-email"
                  >
                    Email address
                    <input
                      id="auth-email"
                      type="email"
                      required
                      autoComplete="email"
                      disabled={!supabaseConfigured}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="collector@example.com"
                      className="h-12 rounded-2xl border border-white/12 bg-white/5 px-4 text-base outline-none placeholder:text-white/25 focus:border-[var(--brass)] focus:ring-2 focus:ring-[var(--brass)]/20 disabled:opacity-45"
                    />
                  </label>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!supabaseConfigured || sending}
                  >
                    {sending ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Cloud className="size-4" />
                    )}
                    {sending ? "Sending link…" : "Continue securely"}
                  </Button>
                </form>
                {status ? (
                  <p
                    className="mt-4 rounded-xl bg-white/6 p-3 text-xs leading-5 text-white/58"
                    role="status"
                  >
                    {status}
                  </p>
                ) : null}
              </div>

              <div className="my-7 flex items-center gap-4 text-[10px] font-bold tracking-wider text-white/24 uppercase">
                <span className="h-px flex-1 bg-white/8" />
                or
                <span className="h-px flex-1 bg-white/8" />
              </div>

              <Link
                href="/dashboard"
                className="flex min-h-16 items-center justify-between rounded-[1.4rem] bg-[var(--moss)]/18 px-5 text-sm text-[#d3d7ca] transition hover:bg-[var(--moss)]/28 focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:outline-none"
              >
                <span className="inline-flex items-center gap-3">
                  <Disc3 className="size-5" />
                  <span>
                    <strong className="block">Explore the local demo</strong>
                    <small className="mt-0.5 block font-normal opacity-52">
                      Fictional fixtures · no account needed
                    </small>
                  </span>
                </span>
                <ArrowRight className="size-4" />
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
