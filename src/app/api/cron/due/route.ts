import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToPlayers } from "@/lib/onesignal";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const authHeader = req.headers.get("x-cron-secret") ?? "";
  const url = new URL(req.url);
  const authQuery = url.searchParams.get("secret") ?? "";

  const authed = secret && (authHeader === secret || authQuery === secret);
  if (!authed) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const appId = process.env.ONESIGNAL_APP_ID ?? "";
  const apiKey = process.env.ONESIGNAL_REST_API_KEY ?? "";
  if (!appId || !apiKey) {
    return NextResponse.json({ error: "Server misconfigured: OneSignal keys missing" }, { status: 500 });
  }

  const now = new Date();

  const due = await prisma.reminderOccurrence.findMany({
    where: { status: "pending", scheduledAt: { lte: now } },
    include: { reminder: { select: { title: true } } },
    orderBy: { scheduledAt: "asc" },
    take: 100,
  });

  if (due.length === 0) return NextResponse.json({ due: 0, sent: 0 });

  const devices = await prisma.device.findMany({ select: { playerId: true } });
  const playerIds = devices.map((x) => x.playerId).filter((v) => typeof v === "string" && v.length > 0);

  if (playerIds.length === 0) {
    return NextResponse.json({ due: due.length, sent: 0, reason: "No devices registered" });
  }

  let sent = 0;
  const sentIds: string[] = [];

  for (const row of due) {
    try {
      await sendPushToPlayers({
        appId,
        apiKey,
        playerIds,
        title: "Reminder",
        body: row.reminder.title,
        url: "https://jheypepocket.com/#reminders",
      });

      sent += 1;
      sentIds.push(row.id);
    } catch {
      continue;
    }
  }

  if (sentIds.length > 0) {
    await prisma.reminderOccurrence.updateMany({
      where: { id: { in: sentIds } },
      data: { status: "sent", sentAt: new Date() },
    });
  }

  return NextResponse.json({ due: due.length, sent });
}
