import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.jobPostingCanonical.findUnique({
      where: { id },
      include: {
        scores: {
          orderBy: { createdAt: "desc" },
        },
        warmPaths: {
          include: {
            person: true,
          },
        },
        outreachDrafts: {
          include: {
            person: true,
          },
        },
        applications: {
          where: { userId: DEFAULT_USER_ID },
          include: {
            outreachEvents: {
              include: { person: true },
              orderBy: { createdAt: "desc" },
            },
            followUpTasks: {
              orderBy: { dueDate: "asc" },
            },
          },
        },
        rankedJobs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const result = {
      id: job.id,
      title: job.title,
      company: job.company,
      companyId: job.companyId,
      location: job.location,
      url: job.url,
      description: job.description,
      seniority: job.seniority,
      employmentType: job.employmentType,
      sector: job.sector,
      postedAt: job.postedAt,
      isRepost: job.isRepost,
      firstSeenAt: job.firstSeenAt,
      createdAt: job.createdAt,
      scores: job.scores,
      latestRanking: job.rankedJobs[0]
        ? {
            rank: job.rankedJobs[0].rank,
            score: job.rankedJobs[0].score,
            whyRelevant: job.rankedJobs[0].whyRelevant,
            whatToDoFirst: job.rankedJobs[0].whatToDoFirst,
            action: job.rankedJobs[0].action,
          }
        : null,
      warmPaths: job.warmPaths.map((wp) => ({
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
          isConnected: wp.person.isConnected,
          backgroundTags: JSON.parse(wp.person.backgroundTags),
        },
      })),
      outreachDrafts: job.outreachDrafts.map((od) => ({
        id: od.id,
        channel: od.channel,
        subject: od.subject,
        body: od.body,
        person: {
          id: od.person.id,
          name: od.person.name,
          title: od.person.title,
          companyName: od.person.companyName,
          linkedinUrl: od.person.linkedinUrl,
        },
        createdAt: od.createdAt,
      })),
      application: job.applications[0]
        ? {
            id: job.applications[0].id,
            status: job.applications[0].status,
            appliedAt: job.applications[0].appliedAt,
            notes: job.applications[0].notes,
            createdAt: job.applications[0].createdAt,
            outreachEvents: job.applications[0].outreachEvents.map((oe) => ({
              id: oe.id,
              type: oe.type,
              channel: oe.channel,
              notes: oe.notes,
              person: oe.person
                ? {
                    id: oe.person.id,
                    name: oe.person.name,
                    title: oe.person.title,
                  }
                : null,
              createdAt: oe.createdAt,
            })),
            followUpTasks: job.applications[0].followUpTasks,
          }
        : null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/jobs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}
