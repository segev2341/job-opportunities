"use client";

import { useState, useEffect } from "react";
import { JobCard } from "@/components/job-card";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => { setJobs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = jobs.filter((rj: any) => {
    if (!search) return true;
    const text = `${rj.job?.title ?? rj.title} ${rj.job?.company ?? rj.company}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const handleApply = async (jobId: string) => {
    await fetch(`/api/jobs/${jobId}/apply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Jobs</h1>
        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-[#1a1d27] border border-[#2a2e3b] rounded-lg text-white w-72 focus:border-[#3b82f6] outline-none"
        />
      </div>
      {loading && <div className="text-center py-20 text-[#9ca3af]">Loading jobs...</div>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 text-[#9ca3af]">No jobs found. Run a job hunt first.</div>
      )}
      <div className="space-y-4">
        {filtered.map((rj: any) => (
          <JobCard key={rj.id} rankedJob={rj} onApply={() => handleApply(rj.job?.id ?? rj.id)} />
        ))}
      </div>
    </div>
  );
}
