import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

/**
 * POST /api/jobs/[id]/hide
 * Hide a job. Persists across runs via the IgnoredJob table.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Look up the canonical job
    const job = await prisma.jobPostingCanonical.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const titleNorm = normalize(job.title);
    const companyNorm = normalize(job.company);

    // Create a persistent ignore record (upsert to avoid duplicates)
    await prisma.ignoredJob.upsert({
      where: {
        titleNorm_companyNorm: { titleNorm, companyNorm },
      },
      create: {
        titleNorm,
        companyNorm,
        titleDisplay: job.title,
        companyDisplay: job.company,
      },
      update: {},
    });

    // Remove the job from the current display:
    // delete RankedJob, WarmPaths, OutreachDrafts, JobScore records for this job
    await prisma.rankedJob.deleteMany({ where: { jobId: id } });
    await prisma.warmPathRecommendation.deleteMany({ where: { jobId: id } });
    await prisma.outreachDraft.deleteMany({ where: { jobId: id } });
    await prisma.jobScore.deleteMany({ where: { jobId: id } });
    // Unlink raw postings
    await prisma.jobPostingRaw.updateMany({
      where: { canonicalJobId: id },
      data: { canonicalJobId: null },
    });
    // Finally delete the canonical job itself
    await prisma.jobPostingCanonical.delete({ where: { id } });

    return NextResponse.json({ success: true, hidden: { titleNorm, companyNorm } });
  } catch (error) {
    console.error("POST /api/jobs/[id]/hide error:", error);
    return NextResponse.json(
      { error: "Failed to hide job" },
      { status: 500 }
    );
  }
}
