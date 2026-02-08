import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await prisma.task.deleteMany({
    where: {
      completed: true,
      completedAt: {
        lt: cutoff,
      },
    },
  });

  const tasks = await prisma.task.findMany({
    orderBy: [{ quadrant: "asc" }, { position: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    title?: string;
    quadrant?: string;
    type?: string;
    note?: string;
    deadline?: string;
    amountDisbursement?: number;
    serviceFee?: number;
    amountRecovery?: number;
    amountMobilized?: number;
    completed?: boolean;
  };

  if (!payload.title || !payload.quadrant || !payload.type) {
    return NextResponse.json(
      { message: "Thiếu dữ liệu bắt buộc." },
      { status: 400 }
    );
  }

  const deadline = payload.deadline ? new Date(payload.deadline) : null;
  const maxPosition = await prisma.task.aggregate({
    where: { quadrant: payload.quadrant },
    _max: { position: true },
  });
  const nextPosition = (maxPosition._max.position ?? 0) + 1;

  const task = await prisma.task.create({
    data: {
      title: payload.title,
      quadrant: payload.quadrant,
      type: payload.type,
      note: payload.note ?? null,
      deadline,
      amountDisbursement: payload.amountDisbursement ?? null,
      serviceFee: payload.serviceFee ?? null,
      amountRecovery: payload.amountRecovery ?? null,
      amountMobilized: payload.amountMobilized ?? null,
      completed: payload.completed ?? false,
      position: nextPosition,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
