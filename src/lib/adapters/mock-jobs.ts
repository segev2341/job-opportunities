import {
  JobsProvider,
  RawJobFromProvider,
  TARGET_COMPANIES_ISRAEL,
} from "@/lib/types";

// ─── Realistic mock data pools ──────────────────────────────────

const ROLE_TEMPLATES: {
  title: string;
  seniority: string;
  descSnippets: string[];
}[] = [
  {
    title: "Business Development Manager",
    seniority: "Mid-Senior",
    descSnippets: [
      "Drive new business pipeline in enterprise accounts across EMEA.",
      "Own the full BD cycle from prospecting to deal close with strategic partners.",
      "Identify and qualify new business opportunities within the defense and government sectors.",
    ],
  },
  {
    title: "Business Development Representative",
    seniority: "Entry-Mid",
    descSnippets: [
      "Generate and qualify leads for the enterprise sales team.",
      "Conduct outbound prospecting via LinkedIn, email, and phone.",
      "Partner with Account Executives to build pipeline in key verticals.",
    ],
  },
  {
    title: "Strategic Partnerships Manager",
    seniority: "Mid-Senior",
    descSnippets: [
      "Build and manage technology alliance partnerships with leading cloud and security vendors.",
      "Develop joint go-to-market strategies with channel and technology partners.",
      "Own partner revenue targets and co-selling motions across Israel and EMEA.",
    ],
  },
  {
    title: "Enterprise Account Executive",
    seniority: "Senior",
    descSnippets: [
      "Manage complex enterprise sales cycles ($500K+ ACV) in the cybersecurity space.",
      "Engage C-level stakeholders including CISOs, CTOs, and VPs of Security.",
      "Drive revenue growth within Fortune 500 accounts across the defense and financial sectors.",
    ],
  },
  {
    title: "Sales Engineer",
    seniority: "Mid-Senior",
    descSnippets: [
      "Deliver technical product demonstrations and proof-of-concept engagements.",
      "Partner with Account Executives to articulate technical value propositions.",
      "Support pre-sales activities including RFP responses and security architecture reviews.",
    ],
  },
  {
    title: "Solutions Consultant",
    seniority: "Mid",
    descSnippets: [
      "Design and present tailored security solutions addressing customer pain points.",
      "Translate complex technical capabilities into business value for executive stakeholders.",
      "Collaborate with product and engineering teams on customer feedback loops.",
    ],
  },
  {
    title: "Channel Sales Manager",
    seniority: "Mid-Senior",
    descSnippets: [
      "Recruit, enable, and manage channel partners to drive indirect revenue.",
      "Develop channel programs including deal registration, MDF, and partner certifications.",
      "Build channel partnerships with VARs, MSSPs, and system integrators.",
    ],
  },
  {
    title: "Customer Success Manager",
    seniority: "Mid",
    descSnippets: [
      "Own post-sale relationships and drive product adoption, retention, and expansion.",
      "Conduct QBRs and executive business reviews with enterprise customers.",
      "Identify upsell and cross-sell opportunities within existing accounts.",
    ],
  },
  {
    title: "Pre-Sales Engineer",
    seniority: "Mid-Senior",
    descSnippets: [
      "Lead technical evaluations and PoCs for enterprise prospects.",
      "Create and deliver technical presentations for security teams.",
      "Provide technical guidance during the sales process including integration planning.",
    ],
  },
  {
    title: "Sales Enablement Manager",
    seniority: "Mid-Senior",
    descSnippets: [
      "Design and deliver sales training programs for a fast-growing GTM team.",
      "Create competitive battle cards, playbooks, and objection handling guides.",
      "Partner with marketing and product to ensure sales readiness at launch.",
    ],
  },
  {
    title: "Alliances Manager",
    seniority: "Senior",
    descSnippets: [
      "Manage strategic technology alliances with AWS, Azure, and GCP security ecosystems.",
      "Drive co-sell and co-market programs with alliance partners.",
      "Own alliance partner revenue targets and joint business plans.",
    ],
  },
  {
    title: "GTM Strategy Lead",
    seniority: "Senior",
    descSnippets: [
      "Define go-to-market strategy for new product launches and market expansion.",
      "Analyze market dynamics, competitive landscape, and customer segmentation.",
      "Partner with sales leadership on territory planning and quota allocation.",
    ],
  },
  {
    title: "Account Executive - Mid Market",
    seniority: "Mid",
    descSnippets: [
      "Own the full sales cycle for mid-market accounts in Israel and EMEA.",
      "Achieve quarterly and annual revenue targets through consultative selling.",
      "Build relationships with IT security leaders at mid-market companies.",
    ],
  },
  {
    title: "Regional Sales Director",
    seniority: "Director",
    descSnippets: [
      "Lead a team of Account Executives selling into enterprise accounts in Israel.",
      "Develop and execute regional sales strategy to exceed revenue targets.",
      "Build executive relationships with key accounts in the defense sector.",
    ],
  },
  {
    title: "Business Operations Analyst",
    seniority: "Entry-Mid",
    descSnippets: [
      "Support revenue operations including forecasting, pipeline analysis, and CRM hygiene.",
      "Build dashboards and reports to track GTM metrics and sales performance.",
      "Partner with finance and sales leadership on planning and quota modeling.",
    ],
  },
  {
    title: "Commercial Strategy Manager",
    seniority: "Mid-Senior",
    descSnippets: [
      "Drive pricing strategy, packaging, and commercial models for enterprise products.",
      "Analyze deal structures and support complex contract negotiations.",
      "Partner with product and sales on new market entry and expansion strategies.",
    ],
  },
];

