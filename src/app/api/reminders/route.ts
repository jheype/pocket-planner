import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReminderCreateSchema } from "@/lib/validate";

export async function GET() {
  const reminders = await prisma.reminder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      occurrences: {
        orderBy: { scheduledAt: "asc" },
      },
    },
  });

  return NextResponse.json({ reminders });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = ReminderCreateSchema.parse(body);

  const reminder = await prisma.reminder.create({
    data: {
      title: parsed.title,
      notes: parsed.notes,
      occurrences: {
        create: parsed.times.map((t) => ({
          scheduledAt: new Date(t),
        })),
      },
    },
    include: {
      occurrences: {
        orderBy: { scheduledAt: "asc" },
      },
    },
  });

  return NextResponse.json({ reminder }, { status: 201 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";

  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await prisma.reminder.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
