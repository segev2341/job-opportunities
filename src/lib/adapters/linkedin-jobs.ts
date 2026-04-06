import type { JobsProvider, RawJobFromProvider } from "@/lib/types";

/**
 * Real LinkedIn Jobs provider.
 * Uses LinkedIn's public guest API (no login required).
 */

const SEARCH_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search";
const JOB_VIEW_URL = "https://www.linkedin.com/jobs/view/";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// Engineering roles to exclude (but keep sales/solutions engineer)
const ENGINEERING_EXCLUDE = [
  "software engineer", "devops", "backend engineer", "frontend engineer",
  "full stack", "fullstack", "data engineer", "ml engineer", "qa engineer",
  "sre", "platform engineer", "developer", "architect", "r&d manager",
  "algorithm", "data scientist", "firmware", "hardware engineer",
  "embedded engineer", "test engineer", "automation engineer",
  "security engineer", "network engineer", "cloud engineer",
  "systems engineer", "infrastructure engineer", "engineering manager",
];
const BUSINESS_ENGINEER_OK = [
  "sales engineer", "solutions engineer", "customer engineer",
  "field engineer", "se ", "presales engineer", "pre-sales engineer",
];

function isEngineeringRole(title: string): boolean {
  const lower = title.toLowerCase();
  const isBusinessEng = BUSINESS_ENGINEER_OK.some((b) => lower.includes(b));
  if (isBusinessEng) return false;
  return ENGINEERING_EXCLUDE.some((e) => lower.includes(e));
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

    // Skip engineering roles
    if (isEngineeringRole(title)) continue;

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

    // Limit queries to avoid rate limiting - pick the most important ones
    // Strategy: take first 8 role queries + first 6 company queries
    const roleQueries = queries.filter((q) => !q.includes("sales") || q.split(" ").length > 2).slice(0, 8);
    const companyQueries = queries.filter((q) => q.split(" ").length <= 3 && (q.includes("sales") || q.includes("business development"))).slice(0, 6);
    const selectedQueries = [...new Set([...roleQueries, ...companyQueries])].slice(0, 12);

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

    // Enrich top 20 jobs with full descriptions
    console.log(`[LinkedIn] Enriching top 20 jobs with descriptions...`);
    for (const job of allJobs.slice(0, 20)) {
      const desc = await fetchJobDetail(job.externalId);
      if (desc) {
        job.description = desc;
      }
      await delay(1500 + Math.random() * 1500);
    }

    console.log(`[LinkedIn] Done. Total: ${allJobs.length} unique jobs.`);
    return allJobs;
  },
};
