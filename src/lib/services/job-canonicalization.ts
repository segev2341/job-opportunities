import { prisma } from "@/lib/db";

/**
 * Deduplicate raw jobs into canonical records.
 * Two raw jobs are considered duplicates if title+company match closely.
 */
export async function canonicalizeJobs(): Promise<number> {
  const unlinked = await prisma.jobPostingRaw.findMany({
    where: { canonicalJobId: null },
  });

  if (unlinked.length === 0) return 0;

  const existing = await prisma.jobPostingCanonical.findMany();
  let created = 0;

  for (const raw of unlinked) {
    // Check if a canonical job already exists for this title+company
    const normTitle = normalize(raw.title);
    const normCompany = normalize(raw.company);

    const match = existing.find(
      (c) => normalize(c.title) === normTitle && normalize(c.company) === normCompany
    );

    if (match) {
      // Link raw to existing canonical; mark as potential repost
      await prisma.jobPostingRaw.update({
        where: { id: raw.id },
        data: { canonicalJobId: match.id },
      });

      // If the raw posting is newer, it might be a repost
      if (raw.postedAt && match.postedAt && raw.postedAt > match.postedAt) {
        await prisma.jobPostingCanonical.update({
          where: { id: match.id },
          data: { isRepost: true },
        });
      }
    } else {
      // Parse extra fields from payload
      let sector: string | undefined;
      let seniority: string | undefined;
      let employmentType: string | undefined;
      try {
        const payload = JSON.parse(raw.payload);
        sector = payload.sector;
        seniority = payload.seniority;
        employmentType = payload.employmentType;
      } catch {}

      const canonical = await prisma.jobPostingCanonical.create({
        data: {
          title: raw.title,
          company: raw.company,
          location: raw.location,
          url: raw.url,
          description: raw.description,
          postedAt: raw.postedAt,
          sector: sector ?? null,
          seniority: seniority ?? null,
          employmentType: employmentType ?? null,
        },
      });

      await prisma.jobPostingRaw.update({
        where: { id: raw.id },
        data: { canonicalJobId: canonical.id },
      });

      existing.push(canonical);
      created++;
    }
  }

  return created;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}
