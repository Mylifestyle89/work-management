import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: "Không tìm thấy công việc." },
      { status: 404 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const payload = (await request.json()) as {
    completed?: boolean;
    quadrant?: string;
  };

  try {
    const data: {
      completed?: boolean;
      completedAt?: Date | null;
      quadrant?: string;
      position?: number;
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

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...data,
      },
    });
    return NextResponse.json({
      ...updated,
      archivedAt: updated.archivedAt?.toISOString() ?? null,
      completedAt: updated.completedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      deadline: updated.deadline?.toISOString() ?? null,
    });
  } catch {
    return NextResponse.json(
      { message: "Không tìm thấy công việc." },
      { status: 404 }
    );
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
    return NextResponse.json({
      ...updated,
      archivedAt: updated.archivedAt?.toISOString() ?? null,
      completedAt: updated.completedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      deadline: updated.deadline?.toISOString() ?? null,
    });
  } catch {
    return NextResponse.json(
      { message: "Không tìm thấy công việc." },
      { status: 404 }
    );
  }
}
