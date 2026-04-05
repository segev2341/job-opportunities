// ─── Shared domain types used across all layers ─────────────────

export type HuntRunStatus = "pending" | "running" | "completed" | "failed";

export type ApplicationStatus =
  | "interested"
  | "applied"
  | "interviewing"
  | "offered"
  | "rejected"
  | "withdrawn";

export type RecommendedAction =
  | "apply_now"
  | "ask_referral"
  | "ask_intro"
  | "message_recruiter"
  | "deprioritize";

export type OutreachType =
  | "message_sent"
  | "email_sent"
  | "call"
  | "meeting"
  | "referral_requested"
  | "intro_requested";

export type OutreachChannel = "linkedin" | "email" | "phone" | "in_person";
export type WarmPathType = "referral" | "intro" | "direct_message";
export type FollowUpStatus = "pending" | "done" | "skipped";

// ─── Adapter interfaces ─────────────────────────────────────────

/** A raw job posting returned by a source adapter */
export interface RawJobFromProvider {
  source: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  postedAt?: string;
  seniority?: string;
  employmentType?: string;
  sector?: string;
}

/** Company intel from a provider */
export interface CompanyIntel {
  name: string;
  sector?: string;
  size?: string;
  hq?: string;
  description?: string;
  linkedinUrl?: string;
  website?: string;
  isTarget: boolean;
  hiringSignals?: string[];
}

/** A person from the network provider */
export interface PersonFromProvider {
  name: string;
  title?: string;
  companyName?: string;
  linkedinUrl?: string;
  connectionDegree: number; // 1 or 2
  isConnected: boolean;
  backgroundTags: string[];
  mutualConnectionName?: string;
  mutualConnectionUrl?: string;
}

// ─── Provider interfaces ────────────────────────────────────────

export interface JobsProvider {
  name: string;
  fetchJobs(queries: string[], location: string): Promise<RawJobFromProvider[]>;
}

export interface CompanyProvider {
  getCompanyIntel(companyName: string): Promise<CompanyIntel | null>;
}

export interface NetworkProvider {
  findConnectionsAtCompany(
    companyName: string
  ): Promise<PersonFromProvider[]>;
}

// ─── Scoring ────────────────────────────────────────────────────

export interface ScoreBreakdown {
  overallScore: number;
  roleFitScore: number;
  sectorFitScore: number;
  seniorityScore: number;
  locationScore: number;
  networkScore: number;
  companyScore: number;
  explanation: string;
}

export interface ContactRecommendation {
  personId: string;
  personName: string;
  personTitle?: string;
  personUrl?: string;
  companyName?: string;
  connectionDegree: number;
  pathType: WarmPathType;
  strength: number;
  explanation: string;
  suggestedMessage?: string;
  mutualConnectionName?: string;
  mutualConnectionUrl?: string;
  backgroundTags: string[];
}

export interface RankedJobResult {
  jobId: string;
  rank: number;
  score: number;
  title: string;
  company: string;
  location: string;
  url: string;
  sector?: string;
  seniority?: string;
  postedAt?: string;
  whyRelevant: string;
  whoCanHelp: ContactRecommendation[];
  whatToDoFirst: string;
  action: RecommendedAction;
}

// ─── Orchestrator step tracking ─────────────────────────────────

export interface HuntRunStepUpdate {
  name: string;
  status: string;
  detail?: string;
  error?: string;
}

// ─── User preferences shape ─────────────────────────────────────

export interface UserPreferencesInput {
  targetRoles: string[];
  targetSectors: string[];
  targetLocations: string[];
  experienceYears: number;
  backgroundTags: string[];
  resumeKeywords: string[];
}

// ─── Default configuration ──────────────────────────────────────

export const TARGET_ROLES = [
  "Business Development",
  "Strategic Partnerships",
  "Enterprise Sales",
  "Account Executive",
  "Sales Engineer",
  "Solutions Consultant",
  "Pre-Sales",
  "Sales Enablement",
  "Customer Success",
  "Channel Manager",
  "Alliances Manager",
  "GTM Strategy",
  "Commercial Strategy",
  "Business Operations",
];

export const TARGET_SECTORS = [
  "cybersecurity",
  "defence tech",
  "defense technology",
  "authentication",
  "IAM",
  "identity and access management",
  "digital identity",
  "fraud prevention",
  "cloud security",
  "zero trust",
  "network security",
  "endpoint security",
  "threat intelligence",
  "secure infrastructure",
  "govtech",
  "national security tech",
  "dual-use technology",
];

export const TARGET_COMPANIES_ISRAEL = [
  "Check Point Software", "CyberArk", "Wiz", "Orca Security", "Armis",
  "SentinelOne", "Varonis", "Claroty", "Pentera", "XM Cyber",
  "Cato Networks", "Axonius", "Silverfort", "Sygnia", "IRONSCALES",
  "Perception Point", "Cybereason", "Deep Instinct", "Morphisec",
  "SafeBreach", "Hunters", "Torq", "Aim Security", "Astrix Security",
  "Dazz", "Opus Security", "Oligo Security", "Sweet Security",
  "Wing Security", "Adaptive Shield", "Vulcan Cyber", "Sepio",
  "Radware", "Imperva", "Snyk", "Talon Cyber Security",
  "Elbit Systems", "Rafael Advanced Defense Systems",
  "Israel Aerospace Industries", "mPrest", "Windward",
  "Palantir", "Shield AI", "Anduril",
];

export const DEFAULT_USER_ID = "default-user";
