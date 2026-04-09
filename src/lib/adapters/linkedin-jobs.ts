import type { JobsProvider, RawJobFromProvider } from "@/lib/types";

/**
 * Real LinkedIn Jobs provider.
 * Uses LinkedIn's public guest API (no login required).
 */

const SEARCH_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search";
const JOB_VIEW_URL = "https://www.linkedin.com/jobs/view/";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// HARD engineering blocks — ALWAYS exclude, even if other words appear.
// e.g. "Full Stack Sales Engineer" → still excluded because "full stack" is hard-blocked.
const HARD_ENGINEERING_EXCLUDE = [
  "full stack", "fullstack", "full-stack",
  "software engineer", "software developer", "software engineering",
  "backend", "back-end", "back end",
  "frontend", "front-end", "front end",
  "devops", "dev ops",
  "data engineer", "ml engineer", "machine learning engineer",
  "data scientist",
  "developer", "programmer",
  "firmware", "embedded",
  "algorithm",
  "qa engineer", "qa automation", "test engineer", "automation engineer",
  "sre ", "site reliability",
  "security engineer", "network engineer", "cloud engineer",
  "systems engineer", "infrastructure engineer",
  "hardware engineer", "electronics engineer", "rf engineer",
  "architect",
  "r&d", "research and development",
];

// SOFT business-engineer whitelist — these are sales/CS-type roles
// (only applied AFTER hard block check)
const BUSINESS_ENGINEER_OK = [
  "sales engineer", "solutions engineer", "customer engineer",
  "presales engineer", "pre-sales engineer", "pre sales engineer",
  "field engineer",
];

// Seniority exclusions — user only wants junior/individual-contributor roles
const SENIOR_EXCLUDE = [
  "senior", "sr.", "sr ",
  "head of", "head,", "head -",
  "lead ", " lead", "team lead", "tech lead",
  "principal",
  "director", " dir ",
  "vp ", " vp", "vice president", "v.p.",
  "chief", " cxo", "cto", "ceo", "cfo", "coo", "cro", "cmo", "ciso",
  "staff",
  "group manager", "country manager", "regional manager",
  " iii", " iv",
  "expert",
];

function isSeniorRole(title: string): boolean {
  const lower = ` ${title.toLowerCase()} `;
  return SENIOR_EXCLUDE.some((s) => lower.includes(s));
}

function isEngineeringRole(title: string): boolean {
  const lower = title.toLowerCase();

  // 1. Hard block: if ANY hard engineering term is present, exclude regardless
  if (HARD_ENGINEERING_EXCLUDE.some((e) => lower.includes(e))) {
    return true;
  }

  // 2. Business engineer whitelist: sales/solutions/CS engineers are OK
  if (BUSINESS_ENGINEER_OK.some((b) => lower.includes(b))) {
    return false;
  }

  // 3. Generic "engineer" in title without business-eng context → exclude
  if (/\bengineer\b/.test(lower)) {
    return true;
  }

  return false;
}

// Role titles to always exclude regardless of seniority
const ALWAYS_EXCLUDE_TITLES = [
  "talent acquisition",
  "talent acquisition partner",
  "talent acquisition specialist",
  "talent acquisition manager",
  "ta partner",
];

function isExcludedTitle(title: string): boolean {
  const lower = title.toLowerCase();
  return ALWAYS_EXCLUDE_TITLES.some((t) => lower.includes(t));
}

function shouldSkipJob(title: string): boolean {
  return isExcludedTitle(title) || isEngineeringRole(title) || isSeniorRole(title);
}

// ─── Description-based filters ─────────────────────────────────────
// Segev's CV: BA in Management & Philosophy (not a STEM degree).
// Any job that REQUIRES a technical bachelor's is disqualifying.

/**
 * Detects if the job description mandates a technical/engineering degree
 * (B.Sc in engineering, CS, optics, electro-optical, physics, etc.).
 */
function requiresTechnicalDegree(description: string): boolean {
  if (!description) return false;
  const d = description.toLowerCase();

  // Pattern: "B.Sc / BSc / Bachelor of Science / Bachelor's / degree in <tech field>"
  // The "in" connector is optional to catch "CS degree", "engineering degree" etc.
  const degreeTriggers = [
    "b.sc", "bsc ", "b.s. ", "b.sc.",
    "bachelor of science",
    "bachelor's degree",
    "bachelors degree",
    "bachelor degree",
    "academic degree",
    "university degree",
  ];
  const hasDegreeWord = degreeTriggers.some((t) => d.includes(t));

  const techFieldPhrases = [
    "in engineering",
    "in computer science",
    "in cs ",
    "in software engineering",
    "in electrical engineering",
    "in electronics",
    "in optics",
    "in optical",
    "in electro-optical",
    "in electro optical",
    "in physics",
    "in mathematics",
    "in mechanical engineering",
    "in industrial engineering",
    "in information systems",
    "engineering degree",
    "cs degree",
    "computer science degree",
    "technical degree",
    "stem degree",
  ];
  const hasTechField = techFieldPhrases.some((t) => d.includes(t));

  // Either explicit "B.Sc in engineering" style, OR standalone technical-field phrase
  if (hasDegreeWord && hasTechField) return true;
  if (hasTechField) return true;

  // Also catch short-form mentions like "B.Sc. in Electrical/Computer/Software Engineering"
  if (/b\.?\s?sc\.?[^.]{0,40}(engineer|computer science|optical|optics|physics|electronics)/i.test(description)) {
    return true;
  }
  if (/bachelor[^.]{0,40}(engineer|computer science|optical|optics|physics|electronics)/i.test(description)) {
    return true;
  }

  return false;
}

