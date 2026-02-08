import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    quadrant?: string;
    orderedIds?: string[];
  };

  if (!payload.quadrant || !Array.isArray(payload.orderedIds)) {
    return NextResponse.json(
      { message: "Dữ liệu không hợp lệ." },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    payload.orderedIds.map((id, index) =>
      prisma.task.update({
        where: { id },
        data: { quadrant: payload.quadrant, position: index + 1 },
      })
    )
  );

  return NextResponse.json({ success: true });
}
