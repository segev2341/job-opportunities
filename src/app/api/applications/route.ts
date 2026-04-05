import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_USER_ID } from "@/lib/types";
import {
  getApplications,
  updateApplicationStatus,
} from "@/lib/services/application-tracking";

export async function GET() {
  try {
    const applications = await getApplications(DEFAULT_USER_ID);
    return NextResponse.json(applications);
  } catch (error) {
    console.error("GET /api/applications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { applicationId, status } = body;

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: "applicationId and status are required" },
        { status: 400 }
      );
    }

    await updateApplicationStatus(applicationId, status);

    return NextResponse.json({ success: true, applicationId, status });
  } catch (error) {
    console.error("PATCH /api/applications error:", error);
    return NextResponse.json(
      { error: "Failed to update application status" },
      { status: 500 }
    );
  }
}
