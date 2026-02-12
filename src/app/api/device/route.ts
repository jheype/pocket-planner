import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DeviceUpsertSchema } from "@/lib/validate";

export async function POST(req: Request) {
  const body = await req.json();
  const data = DeviceUpsertSchema.parse(body);

  const device = await prisma.device.upsert({
    where: { playerId: data.playerId },
    update: { timezone: data.timezone },
    create: { playerId: data.playerId, timezone: data.timezone },
  });

  return NextResponse.json({ device }, { status: 201 });
}
