import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToPlayers } from "@/lib/onesignal";

type DueRow = {
  id: string;
  reminder: { title: string };
};

export async function POST(req: Request) {
  const auth = req.headers.get("x-cron-secret") ?? "";
  if (!process.env.CRON_SECRET || auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const now = new Date();

  const due = (await prisma.reminderOccurrence.findMany({
    where: { status: "pending", scheduledAt: { lte: now } },
    include: { reminder: true },
    take: 100,
  })) as unknown as DueRow[];

  if (due.length === 0) return NextResponse.json({ sent: 0 });

  const devices = await prisma.device.findMany({ select: { playerId: true } });
  const playerIds = devices.map((x: { playerId: string }) => x.playerId);

  if (playerIds.length > 0) {
    for (const row of due) {
      await sendPushToPlayers({
        appId: process.env.ONESIGNAL_APP_ID!,
        apiKey: process.env.ONESIGNAL_REST_API_KEY!,
        playerIds,
        title: "Reminder",
        body: row.reminder.title,
      });
    }
  }

  await prisma.reminderOccurrence.updateMany({
    where: { id: { in: due.map((x: DueRow) => x.id) } },
    data: { status: "sent", sentAt: new Date() },
  });

  return NextResponse.json({ sent: due.length });
}
