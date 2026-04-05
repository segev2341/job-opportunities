import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/types";
import { logOutreach } from "@/lib/services/application-tracking";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await request.json();
    const { personId, type, channel, notes } = body;

    if (!type || !channel) {
      return NextResponse.json(
        { error: "type and channel are required" },
        { status: 400 }
      );
    }

    // Find the application for this job, if one exists
    const application = await prisma.application.findFirst({
      where: { userId: DEFAULT_USER_ID, jobId },
    });

    await logOutreach({
      userId: DEFAULT_USER_ID,
      applicationId: application?.id,
      personId,
      type,
      channel,
      notes,
    });

    return NextResponse.json(
      { success: true, jobId, type, channel },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/jobs/[id]/outreach error:", error);
    return NextResponse.json(
      { error: "Failed to log outreach" },
      { status: 500 }
    );
  }
}