const LOCATIONS = [
  "Tel Aviv, Israel",
  "Tel Aviv-Yafo, Israel",
  "Ramat Gan, Israel",
  "Herzliya, Israel",
  "Petah Tikva, Israel",
  "Beer Sheva, Israel",
  "Haifa, Israel",
  "Tel Aviv, Israel (Hybrid)",
  "Israel (Remote)",
];

const REQUIREMENTS_POOL = [
  "3+ years of experience in B2B sales, business development, or strategic partnerships.",
  "Proven track record of exceeding sales quotas in the cybersecurity or enterprise software space.",
  "Experience selling to CISOs, CTOs, and other C-suite executives.",
  "Strong understanding of the cybersecurity landscape including cloud security, endpoint protection, and identity management.",
  "Excellent communication and presentation skills in English; Hebrew is a plus.",
  "Experience with defense sector procurement processes and government sales cycles.",
  "Bachelor's degree in business, engineering, or related field; MBA preferred.",
  "Experience in channel sales, partner management, or alliance development.",
  "Familiarity with CRM tools (Salesforce, HubSpot) and sales enablement platforms.",
  "Military background (IDF/IAF) or experience in defense technology is a strong advantage.",
  "Ability to travel within Israel and internationally as needed.",
  "Experience in sales enablement, training program design, or revenue operations.",
  "Understanding of zero trust architecture, IAM, and cloud-native security solutions.",
  "Strong analytical skills and experience with data-driven decision making.",
];

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Full-time",
  "Full-time",
  "Full-time",
  "Contract",
];

const SECTORS = [
  "Cybersecurity",
  "Cybersecurity",
  "Cybersecurity",
  "Defense Technology",
  "Defense Technology",
  "Cloud Security",
  "Identity & Access Management",
  "Endpoint Security",
  "Network Security",
  "GovTech",
];

// ─── Deterministic pseudo-random helpers ────────────────────────

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

function pickN<T>(arr: T[], n: number, rand: () => number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, n);
}

function generateDescription(
  role: (typeof ROLE_TEMPLATES)[number],
  company: string,
  rand: () => number
): string {
  const intro = pick(role.descSnippets, rand);
  const reqs = pickN(REQUIREMENTS_POOL, 3 + Math.floor(rand() * 3), rand);

  return `About the Role\n\n${company} is looking for a ${role.title} to join our growing team. ${intro}\n\nWhat You'll Do:\n- ${pick(role.descSnippets, rand)}\n- Collaborate with cross-functional teams including marketing, product, and customer success.\n- Represent ${company} at industry events, conferences, and partner meetings.\n\nWhat We're Looking For:\n${reqs.map((r) => `- ${r}`).join("\n")}\n\nWhy ${company}?\nJoin a market leader in ${pick(SECTORS, rand).toLowerCase()} and work with cutting-edge technology that protects organizations worldwide. We offer competitive compensation, equity, and a mission-driven culture.`;
}

