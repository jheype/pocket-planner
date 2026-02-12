import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToPlayers } from "@/lib/onesignal";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [k: string]: JsonValue }
  | JsonValue[];

async function handle(req: Request) {
  const secret = process.env.CRON_SECRET ?? "";
  const authHeader = req.headers.get("x-cron-secret") ?? "";
  const url = new URL(req.url);
  const authQuery = url.searchParams.get("secret") ?? "";

  const authed = !!secret && (authHeader === secret || authQuery === secret);
  if (!authed) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const appId = process.env.ONESIGNAL_APP_ID ?? "";
  const apiKey = process.env.ONESIGNAL_REST_API_KEY ?? "";
  if (!appId || !apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured: OneSignal keys missing" },
      { status: 500 }
    );
  }

  const now = new Date();

  const due = await prisma.reminderOccurrence.findMany({
    where: { status: "pending", scheduledAt: { lte: now } },
    include: { reminder: { select: { title: true } } },
    orderBy: { scheduledAt: "asc" },
    take: 100,
  });

  if (due.length === 0) {
    return NextResponse.json({ due: 0, devices: 0, sent: 0, attempted: 0, errors: [] });
  }

  const devices = await prisma.device.findMany({
    select: { playerId: true },
  });

  const playerIds = devices
    .map((x) => x.playerId)
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  if (playerIds.length === 0) {
    return NextResponse.json({
      due: due.length,
      devices: 0,
      sent: 0,
      attempted: 0,
      errors: [{ code: "NO_DEVICES", message: "No devices registered" }],
    });
  }

  const attempted = due.length;
  const sentIds = due.map((d) => d.id);

  const title = "Reminder";
  const body =
    due.length === 1
      ? due[0]?.reminder?.title ?? "You have a reminder"
      : `You have ${due.length} due reminders`;

  try {
    const result = await sendPushToPlayers({
      appId,
      apiKey,
      playerIds,
      title,
      body,
      url: "https://jheypepocket.com/#reminders",
    });

    await prisma.reminderOccurrence.updateMany({
      where: { id: { in: sentIds } },
      data: { status: "sent", sentAt: new Date() },
    });

    return NextResponse.json({
      due: due.length,
      devices: playerIds.length,
      attempted,
      sent: sentIds.length,
      onesignal: result as JsonValue,
      errors: [],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);

    return NextResponse.json(
      {
        due: due.length,
        devices: playerIds.length,
        attempted,
        sent: 0,
        errors: [{ code: "ONESIGNAL_FAILED", message: msg }],
      },
      { status: 502 }
    );
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
