import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_USER_ID } from "@/lib/types";
import {
  getFollowUps,
  createFollowUp,
  markFollowUpDone,
} from "@/lib/services/follow-up";

export async function GET() {
  try {
    const followUps = await getFollowUps(DEFAULT_USER_ID);
    return NextResponse.json(followUps);
  } catch (error) {
    console.error("GET /api/follow-ups error:", error);
    return NextResponse.json(
      { error: "Failed to fetch follow-ups" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, title, description, dueDate } = body;

    if (!title || !dueDate) {
      return NextResponse.json(
        { error: "title and dueDate are required" },
        { status: 400 }
      );
    }

    await createFollowUp({
      userId: DEFAULT_USER_ID,
      applicationId,
      title,
      description,
      dueDate: new Date(dueDate),
    });

    return NextResponse.json({ success: true, title }, { status: 201 });
  } catch (error) {
    console.error("POST /api/follow-ups error:", error);
    return NextResponse.json(
      { error: "Failed to create follow-up" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    await markFollowUpDone(id);

    return NextResponse.json({ success: true, id, status: "done" });
  } catch (error) {
    console.error("PATCH /api/follow-ups error:", error);
    return NextResponse.json(
      { error: "Failed to mark follow-up as done" },
      { status: 500 }
    );
  }
}