// ─── Mock provider ─────────────────────────────────────────────

function generateMockJobs(): RawJobFromProvider[] {
  const rand = seededRandom(42);
  const jobs: RawJobFromProvider[] = [];

  // Pick a good spread of companies - focus on well-known ones plus some variety
  const primaryCompanies = [
    "CyberArk",
    "Wiz",
    "Check Point Software",
    "Elbit Systems",
    "SentinelOne",
    "Orca Security",
    "Armis",
    "Varonis",
    "Claroty",
    "Pentera",
    "XM Cyber",
    "Cato Networks",
    "Axonius",
    "Silverfort",
    "Rafael Advanced Defense Systems",
    "Israel Aerospace Industries",
    "Palantir",
    "Anduril",
    "Snyk",
    "Radware",
    "Sygnia",
    "Windward",
    "Torq",
    "Hunters",
  ];

  // Generate 2-3 jobs per primary company + some extras
  for (const company of primaryCompanies) {
    const numJobs = 2 + Math.floor(rand() * 2);
    for (let j = 0; j < numJobs; j++) {
      const role = pick(ROLE_TEMPLATES, rand);
      const location = pick(LOCATIONS, rand);
      const daysAgo = Math.floor(rand() * 30);
      const posted = new Date();
      posted.setDate(posted.getDate() - daysAgo);

      jobs.push({
        source: "mock-linkedin",
        externalId: `mock-${company.toLowerCase().replace(/\s+/g, "-")}-${j}-${role.title.toLowerCase().replace(/\s+/g, "-")}`,
        title: role.title,
        company,
        location,
        url: `https://www.linkedin.com/jobs/view/mock-${jobs.length + 1000}`,
        description: generateDescription(role, company, rand),
        postedAt: posted.toISOString(),
        seniority: role.seniority,
        employmentType: pick(EMPLOYMENT_TYPES, rand),
        sector: pick(SECTORS, rand),
      });
    }
  }

  // Add a handful of secondary companies for broader coverage
  const secondaryCompanies = TARGET_COMPANIES_ISRAEL.filter(
    (c) => !primaryCompanies.includes(c)
  );
  for (const company of pickN(secondaryCompanies, 8, rand)) {
    const role = pick(ROLE_TEMPLATES, rand);
    const location = pick(LOCATIONS, rand);
    const daysAgo = Math.floor(rand() * 30);
    const posted = new Date();
    posted.setDate(posted.getDate() - daysAgo);

    jobs.push({
      source: "mock-linkedin",
      externalId: `mock-${company.toLowerCase().replace(/\s+/g, "-")}-0-${role.title.toLowerCase().replace(/\s+/g, "-")}`,
      title: role.title,
      company,
      location,
      url: `https://www.linkedin.com/jobs/view/mock-${jobs.length + 1000}`,
      description: generateDescription(role, company, rand),
      postedAt: posted.toISOString(),
      seniority: role.seniority,
      employmentType: pick(EMPLOYMENT_TYPES, rand),
      sector: pick(SECTORS, rand),
    });
  }

  return jobs;
}

// Pre-generate the mock jobs once
const MOCK_JOBS = generateMockJobs();

export const mockJobsProvider: JobsProvider = {
  name: "mock-linkedin",

  async fetchJobs(
    queries: string[],
    _location: string
  ): Promise<RawJobFromProvider[]> {
    // Simulate filtering based on queries - return jobs that loosely match
    // In reality we return most jobs since the mock data is already curated
    if (queries.length === 0) return MOCK_JOBS;

    const queryLower = queries.map((q) => q.toLowerCase());
    const matched = MOCK_JOBS.filter((job) => {
      const blob =
        `${job.title} ${job.company} ${job.description} ${job.sector ?? ""}`.toLowerCase();
      // A job matches if any query has at least one word that appears in the job blob
      return queryLower.some((q) => {
        const words = q.split(/\s+/).filter((w) => w.length > 3);
        return words.some((word) => blob.includes(word));
      });
    });

    // Always return at least the full set if nothing matched (mock behavior)
    return matched.length > 0 ? matched : MOCK_JOBS;
  },
};
