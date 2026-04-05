import { prisma } from "@/lib/db";
import type { NetworkProvider } from "@/lib/types";

/**
 * Find connections at target companies and store Person records.
 */
export async function discoverConnections(
  companyNames: string[],
  provider: NetworkProvider
): Promise<number> {
  const unique = [...new Set(companyNames)];
  let total = 0;

  for (const companyName of unique) {
    const people = await provider.findConnectionsAtCompany(companyName);

    // Find or create Company record
    const company = await prisma.company.findUnique({ where: { name: companyName } });

    for (const p of people) {
      // Handle mutual connection
      let mutualId: string | null = null;
      if (p.mutualConnectionName) {
        const mutual = await prisma.person.findFirst({
          where: { name: p.mutualConnectionName },
        });
        if (mutual) {
          mutualId = mutual.id;
        } else {
          const created = await prisma.person.create({
            data: {
              name: p.mutualConnectionName,
              linkedinUrl: p.mutualConnectionUrl ?? null,
              connectionDegree: 1,
              isConnected: true,
              backgroundTags: "[]",
            },
          });
          mutualId = created.id;
        }
      }

      // Upsert the person
      const existing = await prisma.person.findFirst({
        where: {
          name: p.name,
          companyName: companyName,
        },
      });

      if (existing) {
        await prisma.person.update({
          where: { id: existing.id },
          data: {
            title: p.title ?? existing.title,
            connectionDegree: p.connectionDegree,
            isConnected: p.isConnected,
            backgroundTags: JSON.stringify(p.backgroundTags),
            mutualConnectionId: mutualId,
          },
        });
      } else {
        await prisma.person.create({
          data: {
            name: p.name,
            title: p.title ?? null,
            companyId: company?.id ?? null,
            companyName: companyName,
            linkedinUrl: p.linkedinUrl ?? null,
            connectionDegree: p.connectionDegree,
            isConnected: p.isConnected,
            backgroundTags: JSON.stringify(p.backgroundTags),
            mutualConnectionId: mutualId,
          },
        });
      }
      total++;
    }
  }

  return total;
}
