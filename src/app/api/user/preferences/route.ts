import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID, type UserPreferencesInput } from "@/lib/types";

export async function GET() {
  try {
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: DEFAULT_USER_ID },
    });

    if (!prefs) {
      return NextResponse.json(
        { error: "User preferences not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: prefs.id,
      userId: prefs.userId,
      targetRoles: JSON.parse(prefs.targetRoles),
      targetSectors: JSON.parse(prefs.targetSectors),
      targetLocations: JSON.parse(prefs.targetLocations),
      experienceYears: prefs.experienceYears,
      backgroundTags: JSON.parse(prefs.backgroundTags),
      resumeKeywords: JSON.parse(prefs.resumeKeywords),
      createdAt: prefs.createdAt,
      updatedAt: prefs.updatedAt,
    });
  } catch (error) {
    console.error("GET /api/user/preferences error:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: UserPreferencesInput = await request.json();

    const prefs = await prisma.userPreferences.upsert({
      where: { userId: DEFAULT_USER_ID },
      update: {
        targetRoles: JSON.stringify(body.targetRoles),
        targetSectors: JSON.stringify(body.targetSectors),
        targetLocations: JSON.stringify(body.targetLocations),
        experienceYears: body.experienceYears,
        backgroundTags: JSON.stringify(body.backgroundTags),
        resumeKeywords: JSON.stringify(body.resumeKeywords),
      },
      create: {
        userId: DEFAULT_USER_ID,
        targetRoles: JSON.stringify(body.targetRoles),
        targetSectors: JSON.stringify(body.targetSectors),
        targetLocations: JSON.stringify(body.targetLocations),
        experienceYears: body.experienceYears,
        backgroundTags: JSON.stringify(body.backgroundTags),
        resumeKeywords: JSON.stringify(body.resumeKeywords),
      },
    });

    return NextResponse.json({
      id: prefs.id,
      userId: prefs.userId,
      targetRoles: JSON.parse(prefs.targetRoles),
      targetSectors: JSON.parse(prefs.targetSectors),
      targetLocations: JSON.parse(prefs.targetLocations),
      experienceYears: prefs.experienceYears,
      backgroundTags: JSON.parse(prefs.backgroundTags),
      resumeKeywords: JSON.parse(prefs.resumeKeywords),
      createdAt: prefs.createdAt,
      updatedAt: prefs.updatedAt,
    });
  } catch (error) {
    console.error("PUT /api/user/preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
