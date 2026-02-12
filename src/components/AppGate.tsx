"use client";

import { useMemo, useState } from "react";

const KEY = "pp_app_token";

export function getStoredToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY) ?? "";
}

export default function AppGate({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => getStoredToken(), []);
  const [token, setToken] = useState(initial);

  function save() {
    const t = token.trim();
    if (!t) return;
    localStorage.setItem(KEY, t);
    setToken(t);
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-md px-4 pb-24 pt-8">
        <h1 className="text-xl font-semibold">Pocket Planner</h1>
        <p className="mt-2 text-sm opacity-80">
          Enter your app token to unlock this device.
        </p>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="text-xs opacity-80">App token</label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none"
            placeholder="Paste your token"
            autoCapitalize="none"
            autoCorrect="off"
          />
          <button
            onClick={save}
            className="mt-3 w-full rounded-lg bg-white/10 px-3 py-2 text-sm"
          >
            Unlock
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
