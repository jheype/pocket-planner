"use client";

import { useState } from "react";
import { authedFetch } from "@/lib/authedFetch";
import { BellRing, Loader2, AlertCircle } from "lucide-react";

type OneSignalApi = {
  push: (fn: () => void) => void;
  init: (opts: { appId: string; allowLocalhostAsSecureOrigin?: boolean }) => void;
  Slidedown: { promptPush: () => Promise<void> };
  getUserId: () => Promise<string | null>;
};

declare global {
  interface Window {
    OneSignal?: OneSignalApi | unknown[];
  }
}

function getOneSignal(): OneSignalApi | null {
  const raw = window.OneSignal;
  if (!raw) return null;
  if (Array.isArray(raw)) return raw as unknown as OneSignalApi; 
  return raw as OneSignalApi;
}

export default function EnableNotifications() {
  const [status, setStatus] = useState<"idle" | "working" | "enabled" | "error">("idle");

  async function enable() {
    try {
      setStatus("working");
      const OneSignal = getOneSignal();
      
      if (!OneSignal) throw new Error("OneSignal not loaded");

      OneSignal.push(() => {
        OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
        });
      });

      OneSignal.push(async () => {
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

  if (status === "enabled") return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
          <BellRing className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-100">Enable Notifications</h3>
          <p className="mt-1 text-xs leading-relaxed text-blue-200/60">
            Get alerted when your reminders are due. Requires adding app to Home Screen.
          </p>
          
          <button
            onClick={enable}
            disabled={status === "working"}
            className="mt-3 flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          >
            {status === "working" && <Loader2 className="h-3 w-3 animate-spin" />}
            {status === "error" ? "Try Again" : "Turn On"}
          </button>

          {status === "error" && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-300">
              <AlertCircle className="h-3 w-3" />
              <span>Failed. Check if installed on Home Screen.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}