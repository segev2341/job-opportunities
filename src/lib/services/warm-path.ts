import { prisma } from "@/lib/db";
import type { ContactRecommendation } from "@/lib/types";

/**
 * For each canonical job, find the best people to reach out to and create WarmPathRecommendation records.
 */
export async function generateWarmPaths(): Promise<number> {
  const jobs = await prisma.jobPostingCanonical.findMany();
  let total = 0;

  for (const job of jobs) {
    // Find people at this company
    const people = await prisma.person.findMany({
      where: { companyName: { contains: job.company } },
      include: { mutualConnection: true },
    });

    if (people.length === 0) continue;

    // Sort by priority: 1st+IAF > 1st+TAU > 1st+other > 2nd+IAF > 2nd+TAU > 2nd+other
    const scored = people.map((p) => {
      const tags: string[] = JSON.parse(p.backgroundTags || "[]");
      let score = 0;

      // Connection degree
      if (p.connectionDegree === 1) score += 50;
      else if (p.connectionDegree === 2) score += 20;

      // Background tags
      if (tags.includes("IAF") || tags.includes("iaf")) score += 30;
      if (tags.includes("IAF Special Forces") || tags.includes("iaf_special_forces")) score += 25;
      if (tags.includes("TAU") || tags.includes("tel_aviv_university")) score += 15;

      // Connected bonus
      if (p.isConnected) score += 10;

      return { person: p, score, tags };
    });

    scored.sort((a, b) => b.score - a.score);

    // Create warm path for top 5
    for (const { person, score, tags } of scored.slice(0, 5)) {
      const pathType = person.connectionDegree === 1
        ? (person.isConnected ? "referral" : "direct_message")
        : "intro";

      const hasIAF = tags.some((t: string) => t.toLowerCase().includes("iaf"));
      const hasTAU = tags.some((t: string) => t.toLowerCase().includes("tau") || t.toLowerCase().includes("tel aviv"));

      let explanation = "";
      if (person.connectionDegree === 1 && hasIAF) {
        explanation = `${person.name} is a 1st-degree connection from IAF at ${job.company}. Strong warm path for a referral.`;
      } else if (person.connectionDegree === 1 && hasTAU) {
        explanation = `${person.name} is a direct connection from TAU working at ${job.company}. Good candidate for referral.`;
      } else if (person.connectionDegree === 1) {
        explanation = `${person.name} is a 1st-degree connection at ${job.company}. Consider reaching out for a referral.`;
      } else if (person.connectionDegree === 2 && person.mutualConnection) {
        explanation = `${person.name} at ${job.company} is connected via ${person.mutualConnection.name}. Ask for an introduction.`;
      } else {
        explanation = `${person.name} works at ${job.company} (${person.connectionDegree}nd degree). Consider requesting an intro.`;
      }

      // Generate suggested message
      const msg = generateOutreachMessage(person.name, job.company, job.title, tags, person.connectionDegree, person.mutualConnection?.name ?? null);

      await prisma.warmPathRecommendation.create({
        data: {
          jobId: job.id,
          personId: person.id,
          pathType,
          strength: score / 100,
          explanation,
          suggestedMessage: msg,
        },
      });
      total++;
    }
  }

  return total;
}

function generateOutreachMessage(
  personName: string,
  company: string,
  jobTitle: string,
  tags: string[],
  degree: number,
  mutualName: string | null
): string {
  const firstName = personName.split(" ")[0];
  const hasIAF = tags.some((t: string) => t.toLowerCase().includes("iaf"));
  const hasTAU = tags.some((t: string) => t.toLowerCase().includes("tau") || t.toLowerCase().includes("tel aviv"));

  if (degree === 1 && hasIAF) {
    return `Hi ${firstName},\n\nI hope you're doing well! As a fellow IAF veteran, I wanted to reach out about the ${jobTitle} position at ${company}. I've been following the company's work in the security space and believe my background in business development and defense could be a strong fit.\n\nWould you be open to a quick chat about the role and possibly connecting me with the hiring team?\n\nThanks,\nSegev`;
  }

  if (degree === 1 && hasTAU) {
    return `Hi ${firstName},\n\nI noticed we share a TAU connection! I'm reaching out about the ${jobTitle} role at ${company}. With my background in business development within the defense and cyber sectors, I think I could bring real value to the team.\n\nWould you have a few minutes to chat about the opportunity?\n\nBest,\nSegev`;
  }

  if (degree === 1) {
    return `Hi ${firstName},\n\nI saw that ${company} is hiring for a ${jobTitle} position and immediately thought of reaching out. I've been focusing my career on business development in the security space and would love to learn more about the role.\n\nWould you be open to a brief conversation or referring me to the right person?\n\nBest regards,\nSegev`;
  }

  if (degree === 2 && mutualName) {
    return `Hi ${firstName},\n\nI see we're connected through ${mutualName}. I'm very interested in the ${jobTitle} position at ${company} and believe my experience in business development within defense and cyber security aligns well with the role.\n\nWould you be open to connecting? I'd love to learn more about the team and opportunity.\n\nThank you,\nSegev`;
  }

  return `Hi ${firstName},\n\nI came across the ${jobTitle} opportunity at ${company} and I'm very interested. My background spans business development in the defense and cybersecurity sectors, which I believe aligns well with what you're building.\n\nI'd appreciate any insights you could share about the role or team.\n\nBest,\nSegev`;
}
