import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AppGate from "@/components/AppGate";

export const metadata: Metadata = {
  title: "Pocket Planner",
  description: "To-do and reminders",
  manifest: "/manifest.webmanifest",
  themeColor: "#0b0b0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="afterInteractive" />
        <AppGate>{children}</AppGate>
      </body>
    </html>
  );
}
