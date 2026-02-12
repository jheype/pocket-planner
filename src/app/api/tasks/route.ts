import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskCreateSchema } from "@/lib/validate";
import { requireAppToken } from "@/lib/requireAppToken";

export async function GET(req: Request) {
  const denied = requireAppToken(req);
  if (denied) return denied;

  const tasks = await prisma.task.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const denied = requireAppToken(req);
  if (denied) return denied;

  const body = await req.json();
  const data = TaskCreateSchema.parse(body);

  const task = await prisma.task.create({ data });
  return NextResponse.json({ task }, { status: 201 });
}

export async function PATCH(req: Request) {
  const denied = requireAppToken(req);
  if (denied) return denied;

  const body = await req.json();
  const id = String(body?.id ?? "");
  const done = Boolean(body?.done);

  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const task = await prisma.task.update({ where: { id }, data: { done } });
  return NextResponse.json({ task });
}

export async function DELETE(req: Request) {
  const denied = requireAppToken(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
