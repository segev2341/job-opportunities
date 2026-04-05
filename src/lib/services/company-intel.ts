import { prisma } from "@/lib/db";
import type { CompanyProvider } from "@/lib/types";

/**
 * Enrich company data using a provider. Caches results in DB.
 */
export async function enrichCompanies(
  companyNames: string[],
  provider: CompanyProvider
): Promise<number> {
  const unique = [...new Set(companyNames)];
  let enriched = 0;

  for (const name of unique) {
    // Check cache
    const existing = await prisma.company.findUnique({ where: { name } });
    if (existing) continue;

    const intel = await provider.getCompanyIntel(name);
    if (!intel) continue;

    await prisma.company.upsert({
      where: { name },
      create: {
        name: intel.name,
        sector: intel.sector ?? null,
        size: intel.size ?? null,
        hq: intel.hq ?? null,
        description: intel.description ?? null,
        linkedinUrl: intel.linkedinUrl ?? null,
        website: intel.website ?? null,
        isTarget: intel.isTarget,
      },
      update: {
        sector: intel.sector ?? undefined,
        size: intel.size ?? undefined,
        description: intel.description ?? undefined,
        isTarget: intel.isTarget,
      },
    });
    enriched++;
  }

  return enriched;
}
