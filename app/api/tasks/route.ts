import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function computeTotals(tasks: { amountDisbursement?: number | null; serviceFee?: number | null; amountRecovery?: number | null; amountMobilized?: number | null }[]) {
  const totalDisbursement = tasks.reduce((s, t) => s + (t.amountDisbursement ?? 0), 0);
  const totalRecovery = tasks.reduce((s, t) => s + (t.amountRecovery ?? 0), 0);
  const totalMobilized = tasks.reduce((s, t) => s + (t.amountMobilized ?? 0), 0);
  const totalServiceFee = tasks.reduce((s, t) => s + (t.serviceFee ?? 0), 0);
  return {
    totalDisbursement,
    totalRecovery,
    totalMobilized,
    totalServiceFee,
    netOutstanding: totalDisbursement - totalRecovery,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") === "true";

  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);

  if (!includeArchived) {
    // Chỉ lưu trữ task đã hoàn thành và hoàn thành từ hơn 7 ngày trước
    await prisma.task.updateMany({
      where: {
        completed: true,
        completedAt: { lt: cutoff },
        archivedAt: null,
      },
      data: { archivedAt: new Date() },
    });
    // Đảm bảo task chưa hoàn thành không bao giờ bị ẩn: gỡ lưu trữ nếu bị set nhầm
    await prisma.task.updateMany({
      where: { completed: false },
      data: { archivedAt: null },
    });
  }

  const allTasks = await prisma.task.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  const tasks = includeArchived
    ? allTasks
    : allTasks.filter((t) => t.archivedAt === null);

  if (!includeArchived) {
    tasks.sort((a, b) => {
      if (a.quadrant !== b.quadrant) return a.quadrant.localeCompare(b.quadrant);
      return (a.position ?? 0) - (b.position ?? 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  const totals = computeTotals(allTasks);

  return NextResponse.json({
    tasks: tasks.map((t) => ({
      ...t,
      archivedAt: t.archivedAt?.toISOString() ?? null,
      completedAt: t.completedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      deadline: t.deadline?.toISOString() ?? null,
    })),
    totals,
  });
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
    where: {
      quadrant: payload.quadrant,
      archivedAt: null,
    },
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

  return NextResponse.json(
    {
      ...task,
      archivedAt: task.archivedAt?.toISOString() ?? null,
      completedAt: task.completedAt?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      deadline: task.deadline?.toISOString() ?? null,
    },
    { status: 201 }
  );
}
