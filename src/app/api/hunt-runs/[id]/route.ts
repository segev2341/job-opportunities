import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const huntRun = await prisma.huntRun.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { createdAt: "asc" },
        },
        rankedJobs: {
          orderBy: { rank: "asc" },
          include: {
            job: {
              include: {
                scores: true,
                warmPaths: {
                  include: { person: true },
                },
                outreachDrafts: {
                  include: { person: true },
                },
                applications: true,
              },
            },
          },
        },
      },
    });

    if (!huntRun) {
      return NextResponse.json(
        { error: "Hunt run not found" },
        { status: 404 }
      );
    }

    const result = {
      id: huntRun.id,
      status: huntRun.status,
      startedAt: huntRun.startedAt,
      completedAt: huntRun.completedAt,
      queriesGenerated: huntRun.queriesGenerated,
      jobsFetched: huntRun.jobsFetched,
      jobsCanonical: huntRun.jobsCanonical,
      jobsRanked: huntRun.jobsRanked,
      connectionsFound: huntRun.connectionsFound,
      errors: JSON.parse(huntRun.errors),
      createdAt: huntRun.createdAt,
      updatedAt: huntRun.updatedAt,
      steps: huntRun.steps.map((step) => ({
        id: step.id,
        name: step.name,
        status: step.status,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
        detail: step.detail,
        error: step.error,
        createdAt: step.createdAt,
      })),
      rankedJobs: huntRun.rankedJobs.map((rj) => ({
        id: rj.id,
        rank: rj.rank,
        score: rj.score,
        whyRelevant: rj.whyRelevant,
        whoCanHelp: JSON.parse(rj.whoCanHelp),
        whatToDoFirst: rj.whatToDoFirst,
        action: rj.action,
        job: {
          id: rj.job.id,
          title: rj.job.title,
          company: rj.job.company,
          location: rj.job.location,
          url: rj.job.url,
          description: rj.job.description,
          seniority: rj.job.seniority,
          employmentType: rj.job.employmentType,
          sector: rj.job.sector,
          postedAt: rj.job.postedAt,
          scores: rj.job.scores,
          warmPaths: rj.job.warmPaths.map((wp) => ({
            id: wp.id,
            pathType: wp.pathType,
            strength: wp.strength,
            explanation: wp.explanation,
            suggestedMessage: wp.suggestedMessage,
            person: {
              id: wp.person.id,
              name: wp.person.name,
              title: wp.person.title,
              companyName: wp.person.companyName,
              linkedinUrl: wp.person.linkedinUrl,
              connectionDegree: wp.person.connectionDegree,
            },
          })),
          outreachDrafts: rj.job.outreachDrafts.map((od) => ({
            id: od.id,
            channel: od.channel,
            subject: od.subject,
            body: od.body,
            person: {
              id: od.person.id,
              name: od.person.name,
              title: od.person.title,
              companyName: od.person.companyName,
            },
          })),
          applications: rj.job.applications,
        },
      })),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/hunt-runs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hunt run" },
      { status: 500 }
    );
  }
}
