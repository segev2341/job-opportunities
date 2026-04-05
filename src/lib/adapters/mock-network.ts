import { NetworkProvider, PersonFromProvider } from "@/lib/types";

// ─── Realistic Israeli names and titles ────────────────────────

interface MockPersonTemplate {
  name: string;
  titleTemplates: string[];
  backgroundTags: string[];
  connectionDegree: 1 | 2;
  isConnected: boolean;
  mutualConnectionName?: string;
  mutualConnectionUrl?: string;
}

const FIRST_NAMES = [
  "Yonatan",
  "Amir",
  "Tal",
  "Noa",
  "Shira",
  "Omer",
  "Rotem",
  "Liora",
  "Eitan",
  "Gil",
  "Dana",
  "Ori",
  "Yael",
  "Ido",
  "Maya",
  "Nimrod",
  "Tamar",
  "Ran",
  "Gal",
  "Matan",
  "Nir",
  "Einav",
  "Itai",
  "Shai",
  "Hila",
  "Nadav",
  "Amit",
  "Keren",
  "Dor",
  "Chen",
];

const LAST_NAMES = [
  "Cohen",
  "Levi",
  "Mizrachi",
  "Peretz",
  "Goldberg",
  "Shapira",
  "Friedman",
  "Avraham",
  "Katz",
  "Blum",
  "Dahan",
  "Rosenberg",
  "Ben-David",
  "Azoulay",
  "Bar-On",
  "Stern",
  "Klein",
  "Alon",
  "Golan",
  "Navon",
  "Oren",
  "Carmel",
  "Almog",
  "Lazar",
  "Shani",
  "Zohar",
  "Ronen",
  "Baruch",
  "Harari",
  "Koren",
];

const TITLES_BD_SALES = [
  "Business Development Manager",
  "Sales Director",
  "VP Business Development",
  "Account Executive",
  "Enterprise Sales Manager",
  "Head of Strategic Partnerships",
  "Channel Sales Manager",
  "Regional Sales Director",
  "Senior Account Executive",
  "Partnership Manager",
  "GTM Lead",
  "Commercial Director",
];

const TITLES_GENERAL = [
  "Product Manager",
  "Engineering Manager",
  "HR Business Partner",
  "Talent Acquisition Lead",
  "VP Operations",
  "Solutions Architect",
  "Director of Customer Success",
  "Head of Marketing",
  "Chief of Staff",
  "VP Strategy",
  "Director of Sales Engineering",
];

const MUTUAL_CONNECTIONS = [
  { name: "Avi Reshef", url: "https://www.linkedin.com/in/avireshef" },
  { name: "Michal Levy", url: "https://www.linkedin.com/in/michallevy" },
  { name: "Noam Gershon", url: "https://www.linkedin.com/in/noamgershon" },
  { name: "Roni Bar-Lev", url: "https://www.linkedin.com/in/ronibarlev" },
  { name: "Tomer Shalit", url: "https://www.linkedin.com/in/tomershalit" },
  { name: "Dafna Cohen", url: "https://www.linkedin.com/in/dafnacohen" },
  { name: "Yossi Almog", url: "https://www.linkedin.com/in/yossialmog" },
  { name: "Lior Navon", url: "https://www.linkedin.com/in/liornavon" },
];

// Deterministic randomness for consistent results
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function generatePeopleForCompany(
  companyName: string
): PersonFromProvider[] {
  // Seed based on company name for consistency
  const seed = companyName
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = seededRandom(seed);

  const numPeople = 2 + Math.floor(rand() * 4); // 2-5 people
  const people: PersonFromProvider[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < numPeople; i++) {
    let fullName: string;
    do {
      fullName = `${pick(FIRST_NAMES, rand)} ${pick(LAST_NAMES, rand)}`;
    } while (usedNames.has(fullName));
    usedNames.add(fullName);

    // Determine connection properties
    const is1stDegree = rand() < 0.4; // 40% chance of 1st degree
    const connectionDegree: 1 | 2 = is1stDegree ? 1 : 2;

    // Build background tags
    const tags: string[] = [];
    const tagRoll = rand();
    if (tagRoll < 0.25) {
      tags.push("IAF");
    } else if (tagRoll < 0.35) {
      tags.push("IAF", "Unit 8200");
    } else if (tagRoll < 0.45) {
      tags.push("IAF", "Special Forces");
    } else if (tagRoll < 0.55) {
      tags.push("IDF");
    }

    const eduRoll = rand();
    if (eduRoll < 0.35) {
      tags.push("TAU");
    } else if (eduRoll < 0.55) {
      tags.push("Technion");
    } else if (eduRoll < 0.65) {
      tags.push("Hebrew University");
    } else if (eduRoll < 0.72) {
      tags.push("IDC Herzliya");
    }

    if (rand() < 0.2) {
      tags.push("MBA");
    }

    // Pick a title - mix of BD/sales and general titles
    const isBdTitle = rand() < 0.6;
    const title = isBdTitle
      ? pick(TITLES_BD_SALES, rand)
      : pick(TITLES_GENERAL, rand);

    // For 2nd-degree connections, add mutual connection info
    let mutualConnectionName: string | undefined;
    let mutualConnectionUrl: string | undefined;
    if (connectionDegree === 2) {
      const mutual = pick(MUTUAL_CONNECTIONS, rand);
      mutualConnectionName = mutual.name;
      mutualConnectionUrl = mutual.url;
    }

    const linkedinSlug = fullName
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/-/g, "");

    people.push({
      name: fullName,
      title: `${title} at ${companyName}`,
      companyName,
      linkedinUrl: `https://www.linkedin.com/in/${linkedinSlug}`,
      connectionDegree,
      isConnected: is1stDegree,
      backgroundTags: tags,
      mutualConnectionName,
      mutualConnectionUrl,
    });
  }

  return people;
}

// Pre-generate people for all target companies
const COMPANY_PEOPLE_CACHE: Record<string, PersonFromProvider[]> = {};

export const mockNetworkProvider: NetworkProvider = {
  async findConnectionsAtCompany(
    companyName: string
  ): Promise<PersonFromProvider[]> {
    if (!COMPANY_PEOPLE_CACHE[companyName]) {
      COMPANY_PEOPLE_CACHE[companyName] =
        generatePeopleForCompany(companyName);
    }
    return COMPANY_PEOPLE_CACHE[companyName];
  },
};
