import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/types";
import { runHuntRun } from "@/lib/services/hunt-run-orchestrator";

export async function GET() {
  try {
    const huntRuns = await prisma.huntRun.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { steps: true, rankedJobs: true } },
      },
    });

    const result = huntRuns.map((run) => ({
      id: run.id,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      queriesGenerated: run.queriesGenerated,
      jobsFetched: run.jobsFetched,
      jobsCanonical: run.jobsCanonical,
      jobsRanked: run.jobsRanked,
      connectionsFound: run.connectionsFound,
      errors: JSON.parse(run.errors),
      stepCount: run._count.steps,
      rankedJobCount: run._count.rankedJobs,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/hunt-runs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hunt runs" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Create the run record first so we can return the ID immediately
    const run = await prisma.huntRun.create({
      data: {
        userId: DEFAULT_USER_ID,
        status: "running",
        startedAt: new Date(),
      },
    });

    // Fire and forget - the orchestrator runs in the background
    // We pass the pre-created run ID so the orchestrator uses it
    runHuntRun(DEFAULT_USER_ID, run.id).catch((err) => {
      console.error("Hunt run background error:", err);
    });

    return NextResponse.json({ id: run.id, status: "running" }, { status: 202 });
  } catch (error) {
    console.error("POST /api/hunt-runs error:", error);
    return NextResponse.json(
      { error: "Failed to start hunt run" },
      { status: 500 }
    );
  }
}
