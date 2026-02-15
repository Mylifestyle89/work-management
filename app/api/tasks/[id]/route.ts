import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Task } from "@prisma/client";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

const notFoundResponse = () =>
  NextResponse.json(
    { message: "Không tìm thấy công việc." },
    { status: 404 }
  );

const serializeTask = (task: Task) => ({
  ...task,
  archivedAt: task.archivedAt?.toISOString() ?? null,
  completedAt: task.completedAt?.toISOString() ?? null,
  createdAt: task.createdAt.toISOString(),
  deadline: task.deadline?.toISOString() ?? null,
});

export async function DELETE(_: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const existing = await prisma.task.findUnique({
      where: { id },
    });
    if (!existing) {
      return notFoundResponse();
    }

    // Task chưa hoàn thành: xóa hẳn khỏi DB.
    if (!existing.completed) {
      const deleted = await prisma.task.delete({
        where: { id },
      });
      return NextResponse.json(serializeTask(deleted));
    }

    // Task đã hoàn thành: lưu trữ để còn lịch sử/báo cáo.
    const updated = await prisma.task.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    return NextResponse.json(serializeTask(updated));
  } catch {
    return notFoundResponse();
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const payload = (await request.json()) as {
    completed?: boolean;
    quadrant?: string;
    archived?: boolean;
  };

  try {
    const data: {
      completed?: boolean;
      completedAt?: Date | null;
      quadrant?: string;
      position?: number;
      archivedAt?: Date | null;
    } =
      {};

    if (typeof payload.completed === "boolean") {
      data.completed = payload.completed;
      data.completedAt = payload.completed ? new Date() : null;
    }

    if (payload.quadrant) {
      const maxPosition = await prisma.task.aggregate({
        where: { quadrant: payload.quadrant, archivedAt: null },
        _max: { position: true },
      });
      data.quadrant = payload.quadrant;
      data.position = (maxPosition._max.position ?? 0) + 1;
    }

    if (typeof payload.archived === "boolean") {
      data.archivedAt = payload.archived ? new Date() : null;
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...data,
      },
    });
    return NextResponse.json(serializeTask(updated));
  } catch {
    return notFoundResponse();
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
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
  };

  if (!payload.title || !payload.quadrant || !payload.type) {
    return NextResponse.json(
      { message: "Thiếu dữ liệu bắt buộc." },
      { status: 400 }
    );
  }

  const deadline = payload.deadline ? new Date(payload.deadline) : null;

  try {
    const updated = await prisma.task.update({
      where: { id },
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
      },
    });
    return NextResponse.json(serializeTask(updated));
  } catch {
    return notFoundResponse();
  }
}