/**
 * Detects if the description requires 3+ years of experience.
 * The user wants junior roles only.
 */
function requiresTooMuchExperience(description: string): boolean {
  if (!description) return false;
  const d = description.toLowerCase();

  // Patterns like "3+ years", "5+ years", "minimum 3 years", "at least 4 years"
  // Also: "3-5 years", "3 to 5 years"
  const patterns: RegExp[] = [
    /\b([3-9]|[1-9]\d)\s*\+\s*years?\b/i, // "3+ years"
    /\bminimum\s+(?:of\s+)?([3-9]|[1-9]\d)\s+years?\b/i, // "minimum 3 years"
    /\bat\s+least\s+([3-9]|[1-9]\d)\s+years?\b/i, // "at least 3 years"
    /\b([3-9]|[1-9]\d)\s*(?:-|to)\s*\d+\s+years?\b/i, // "3-5 years" or "3 to 5 years"
    /\b([3-9]|[1-9]\d)\s+or\s+more\s+years?\b/i, // "3 or more years"
    /\bover\s+([3-9]|[1-9]\d)\s+years?\b/i, // "over 3 years"
  ];

  for (const re of patterns) {
    const m = description.match(re);
    if (m) {
      const yrs = parseInt(m[1], 10);
      if (!isNaN(yrs) && yrs >= 3) return true;
    }
  }
  return false;
}

/**
 * Post-enrichment filter: decide whether a job (with full description)
 * should be dropped based on disqualifying requirements.
 */
function shouldDropByDescription(description: string): { drop: boolean; reason?: string } {
  if (requiresTechnicalDegree(description)) {
    return { drop: true, reason: "requires a technical/engineering degree" };
  }
  if (requiresTooMuchExperience(description)) {
    return { drop: true, reason: "requires 3+ years of experience" };
  }
  return { drop: false };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse HTML from LinkedIn's guest jobs API.
 * Uses regex instead of a DOM parser to avoid extra dependencies.
 */
function parseJobCards(html: string, keyword: string): RawJobFromProvider[] {
  const jobs: RawJobFromProvider[] = [];

  // Extract job IDs from data-entity-urn attributes
  const urnPattern = /data-entity-urn="urn:li:jobPosting:(\d+)"/g;
  const jobIds: string[] = [];
  let urnMatch;
  while ((urnMatch = urnPattern.exec(html)) !== null) {
    jobIds.push(urnMatch[1]);
  }

  // Extract titles
  const titlePattern = /<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/h3>/g;
  const titles: string[] = [];
  let titleMatch;
  while ((titleMatch = titlePattern.exec(html)) !== null) {
    titles.push(titleMatch[1].trim());
  }

  // Extract companies
  const companyPattern = /<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>\s*[\s\S]*?>([\s\S]*?)<\/a>/g;
  const companies: string[] = [];
  let companyMatch;
  while ((companyMatch = companyPattern.exec(html)) !== null) {
    companies.push(companyMatch[1].trim().replace(/<[^>]*>/g, "").trim());
  }

  // Fallback company extraction if the above misses
  if (companies.length === 0) {
    const companyFallback = /<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/g;
    let cfMatch;
    while ((cfMatch = companyFallback.exec(html)) !== null) {
      companies.push(cfMatch[1].replace(/<[^>]*>/g, "").trim());
    }
  }

  // Extract locations
  const locationPattern = /<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/span>/g;
  const locations: string[] = [];
  let locMatch;
  while ((locMatch = locationPattern.exec(html)) !== null) {
    locations.push(locMatch[1].trim());
  }

  // Extract dates
  const datePattern = /<time[^>]*datetime="([^"]*)"[^>]*>/g;
  const dates: string[] = [];
  let dateMatch;
  while ((dateMatch = datePattern.exec(html)) !== null) {
    dates.push(dateMatch[1]);
  }

  // Build job objects
  const count = Math.min(jobIds.length, titles.length);
  for (let i = 0; i < count; i++) {
    const title = titles[i];
    const company = companies[i] ?? "Unknown";
    const location = locations[i] ?? "";
    const postedAt = dates[i] ?? undefined;
    const jobId = jobIds[i];

    // Skip engineering roles and senior positions (user wants juniors only)
    if (shouldSkipJob(title)) continue;

    jobs.push({
      source: "linkedin",
      externalId: jobId,
      title,
      company,
      location,
      url: `${JOB_VIEW_URL}${jobId}`,
      description: `${title} at ${company}. Location: ${location}. Found via search: "${keyword}".`,
      postedAt,
      seniority: undefined,
      employmentType: undefined,
      sector: undefined,
    });
  }

  return jobs;
}

