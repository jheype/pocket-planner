import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateSchema = z.object({
  name: z.string().min(1).max(40).trim(),
  colour: z.string().default("#60a5fa"),
  icon: z.string().default("shopping"),
});

export async function GET() {
  const categories = await prisma.financeCategory.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = CreateSchema.parse(body);
  const category = await prisma.financeCategory.create({ data });
  return NextResponse.json({ category }, { status: 201 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await prisma.financeCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
