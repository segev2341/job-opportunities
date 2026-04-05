import { prisma } from "@/lib/db";
import { TARGET_ROLES, TARGET_SECTORS, TARGET_COMPANIES_ISRAEL } from "@/lib/types";

/**
 * Generate search query variants from user preferences.
 * Combines roles x sectors x locations to create broad coverage.
 */
export async function expandQueries(userId: string): Promise<string[]> {
  const prefs = await prisma.userPreferences.findUnique({ where: { userId } });

  const roles: string[] = prefs ? JSON.parse(prefs.targetRoles) : TARGET_ROLES.slice(0, 5);
  const sectors: string[] = prefs ? JSON.parse(prefs.targetSectors) : TARGET_SECTORS.slice(0, 5);
  const locations: string[] = prefs ? JSON.parse(prefs.targetLocations) : ["Israel"];

  const queries: Set<string> = new Set();

  // Strategy 1: role + sector + location
  for (const role of roles.slice(0, 6)) {
    for (const sector of sectors.slice(0, 4)) {
      for (const loc of locations.slice(0, 2)) {
        queries.add(`${role} ${sector} ${loc}`);
      }
    }
  }

  // Strategy 2: role + location (broader)
  for (const role of roles) {
    queries.add(`${role} Israel`);
  }

  // Strategy 3: company + role
  const companies = TARGET_COMPANIES_ISRAEL.slice(0, 15);
  for (const company of companies) {
    queries.add(`${company} sales`);
    queries.add(`${company} business development`);
  }

  // Strategy 4: sector-specific broad queries
  for (const sector of sectors.slice(0, 6)) {
    queries.add(`${sector} sales Israel`);
    queries.add(`${sector} business development Israel`);
  }

  return Array.from(queries);
}
