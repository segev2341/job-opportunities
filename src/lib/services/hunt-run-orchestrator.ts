import { prisma } from "@/lib/db";
import { expandQueries } from "./query-expansion";
import { ingestRawJobs } from "./job-ingestion";
import { canonicalizeJobs } from "./job-canonicalization";
import { scoreAllJobs } from "./job-scoring";
import { enrichCompanies } from "./company-intel";
import { discoverConnections } from "./network-intel";
import { generateWarmPaths } from "./warm-path";
import { generateOutreachDrafts } from "./outreach-draft";
import { mockJobsProvider } from "@/lib/adapters/mock-jobs";
import { mockCompanyProvider } from "@/lib/adapters/mock-companies";
import { mockNetworkProvider } from "@/lib/adapters/mock-network";
import type { RecommendedAction } from "@/lib/types";

/**
 * Run the full job hunt pipeline.
 * This is the core orchestration - one click triggers everything.
 */
export async function runHuntRun(userId: string, existingRunId?: string): Promise<string> {
  let runId: string;

  if (existingRunId) {
    // Use a pre-created run record
    runId = existingRunId;
    await prisma.huntRun.update({
      where: { id: runId },
      data: { status: "running", startedAt: new Date() },
    });
  } else {
    const run = await prisma.huntRun.create({
      data: {
        userId,
        status: "running",
        startedAt: new Date(),
      },
    });
    runId = run.id;
  }

  try {
    // ─── Step 1: Query Expansion ──────────────────────────────
    await createStep(runId, "Query Expansion", async () => {
      const queries = await expandQueries(userId);
      await prisma.huntRun.update({
        where: { id: runId },
        data: { queriesGenerated: queries.length },
      });
      return `Generated ${queries.length} search queries`;
    });

    // ─── Step 2: Job Fetch ────────────────────────────────────
    let fetchedCount = 0;
    await createStep(runId, "Job Fetch", async () => {
      const queries = await expandQueries(userId);
      // TODO: Replace with real providers when ready
      const provider = mockJobsProvider;
      const rawJobs = await provider.fetchJobs(queries, "Israel");
      fetchedCount = rawJobs.length;

      await prisma.huntRun.update({
        where: { id: runId },
        data: { jobsFetched: fetchedCount },
      });
      return `Fetched ${fetchedCount} raw jobs from providers`;
    });

    // ─── Step 3: Job Ingestion ────────────────────────────────
    await createStep(runId, "Job Ingestion", async () => {
      const provider = mockJobsProvider;
      const queries = await expandQueries(userId);
      const rawJobs = await provider.fetchJobs(queries, "Israel");
      const ingested = await ingestRawJobs(rawJobs);
      return `Ingested ${ingested} raw jobs into database`;
    });

    // ─── Step 4: Canonicalization ─────────────────────────────
    let canonicalCount = 0;
    await createStep(runId, "Canonicalization", async () => {
      canonicalCount = await canonicalizeJobs();
      await prisma.huntRun.update({
        where: { id: runId },
        data: { jobsCanonical: canonicalCount },
      });
      return `Created ${canonicalCount} canonical job records`;
    });

    // ─── Step 5: Company Enrichment ───────────────────────────
    await createStep(runId, "Company Enrichment", async () => {
      const jobs = await prisma.jobPostingCanonical.findMany();
      const companyNames = [...new Set(jobs.map((j) => j.company))];
      const provider = mockCompanyProvider;
      const enriched = await enrichCompanies(companyNames, provider);
      return `Enriched ${enriched} companies`;
    });

    // ─── Step 6: Network Discovery ────────────────────────────
    await createStep(runId, "Network Discovery", async () => {
      const jobs = await prisma.jobPostingCanonical.findMany();
      const companyNames = [...new Set(jobs.map((j) => j.company))];
      const provider = mockNetworkProvider;
      const found = await discoverConnections(companyNames, provider);
      await prisma.huntRun.update({
        where: { id: runId },
        data: { connectionsFound: found },
      });
      return `Found ${found} connections across companies`;
    });

    // ─── Step 7: Job Scoring ──────────────────────────────────
    await createStep(runId, "Job Scoring", async () => {
      const scored = await scoreAllJobs(runId);
      return `Scored ${scored} jobs`;
    });

    // ─── Step 8: Warm Path Generation ─────────────────────────
    await createStep(runId, "Warm Path Generation", async () => {
      const paths = await generateWarmPaths();
      return `Generated ${paths} warm path recommendations`;
    });

    // ─── Step 9: Outreach Drafts ──────────────────────────────
    await createStep(runId, "Outreach Drafts", async () => {
      const drafts = await generateOutreachDrafts();
      return `Generated ${drafts} outreach message drafts`;
    });

    // ─── Step 10: Final Ranking ───────────────────────────────
    await createStep(runId, "Final Ranking", async () => {
      const ranked = await buildFinalRanking(runId);
      await prisma.huntRun.update({
        where: { id: runId },
        data: { jobsRanked: ranked },
      });
      return `Ranked ${ranked} jobs with action recommendations`;
    });

    // ─── Complete ─────────────────────────────────────────────
    await prisma.huntRun.update({
      where: { id: runId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await prisma.huntRun.update({
      where: { id: runId },
      data: {
        status: "failed",
        completedAt: new Date(),
        errors: JSON.stringify([msg]),
      },
    });
    console.error("HuntRun failed:", error);
  }

  return runId;
}

// ─── Helpers ──────────────────────────────────────────────────────

async function createStep(
  huntRunId: string,
  name: string,
  execute: () => Promise<string>
) {
  const step = await prisma.huntRunStep.create({
    data: {
      huntRunId,
      name,
      status: "running",
      startedAt: new Date(),
    },
  });

  try {
    const detail = await execute();
    await prisma.huntRunStep.update({
      where: { id: step.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        detail,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await prisma.huntRunStep.update({
      where: { id: step.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        error: msg,
      },
    });
    // Log but don't stop the pipeline
    console.error(`Step "${name}" failed:`, msg);
  }
}

async function buildFinalRanking(huntRunId: string): Promise<number> {
  // Get all scores from this run
  const scores = await prisma.jobScore.findMany({
    where: { huntRunId },
    include: { job: true },
    orderBy: { overallScore: "desc" },
  });

  let ranked = 0;

  for (let i = 0; i < scores.length; i++) {
    const s = scores[i];
    const rank = i + 1;

    // Get warm paths for this job
    const warmPaths = await prisma.warmPathRecommendation.findMany({
      where: { jobId: s.jobId },
      include: { person: { include: { mutualConnection: true } } },
      orderBy: { strength: "desc" },
      take: 5,
    });

    const whoCanHelp = warmPaths.map((wp) => ({
      personId: wp.personId,
      personName: wp.person.name,
      personTitle: wp.person.title,
      personUrl: wp.person.linkedinUrl,
      companyName: wp.person.companyName,
      connectionDegree: wp.person.connectionDegree,
      pathType: wp.pathType,
      strength: wp.strength,
      explanation: wp.explanation,
      suggestedMessage: wp.suggestedMessage,
      mutualConnectionName: wp.person.mutualConnection?.name,
      mutualConnectionUrl: wp.person.mutualConnection?.linkedinUrl,
      backgroundTags: JSON.parse(wp.person.backgroundTags || "[]"),
    }));

    // Determine recommended action
    const action = determineAction(s.overallScore, warmPaths.length, warmPaths.some((wp) => wp.pathType === "referral"));

    // Build explanation
    const whyRelevant = s.explanation;

    // Build "what to do first"
    let whatToDoFirst = "";
    if (action === "apply_now") {
      whatToDoFirst = `Submit your application on LinkedIn and follow up with ${whoCanHelp[0]?.personName ?? "the recruiter"}.`;
    } else if (action === "ask_referral") {
      whatToDoFirst = `Message ${whoCanHelp[0]?.personName ?? "your connection"} to ask for an internal referral before applying.`;
    } else if (action === "ask_intro") {
      const bridge = whoCanHelp.find((w) => w.mutualConnectionName);
      whatToDoFirst = bridge
        ? `Ask ${bridge.mutualConnectionName} to introduce you to ${bridge.personName} at ${s.job.company}.`
        : `Find a mutual connection who can introduce you to someone at ${s.job.company}.`;
    } else if (action === "message_recruiter") {
      whatToDoFirst = `Find the recruiter for this role on LinkedIn and send a direct message expressing interest.`;
    } else {
      whatToDoFirst = `Save for later. Focus on higher-priority opportunities first.`;
    }

    await prisma.rankedJob.create({
      data: {
        huntRunId,
        jobId: s.jobId,
        rank,
        score: s.overallScore,
        whyRelevant,
        whoCanHelp: JSON.stringify(whoCanHelp),
        whatToDoFirst,
        action,
      },
    });

    ranked++;
  }

  return ranked;
}

function determineAction(
  score: number,
  warmPathCount: number,
  hasReferral: boolean
): RecommendedAction {
  if (score >= 70 && hasReferral) return "ask_referral";
  if (score >= 70) return "apply_now";
  if (score >= 50 && warmPathCount > 0) return "ask_intro";
  if (score >= 50) return "message_recruiter";
  if (score >= 30 && warmPathCount > 0) return "ask_intro";
  return "deprioritize";
}
