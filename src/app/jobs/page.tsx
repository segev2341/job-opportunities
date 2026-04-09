"use client";

import { useState, useEffect } from "react";
import { JobCard } from "@/components/job-card";

type SortMode = "score" | "location";

/** Reduce "Tel Aviv-Yafo, Tel Aviv District, Israel" → "Tel Aviv-Yafo". */
function simplifyLocation(location: string | undefined | null): string {
  if (!location) return "";
  return location.split(",")[0].trim();
}

/**
 * Normalize API data into the shape JobCard expects.
 * The /api/jobs endpoint returns flat objects when no huntRunId is given,
 * but JobCard expects { rank, score, job: { ... } }.
 */
function normalizeToRankedJob(item: any): any {
  // Already in ranked format (has job sub-object)
  if (item.job && typeof item.job === "object" && item.job.id) {
    return item;
  }
  // Flat format — wrap it
  return {
    id: item.id,
    rank: item.rank ?? 0,
    score: item.score ?? 0,
    whyRelevant: item.whyRelevant ?? "",
    whoCanHelp: item.whoCanHelp ?? "[]",
    whatToDoFirst: item.whatToDoFirst ?? "",
    action: item.action ?? "deprioritize",
    job: {
      id: item.id,
      title: item.title,
      company: item.company,
      location: item.location,
      url: item.url,
      description: item.description ?? "",
      seniority: item.seniority ?? null,
      sector: item.sector ?? null,
      postedAt: item.postedAt ?? null,
    },
  };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("score");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => {
        const normalized = Array.isArray(data) ? data.map(normalizeToRankedJob) : [];
        setJobs(normalized);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const visible = jobs.filter((rj: any) => !hiddenIds.has(rj.job.id));

  const locationOptions = [
    "all",
    ...Array.from(
      new Set(
        visible
          .map((rj: any) => simplifyLocation(rj.job.location))
          .filter(Boolean)
      )
    ).sort() as string[],
  ];

  const afterLocFilter =
    locationFilter === "all"
      ? visible
      : visible.filter(
          (rj: any) => simplifyLocation(rj.job.location) === locationFilter
        );

  const afterSearch = afterLocFilter.filter((rj: any) => {
    if (!search) return true;
    const text = `${rj.job.title} ${rj.job.company}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const sorted =
    sortMode === "location"
      ? [...afterSearch].sort((a: any, b: any) =>
          (a.job.location || "").localeCompare(b.job.location || "")
        )
      : [...afterSearch].sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0));

  const handleApply = async (jobId: string) => {
    await fetch(`/api/jobs/${jobId}/apply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  };

  const handleHide = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/hide`, { method: "POST" });
      if (res.ok) {
        setHiddenIds((prev) => new Set(prev).add(jobId));
      }
    } catch (e) {
      console.error("Failed to hide job:", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-white">Jobs</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-[#1a1d27] border border-[#2a2e3b] rounded-lg text-white w-64 focus:border-[#3b82f6] outline-none"
          />
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-2 bg-[#1a1d27] border border-[#2a2e3b] rounded-lg text-white text-sm focus:border-[#3b82f6] outline-none"
          >
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc === "all" ? "All locations" : loc}
              </option>
            ))}
          </select>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="px-3 py-2 bg-[#1a1d27] border border-[#2a2e3b] rounded-lg text-white text-sm focus:border-[#3b82f6] outline-none"
          >
            <option value="score">Sort by score</option>
            <option value="location">Sort by location</option>
          </select>
        </div>
      </div>
      {loading && <div className="text-center py-20 text-[#9ca3af]">Loading jobs...</div>}
      {!loading && sorted.length === 0 && (
        <div className="text-center py-20 text-[#9ca3af]">No jobs found. Run a job hunt first.</div>
      )}
      <div className="space-y-4">
        {sorted.map((rj: any) => (
          <JobCard
            key={rj.id}
            rankedJob={rj}
            onApply={() => handleApply(rj.job.id)}
            onHide={() => handleHide(rj.job.id)}
          />
        ))}
      </div>
    </div>
  );
}
