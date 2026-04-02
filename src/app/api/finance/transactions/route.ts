import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  description: z.string().min(1).max(200).trim(),
  categoryId: z.string().nullable().optional(),
  date: z.string().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const month = url.searchParams.get("month"); // format: "2025-04"

  const where = month
    ? {
        date: {
          gte: new Date(`${month}-01T00:00:00.000Z`),
          lt: new Date(
            new Date(`${month}-01T00:00:00.000Z`).setMonth(
              new Date(`${month}-01T00:00:00.000Z`).getMonth() + 1
            )
          ),
        },
      }
    : {};

  const transactions = await prisma.financeTransaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: { category: true },
  });

  return NextResponse.json({ transactions });
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = CreateSchema.parse(body);

  const transaction = await prisma.financeTransaction.create({
    data: {
      type: data.type,
      amount: data.amount,
      description: data.description,
      categoryId: data.categoryId ?? null,
      date: data.date ? new Date(data.date) : new Date(),
    },
    include: { category: true },
  });

  return NextResponse.json({ transaction }, { status: 201 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await prisma.financeTransaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
