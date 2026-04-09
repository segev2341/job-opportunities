import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create default user - Segev Frank, based on his real CV
  const user = await prisma.user.upsert({
    where: { id: "default-user" },
    update: {
      name: "Segev Frank",
      email: "Segev2341@gmail.com",
      linkedinUrl: "https://www.linkedin.com/in/segev-frank60514620b/",
    },
    create: {
      id: "default-user",
      name: "Segev Frank",
      email: "Segev2341@gmail.com",
      linkedinUrl: "https://www.linkedin.com/in/segev-frank60514620b/",
    },
  });
  console.log(`User upserted: ${user.id} (${user.name})`);

  // 2. Create user preferences based on Segev's CV
  // Background: Shaldag (IAF Special Forces), Program Manager, BA Mgmt & Philosophy
  // Target: Junior/entry-level business development, pre-sales, HR roles
  const targetRoles = [
    // Sales / BD / Pre-sales
    "Business Development",
    "Pre-Sales",
    "Sales Enablement",
    "Account Executive",
    "Strategic Partnerships",
    "Customer Success",
    "Business Operations",
    "Program Manager",
    // HR / People (junior, no 3+ years required)
    "HR Coordinator",
    "HR Generalist",
    "Recruiter",
    "People Operations",
    "HR Specialist",
    "HR Associate",
  ];

  const targetSectors = [
    "cybersecurity",
    "defence tech",
    "defense technology",
    "authentication",
    "IAM",
    "cloud security",
    "zero trust",
    "endpoint security",
    "national security tech",
  ];

  const resumeKeywords = [
    // From CV work experience
    "program management",
    "stakeholder management",
    "strategic partnerships",
    "program growth",
    "cross-functional leadership",
    "operations management",
    "vendor management",
    "team leadership",
    // Military / background
    "Shaldag",
    "IAF",
    "special forces",
    "combat officer",
    "reserves commander",
    // General
    "non-profit",
    "partnerships",
    "business development",
    "cyber",
    "defense",
  ];

  const prefsData = {
    targetRoles: JSON.stringify(targetRoles),
    targetSectors: JSON.stringify(targetSectors),
    targetLocations: JSON.stringify([
      "Israel",
      "Tel Aviv",
      "Ramat Hasharon",
      "Herzliya",
      "Raanana",
    ]),
    // Segev is wrapping up his BA (2022-2026) and is early-career in BD/sales
    // but brings ~6 years of military + ~4 years of civilian ops experience
    experienceYears: 2, // junior in the target field (BD/sales/HR)
    backgroundTags: JSON.stringify([
      "IAF",
      "Shaldag",
      "Special Forces",
      "TAU",
    ]),
    resumeKeywords: JSON.stringify(resumeKeywords),
  };

  const prefs = await prisma.userPreferences.upsert({
    where: { userId: "default-user" },
    update: prefsData,
    create: {
      userId: "default-user",
      ...prefsData,
    },
  });
  console.log(`UserPreferences upserted: ${prefs.id}`);

  // 3. Create search profile
  const searchProfileId = "main-search-profile";
  const searchProfile = await prisma.searchProfile.upsert({
    where: { id: searchProfileId },
    update: {
      name: "Main Search",
      userId: "default-user",
      isActive: true,
    },
    create: {
      id: searchProfileId,
      userId: "default-user",
      name: "Main Search",
      isActive: true,
    },
  });
  console.log(`SearchProfile upserted: ${searchProfile.id} (${searchProfile.name})`);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
