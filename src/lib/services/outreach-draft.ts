import { prisma } from "@/lib/db";

/**
 * Generate outreach message drafts for warm path recommendations.
 * The warm-path service already generates suggested messages, so this
 * service creates formal OutreachDraft records from those.
 */
export async function generateOutreachDrafts(): Promise<number> {
  const warmPaths = await prisma.warmPathRecommendation.findMany({
    include: { person: true, job: true },
  });

  let created = 0;

  for (const wp of warmPaths) {
    // Check if draft already exists
    const existing = await prisma.outreachDraft.findFirst({
      where: { jobId: wp.jobId, personId: wp.personId },
    });
    if (existing) continue;

    if (!wp.suggestedMessage) continue;

    await prisma.outreachDraft.create({
      data: {
        jobId: wp.jobId,
        personId: wp.personId,
        channel: "linkedin",
        subject: `Re: ${wp.job.title} at ${wp.job.company}`,
        body: wp.suggestedMessage,
      },
    });
    created++;
  }

  return created;
}
