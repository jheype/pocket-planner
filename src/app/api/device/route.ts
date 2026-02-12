import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DeviceUpsertSchema } from "@/lib/validate";
import { requireAppToken } from "@/lib/requireAppToken";

export async function POST(req: Request) {
  const denied = requireAppToken(req);
  if (denied) return denied;

  const body = await req.json();
  const data = DeviceUpsertSchema.parse(body);

  const device = await prisma.device.upsert({
    where: { playerId: data.playerId },
    update: { timezone: data.timezone },
    create: { playerId: data.playerId, timezone: data.timezone },
  });

  return NextResponse.json({ device }, { status: 201 });
}
