import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create default user
  const user = await prisma.user.upsert({
    where: { id: "default-user" },
    update: {
      name: "Segev",
      email: "segev@example.com",
    },
    create: {
      id: "default-user",
      name: "Segev",
      email: "segev@example.com",
    },
  });
  console.log(`User upserted: ${user.id} (${user.name})`);

  // 2. Create user preferences
  const prefs = await prisma.userPreferences.upsert({
    where: { userId: "default-user" },
    update: {
      targetRoles: JSON.stringify([
        "Business Development",
        "Pre-Sales",
        "Sales Enablement",
        "Account Executive",
        "Strategic Partnerships",
      ]),
      targetSectors: JSON.stringify([
        "cybersecurity",
        "defence tech",
        "authentication",
        "IAM",
        "cloud security",
        "zero trust",
        "endpoint security",
      ]),
      targetLocations: JSON.stringify([
        "Israel",
        "Tel Aviv",
        "Herzliya",
        "Raanana",
      ]),
      experienceYears: 5,
      backgroundTags: JSON.stringify(["IAF", "TAU"]),
      resumeKeywords: JSON.stringify([
        "sales",
        "business development",
        "defense",
        "security",
        "cyber",
        "military",
        "leadership",
        "strategy",
        "partnerships",
        "account management",
      ]),
    },
    create: {
      userId: "default-user",
      targetRoles: JSON.stringify([
        "Business Development",
        "Pre-Sales",
        "Sales Enablement",
        "Account Executive",
        "Strategic Partnerships",
      ]),
      targetSectors: JSON.stringify([
        "cybersecurity",
        "defence tech",
        "authentication",
        "IAM",
        "cloud security",
        "zero trust",
        "endpoint security",
      ]),
      targetLocations: JSON.stringify([
        "Israel",
        "Tel Aviv",
        "Herzliya",
        "Raanana",
      ]),
      experienceYears: 5,
      backgroundTags: JSON.stringify(["IAF", "TAU"]),
      resumeKeywords: JSON.stringify([
        "sales",
        "business development",
        "defense",
        "security",
        "cyber",
        "military",
        "leadership",
        "strategy",
        "partnerships",
        "account management",
      ]),
    },
  });
  console.log(`UserPreferences upserted: ${prefs.id}`);

  // 3. Create search profile
  // Use a deterministic ID so repeated runs don't create duplicates
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
