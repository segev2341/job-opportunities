import { prisma } from "@/lib/db";
import type { RawJobFromProvider } from "@/lib/types";

/**
 * Store raw job postings in the database, deduplicating by source+externalId.
 */
export async function ingestRawJobs(jobs: RawJobFromProvider[]): Promise<number> {
  let ingested = 0;

  for (const job of jobs) {
    try {
      await prisma.jobPostingRaw.upsert({
        where: {
          source_externalId: {
            source: job.source,
            externalId: job.externalId,
          },
        },
        create: {
          source: job.source,
          externalId: job.externalId,
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url,
          description: job.description,
          postedAt: job.postedAt ? new Date(job.postedAt) : null,
          payload: JSON.stringify(job),
        },
        update: {
          title: job.title,
          description: job.description,
          payload: JSON.stringify(job),
        },
      });
      ingested++;
    } catch (e) {
      console.error(`Failed to ingest job ${job.externalId}:`, e);
    }
  }

  return ingested;
}
