import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_USER_ID } from "@/lib/types";
import { markApplied } from "@/lib/services/application-tracking";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    await markApplied(DEFAULT_USER_ID, jobId);

    return NextResponse.json(
      { success: true, jobId, status: "applied" },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/jobs/[id]/apply error:", error);
    return NextResponse.json(
      { error: "Failed to mark job as applied" },
      { status: 500 }
    );
  }
}
