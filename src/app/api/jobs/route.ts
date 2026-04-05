import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const huntRunId = searchParams.get("huntRunId");

    if (huntRunId) {
      // Get jobs from a specific hunt run via RankedJob
      const rankedJobs = await prisma.rankedJob.findMany({
        where: { huntRunId },
        orderBy: { score: "desc" },
        include: {
          job: {
            include: {
              scores: true,
              warmPaths: {
                include: { person: true },
              },
              applications: {
                where: { userId: DEFAULT_USER_ID },
              },
            },
          },
        },
      });

      const result = rankedJobs.map((rj) => ({
        id: rj.job.id,
        title: rj.job.title,
        company: rj.job.company,
        location: rj.job.location,
        url: rj.job.url,
        seniority: rj.job.seniority,
        employmentType: rj.job.employmentType,
        sector: rj.job.sector,
        postedAt: rj.job.postedAt,
        rank: rj.rank,
        score: rj.score,
        whyRelevant: rj.whyRelevant,
        action: rj.action,
        scores: rj.job.scores,
        warmPaths: rj.job.warmPaths.map((wp) => ({
          id: wp.id,
          pathType: wp.pathType,
          strength: wp.strength,
          explanation: wp.explanation,
          person: {
            id: wp.person.id,
            name: wp.person.name,
            title: wp.person.title,
            companyName: wp.person.companyName,
            linkedinUrl: wp.person.linkedinUrl,
            connectionDegree: wp.person.connectionDegree,
          },
        })),
        applicationStatus: rj.job.applications[0]?.status ?? null,
      }));

      return NextResponse.json(result);
    }

    // Get all canonical jobs
    const jobs = await prisma.jobPostingCanonical.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        scores: {
          orderBy: { overallScore: "desc" },
          take: 1,
        },
        warmPaths: {
          include: { person: true },
        },
        applications: {
          where: { userId: DEFAULT_USER_ID },
        },
      },
    });

    const result = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      seniority: job.seniority,
      employmentType: job.employmentType,
      sector: job.sector,
      postedAt: job.postedAt,
      score: job.scores[0]?.overallScore ?? null,
      scores: job.scores[0] ?? null,
      warmPaths: job.warmPaths.map((wp) => ({
        id: wp.id,
        pathType: wp.pathType,
        strength: wp.strength,
        explanation: wp.explanation,
        person: {
          id: wp.person.id,
          name: wp.person.name,
          title: wp.person.title,
          companyName: wp.person.companyName,
          linkedinUrl: wp.person.linkedinUrl,
          connectionDegree: wp.person.connectionDegree,
        },
      })),
      applicationStatus: job.applications[0]?.status ?? null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
