"use client";

import { useState, useEffect, useCallback } from "react";
import { JobCard } from "@/components/job-card";
import { HuntRunStatus } from "@/components/hunt-run-status";

interface RankedJob {
  id: string;
  rank: number;
  score: number;
  whyRelevant: string;
  whoCanHelp: string;
  whatToDoFirst: string;
  action: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    url: string;
    sector?: string;
    seniority?: string;
    postedAt?: string;
    description: string;
  };
}

interface HuntRun {
  id: string;
  status: string;
  jobsFetched: number;
  jobsCanonical: number;
  jobsRanked: number;
  connectionsFound: number;
  queriesGenerated: number;
  startedAt?: string;
  completedAt?: string;
  steps: { id: string; name: string; status: string; detail?: string }[];
  rankedJobs: RankedJob[];
}

export default function Dashboard() {
  const [latestRun, setLatestRun] = useState<HuntRun | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load the latest hunt run
  useEffect(() => {
    fetch("/api/hunt-runs")
      .then((r) => r.json())
      .then((runs) => {
        if (runs.length > 0) {
          const latest = runs[0];
          if (latest.status === "running") {
            setActiveRunId(latest.id);
          } else {
            loadRunDetails(latest.id);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Poll active run
  useEffect(() => {
    if (!activeRunId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/hunt-runs/${activeRunId}`);
      const run = await res.json();
      setLatestRun(run);
      if (run.status === "completed" || run.status === "failed") {
        setActiveRunId(null);
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeRunId]);

  const loadRunDetails = useCallback(async (id: string) => {
    const res = await fetch(`/api/hunt-runs/${id}`);
    const run = await res.json();
    setLatestRun(run);
  }, []);

  const handleRunHunt = async () => {
    setIsLaunching(true);
    try {
      const res = await fetch("/api/hunt-runs", { method: "POST" });
      const data = await res.json();
      setActiveRunId(data.id);
      setLatestRun(null);
    } catch (e) {
      console.error("Failed to start hunt run:", e);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleApply = async (jobId: string) => {
    await fetch(`/api/jobs/${jobId}/apply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  };

  const rankedJobs = latestRun?.rankedJobs ?? [];
  const isRunning = !!activeRunId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-[#9ca3af] mt-1">Your job hunt command center</p>
        </div>
        <button
          onClick={handleRunHunt}
          disabled={isRunning || isLaunching}
          className="px-8 py-4 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-lg transition-all flex items-center gap-3 shadow-lg shadow-blue-500/20"
        >
          {isRunning ? (
            <>
              <span className="animate-spin">&#9881;</span> Running...
            </>
          ) : isLaunching ? (
            <>
              <span className="animate-pulse">&#9881;</span> Launching...
            </>
          ) : (
            <>
              <span className="text-xl">&#x1F680;</span> Run Job Hunt
            </>
          )}
        </button>
      </div>

      {/* Live run progress */}
      {isRunning && activeRunId && (
        <HuntRunStatus
          huntRunId={activeRunId}
          onCompleted={(data) => {
            setLatestRun(data as any);
            setActiveRunId(null);
          }}
        />
      )}

      {/* Stats row */}
      {latestRun?.status === "completed" && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Jobs Found", value: latestRun.jobsRanked, color: "#3b82f6" },
            { label: "Companies", value: [...new Set(rankedJobs.map((j) => j.job.company))].length, color: "#a855f7" },
            { label: "Connections", value: latestRun.connectionsFound, color: "#22c55e" },
            { label: "Queries Used", value: latestRun.queriesGenerated, color: "#f59e0b" },
            { label: "Avg Score", value: rankedJobs.length ? Math.round(rankedJobs.reduce((s, j) => s + j.score, 0) / rankedJobs.length) : 0, color: "#ef4444" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#1a1d27] border border-[#2a2e3b] rounded-xl p-5 text-center">
              <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-[#9ca3af] uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {latestRun?.status === "completed" && rankedJobs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Ranked Opportunities</h2>
          {rankedJobs.map((rj) => (
            <JobCard
              key={rj.id}
              rankedJob={rj}
              onApply={() => handleApply(rj.job.id)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !latestRun && !isRunning && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">&#x1F3AF;</div>
          <h2 className="text-2xl font-semibold text-white mb-2">Ready to find your next role?</h2>
          <p className="text-[#9ca3af] max-w-md mx-auto">
            Click &quot;Run Job Hunt&quot; to automatically discover, score, and rank job opportunities
            in defense, cyber security, and related sectors across Israel.
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-20 text-[#9ca3af]">Loading...</div>
      )}
    </div>
  );
}