async function searchLinkedIn(
  keyword: string,
  location: string,
  geoId: string,
  maxResults: number = 50
): Promise<RawJobFromProvider[]> {
  const allJobs: RawJobFromProvider[] = [];

  for (let start = 0; start < maxResults; start += 25) {
    const params = new URLSearchParams({
      keywords: keyword,
      location,
      geoId,
      start: String(start),
      f_TPR: "r2592000", // past month
    });

    try {
      const res = await fetch(`${SEARCH_URL}?${params}`, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (!res.ok) {
        console.warn(`LinkedIn search returned ${res.status} for "${keyword}" at offset ${start}`);
        break;
      }

      const html = await res.text();
      const pageJobs = parseJobCards(html, keyword);

      if (pageJobs.length === 0) break;

      allJobs.push(...pageJobs);

      // Rate limiting - be respectful
      await delay(2000 + Math.random() * 2000);
    } catch (e) {
      console.error(`Error searching LinkedIn for "${keyword}":`, e);
      break;
    }
  }

  return allJobs;
}

/**
 * Fetch job detail page to get the full description.
 */
async function fetchJobDetail(jobId: string): Promise<string> {
  const url = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) return "";

    const html = await res.text();

    // Extract description from show-more-less-html__markup
    const descMatch = html.match(
      /<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/
    );

    if (descMatch) {
      return descMatch[1]
        .replace(/<[^>]*>/g, " ")  // strip HTML tags
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
  } catch (e) {
    console.error(`Error fetching job detail ${jobId}:`, e);
  }

  return "";
}

export const linkedinJobsProvider: JobsProvider = {
  name: "linkedin",

  async fetchJobs(queries: string[], location: string): Promise<RawJobFromProvider[]> {
    const seenIds = new Set<string>();
    const allJobs: RawJobFromProvider[] = [];
    const geoId = "101620260"; // Israel

    // Limit queries to avoid rate limiting - pick the most important ones.
    // Keep a mix of: BD/sales role queries, company+role queries, and HR queries.
    const isHrQuery = (q: string) =>
      /\b(hr|talent acquisition|recruiter|people operations)\b/i.test(q);
    const isCompanyQuery = (q: string) =>
      q.split(" ").length <= 3 &&
      (q.toLowerCase().includes("sales") || q.toLowerCase().includes("business development"));

    const hrQueries = queries.filter(isHrQuery).slice(0, 6);
    const companyQueries = queries.filter(isCompanyQuery).slice(0, 5);
    const roleQueries = queries
      .filter((q) => !isHrQuery(q) && !isCompanyQuery(q))
      .slice(0, 6);

    const selectedQueries = [
      ...new Set([...roleQueries, ...companyQueries, ...hrQueries]),
    ].slice(0, 16);

    console.log(`[LinkedIn] Searching ${selectedQueries.length} queries...`);

    for (const query of selectedQueries) {
      console.log(`[LinkedIn] Searching: "${query}"`);
      const jobs = await searchLinkedIn(query, location, geoId, 50);

      for (const job of jobs) {
        if (!seenIds.has(job.externalId)) {
          seenIds.add(job.externalId);
          allJobs.push(job);
        }
      }

      console.log(`[LinkedIn]   Found ${jobs.length} jobs (${allJobs.length} total unique)`);
    }

    // Enrich more jobs with full descriptions so the description filter
    // has real data to work with. Cap at 50 to balance thoroughness vs time.
    const MAX_ENRICH = 50;
    const toEnrich = allJobs.slice(0, MAX_ENRICH);
    console.log(`[LinkedIn] Enriching ${toEnrich.length} jobs with full descriptions...`);

    const enrichedJobs: RawJobFromProvider[] = [];
    let droppedDegree = 0;
    let droppedExperience = 0;

    for (const job of toEnrich) {
      const desc = await fetchJobDetail(job.externalId);
      if (desc) {
        job.description = desc;

        // Apply description-based filters
        const { drop, reason } = shouldDropByDescription(desc);
        if (drop) {
          if (reason?.includes("degree")) droppedDegree++;
          else if (reason?.includes("experience")) droppedExperience++;
          console.log(`[LinkedIn]   DROP "${job.title}" @ ${job.company}: ${reason}`);
          continue;
        }
      }
      enrichedJobs.push(job);
      await delay(1500 + Math.random() * 1500);
    }

    // Add the un-enriched tail (jobs past MAX_ENRICH) as-is
    const tail = allJobs.slice(MAX_ENRICH);
    const finalJobs = [...enrichedJobs, ...tail];

    console.log(
      `[LinkedIn] Done. Kept ${finalJobs.length} jobs ` +
      `(dropped ${droppedDegree} for technical degree requirements, ` +
      `${droppedExperience} for 3+ years experience).`
    );
    return finalJobs;
  },
};
