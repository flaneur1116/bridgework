"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export async function postJson<T = unknown>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  let data: unknown = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) throw new Error((data as { error?: string })?.error || `Request failed (${res.status}). Try again.`);
  return data as T;
}

export function useAction<A extends unknown[], R>(fn: (...a: A) => Promise<R>, opts: { refresh?: boolean } = { refresh: true }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async (...a: A): Promise<R | undefined> => {
    setPending(true); setError(null);
    try {
      const r = await fn(...a);
      if (opts.refresh !== false) router.refresh();
      return r;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setPending(false); }
  }, [fn, router, opts.refresh]);
  return { run, pending, error, setError };
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <svg className="spin" width={size} height={size} viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" /><path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>;
}

export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return <p role="alert" className="text-sm text-alert mt-2">{error}</p>;
}

export function AiWorking({ label }: { label: string }) {
  return <span className="inline-flex items-center gap-2 text-sm text-graphite"><Spinner /> {label}</span>;
}
