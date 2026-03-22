/**
 * geminiParser.js
 * Always routes through /api/parse (Vercel serverless) — API key stays on server.
 * For local dev: run `vercel dev` instead of `npm run dev`.
 */

export async function parseWithGemini(rawText) {
  const res = await fetch("/api/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawText }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Server error ${res.status}`);
  }

  return res.json();
}
