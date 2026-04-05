import { prisma } from "@/lib/db";
import { TARGET_ROLES, TARGET_SECTORS, TARGET_COMPANIES_ISRAEL } from "@/lib/types";
import type { ScoreBreakdown } from "@/lib/types";

const TARGET_ROLES_LOWER = TARGET_ROLES.map((r) => r.toLowerCase());
const TARGET_SECTORS_LOWER = TARGET_SECTORS.map((s) => s.toLowerCase());
const TARGET_COMPANIES_LOWER = TARGET_COMPANIES_ISRAEL.map((c) => c.toLowerCase());

const ENGINEERING_EXCLUDE = [
  "software engineer", "devops", "backend engineer", "frontend engineer",
  "full stack", "fullstack", "data engineer", "ml engineer", "qa engineer",
  "sre", "platform engineer", "developer", "architect", "r&d",
  "algorithm", "data scientist", "firmware", "hardware engineer",
  "embedded engineer",
];
const BUSINESS_ENGINEER_OK = ["sales engineer", "solutions engineer", "customer engineer", "field engineer"];

/**
 * Score a canonical job against user preferences.
 * Returns 0-100 with breakdown.
 */
export function scoreJob(
  title: string,
  company: string,
  location: string,
  description: string,
  sector: string | null,
  seniority: string | null,
  hasConnections: boolean,
  connectionCount: number
): ScoreBreakdown {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  const companyLower = company.toLowerCase();
  const allText = `${titleLower} ${descLower} ${companyLower} ${(sector ?? "").toLowerCase()}`;

  // Filter out engineering roles
  const isTechRole = ENGINEERING_EXCLUDE.some((e) => titleLower.includes(e));
  const isBusinessEng = BUSINESS_ENGINEER_OK.some((b) => titleLower.includes(b));
  if (isTechRole && !isBusinessEng) {
    return {
      overallScore: 0,
      roleFitScore: 0,
      sectorFitScore: 0,
      seniorityScore: 0,
      locationScore: 0,
      networkScore: 0,
      companyScore: 0,
      explanation: "Engineering/technical role - not a match for business-focused profile.",
    };
  }

  // 1. Role fit (0-25)
  let roleFitScore = 0;
  const roleMatches = TARGET_ROLES_LOWER.filter((r) => titleLower.includes(r) || descLower.includes(r));
  if (roleMatches.length > 0) roleFitScore = Math.min(25, 15 + roleMatches.length * 3);
  else {
    // Partial keyword match
    const keywords = ["sales", "business", "partnership", "account", "commercial", "gtm", "channel", "alliances", "enablement", "pre-sales", "presales"];
    const kwHits = keywords.filter((k) => titleLower.includes(k));
    roleFitScore = Math.min(20, kwHits.length * 7);
  }

  // 2. Sector fit (0-25)
  let sectorFitScore = 0;
  const sectorMatches = TARGET_SECTORS_LOWER.filter((s) => allText.includes(s));
  if (sectorMatches.length > 0) sectorFitScore = Math.min(25, 12 + sectorMatches.length * 4);
  else {
    const secKeywords = ["security", "cyber", "defense", "defence", "military", "intelligence", "threat", "identity", "fraud", "authentication"];
    const secHits = secKeywords.filter((k) => allText.includes(k));
    sectorFitScore = Math.min(20, secHits.length * 5);
  }

  // 3. Seniority fit (0-15)
  let seniorityScore = 10; // default mid
  const senLower = (seniority ?? "").toLowerCase();
  if (senLower.includes("mid") || senLower.includes("associate") || senLower.includes("senior")) {
    seniorityScore = 15;
  } else if (senLower.includes("entry")) {
    seniorityScore = 8;
  } else if (senLower.includes("director") || senLower.includes("vp") || senLower.includes("executive")) {
    seniorityScore = 5;
  }
  // Check title for seniority clues
  if (titleLower.includes("junior") || titleLower.includes("intern")) seniorityScore = 3;
  if (titleLower.includes("senior") && !titleLower.includes("vp")) seniorityScore = 15;

  // 4. Location fit (0-15)
  const locLower = location.toLowerCase();
  let locationScore = 0;
  if (locLower.includes("israel") || locLower.includes("tel aviv") || locLower.includes("herzliya") || locLower.includes("raanana") || locLower.includes("petah tikva") || locLower.includes("be'er sheva") || locLower.includes("haifa")) {
    locationScore = 15;
  } else if (locLower.includes("remote")) {
    locationScore = 10;
  }

  // 5. Network score (0-10)
  let networkScore = 0;
  if (hasConnections) {
    networkScore = Math.min(10, 4 + connectionCount * 2);
  }

  // 6. Company score (0-10)
  let companyScore = 0;
  const isTargetCompany = TARGET_COMPANIES_LOWER.some(
    (tc) => companyLower.includes(tc) || tc.includes(companyLower)
  );
  if (isTargetCompany) companyScore = 10;
  else {
    // Partial credit for sector-adjacent companies
    const secIndicators = ["security", "cyber", "defense", "defence", "intelligence"];
    if (secIndicators.some((s) => companyLower.includes(s))) companyScore = 6;
  }

  const overallScore = Math.min(100, roleFitScore + sectorFitScore + seniorityScore + locationScore + networkScore + companyScore);

  // Build explanation
  const reasons: string[] = [];
  if (roleFitScore >= 15) reasons.push(`Strong role match (${roleMatches.join(", ")})`);
  else if (roleFitScore >= 7) reasons.push("Partial role match");
  if (sectorFitScore >= 12) reasons.push(`Target sector (${sectorMatches.slice(0, 2).join(", ")})`);
  if (isTargetCompany) reasons.push("Target company");
  if (locationScore >= 15) reasons.push("Located in Israel");
  if (hasConnections) reasons.push(`${connectionCount} connection(s) at company`);
  if (reasons.length === 0) reasons.push("General match based on keywords");

  return {
    overallScore,
    roleFitScore,
    sectorFitScore,
    seniorityScore,
    locationScore,
    networkScore,
    companyScore,
    explanation: reasons.join(". ") + ".",
  };
}

/**
 * Score all unscored canonical jobs and persist JobScore records.
 */
export async function scoreAllJobs(huntRunId: string): Promise<number> {
  const jobs = await prisma.jobPostingCanonical.findMany();
  let scored = 0;

  for (const job of jobs) {
    // Check for connections at this company
    const people = await prisma.person.findMany({
      where: { companyName: { contains: job.company } },
    });

    const breakdown = scoreJob(
      job.title,
      job.company,
      job.location,
      job.description,
      job.sector,
      job.seniority,
      people.length > 0,
      people.length
    );

    // Skip 0-score jobs (engineering roles)
    if (breakdown.overallScore === 0) continue;

    await prisma.jobScore.create({
      data: {
        jobId: job.id,
        huntRunId,
        overallScore: breakdown.overallScore,
        roleFitScore: breakdown.roleFitScore,
        sectorFitScore: breakdown.sectorFitScore,
        seniorityScore: breakdown.seniorityScore,
        locationScore: breakdown.locationScore,
        networkScore: breakdown.networkScore,
        companyScore: breakdown.companyScore,
        explanation: breakdown.explanation,
      },
    });
    scored++;
  }

  return scored;
}
