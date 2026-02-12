"use client";

import { useEffect, useState } from "react";
import { authedFetch } from "@/lib/authedFetch";

type Status = "idle" | "working" | "enabled" | "error";

type OneSignalPushSubscription = {
  id?: string;
  optedIn?: boolean;
};

type OneSignalUser = {
  PushSubscription?: OneSignalPushSubscription;
};

type OneSignalSlidedown = {
  promptPush: () => Promise<void>;
};

type OneSignalLike = {
  init: (opts: { appId: string; allowLocalhostAsSecureOrigin?: boolean }) => Promise<void> | void;
  Slidedown: OneSignalSlidedown;
  User?: OneSignalUser;
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(os: OneSignalLike) => void | Promise<void>>;
  }
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function isStandalone() {
  const mm = window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  const navStandalone = (navigator as unknown as { standalone?: boolean }).standalone ?? false;
  return mm || navStandalone;
}

function getSubId(os: OneSignalLike): string | null {
  const id = os.User?.PushSubscription?.id;
  return typeof id === "string" && id.trim() ? id : null;
}

function isOptedIn(os: OneSignalLike): boolean {
  return Boolean(os.User?.PushSubscription?.optedIn);
}

async function waitForSubscription(os: OneSignalLike) {
  for (let i = 0; i < 24; i++) {
    const optedIn = isOptedIn(os);
    const id = getSubId(os);
    if (optedIn && id) return { optedIn, id };
    await sleep(250);
  }
  return { optedIn: isOptedIn(os), id: getSubId(os) };
}

export default function EnableNotifications() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let alive = true;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
        });

        const { optedIn, id } = await waitForSubscription(OneSignal);
        if (alive && optedIn && id) setStatus("enabled");
      } catch {
        if (!alive) return;
        setStatus("error");
        setError("OneSignal failed to initialise.");
      }
    });

    return () => {
      alive = false;
    };
  }, []);

  async function enable() {
    setError("");

    if (!isStandalone()) {
      setStatus("error");
      setError("Open from the Home Screen app icon, not from the browser tab.");
      return;
    }

    setStatus("working");

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
        });

        await OneSignal.Slidedown.promptPush();

        const { optedIn, id } = await waitForSubscription(OneSignal);

        if (!optedIn) {
          setStatus("error");
          setError("Notifications are not enabled. Check iOS notification permissions.");
          return;
        }

        if (!id) {
          setStatus("error");
          setError("Subscription ID was not available. Check the service worker setup in OneSignal.");
          return;
        }

        const res = await authedFetch("/api/device", {
          method: "POST",
          body: JSON.stringify({
            playerId: id,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        });

        if (!res.ok) {
          setStatus("error");
          setError("Device registration failed. Check /api/device response.");
          return;
        }

        setStatus("enabled");
      } catch {
        setStatus("error");
        setError("Could not enable notifications.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold">Notifications</div>
      <div className="mt-1 text-xs text-white/60">
        Install the app to your Home Screen, then enable notifications.
      </div>

      <button
        onClick={enable}
        disabled={status === "working" || status === "enabled"}
        className="mt-3 w-full rounded-xl bg-white/10 px-3 py-2 text-sm disabled:opacity-50"
      >
        {status === "enabled" ? "Enabled" : status === "working" ? "Enabling…" : "Turn on"}
      </button>

      {status === "error" && (
        <div className="mt-2 text-xs text-red-300">{error || "Could not enable notifications."}</div>
      )}
    </div>
  );
}
