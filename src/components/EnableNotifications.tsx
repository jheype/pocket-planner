"use client";

import { useState } from "react";
import { authedFetch } from "@/lib/authedFetch";

type OneSignalApi = {
  push: (fn: () => void) => void;
  init: (opts: { appId: string; allowLocalhostAsSecureOrigin?: boolean }) => void;
  Slidedown: { promptPush: () => Promise<void> };
  getUserId: () => Promise<string | null>;
};

declare global {
  interface Window {
    OneSignal?: unknown;
  }
}

function getOneSignal(): OneSignalApi | null {
  const raw = window.OneSignal;
  if (!raw) return null;
  if (!Array.isArray(raw) && typeof raw !== "object") return null;
  return raw as OneSignalApi;
}

export default function EnableNotifications() {
  const [status, setStatus] = useState<"idle" | "working" | "enabled" | "error">(
    "idle"
  );

  async function enable() {
    try {
      setStatus("working");

      const OneSignal = (getOneSignal() ?? []) as unknown as OneSignalApi;
      (OneSignal as unknown as { push: (fn: () => void) => void }).push(() => {
        OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
        });
      });

      (OneSignal as unknown as { push: (fn: () => void) => void }).push(async () => {
        await OneSignal.Slidedown.promptPush();
        const playerId = await OneSignal.getUserId();

        if (!playerId) {
          setStatus("error");
          return;
        }

        await authedFetch("/api/device", {
          method: "POST",
          body: JSON.stringify({
            playerId,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        });

        setStatus("enabled");
      });
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-xl border p-3">
      <div className="text-sm font-medium">Notifications</div>
      <div className="mt-1 text-xs opacity-80">
        Install the app to your Home Screen, then enable notifications.
      </div>

      <button
        onClick={enable}
        className="mt-3 w-full rounded-lg bg-white/10 px-3 py-2 text-sm"
      >
        {status === "enabled" ? "Enabled" : "Enable notifications"}
      </button>

      {status === "error" && (
        <div className="mt-2 text-xs text-red-300">
          Couldn&apos;t enable notifications. Make sure the app is installed to
          your Home Screen.
        </div>
      )}
    </div>
  );
}
