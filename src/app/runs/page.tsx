"use client";

import { useState, useEffect } from "react";

export default function RunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hunt-runs")
      .then((r) => r.json())
      .then((data) => { setRuns(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    completed: "#22c55e",
    running: "#f59e0b",
    failed: "#ef4444",
    pending: "#6b7280",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Run History</h1>

      {loading && <div className="text-center py-20 text-[#9ca3af]">Loading...</div>}
      {!loading && runs.length === 0 && (
        <div className="text-center py-20 text-[#9ca3af]">No hunt runs yet. Start one from the Dashboard.</div>
      )}

      <div className="space-y-3">
        {runs.map((run: any) => {
          const duration = run.startedAt && run.completedAt
            ? Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
            : null;

          return (
            <a
              key={run.id}
              href={`/?run=${run.id}`}
              className="block bg-[#1a1d27] border border-[#2a2e3b] rounded-xl p-5 hover:border-[#3b82f6] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[run.status] ?? "#6b7280" }} />
                  <div>
                    <div className="text-white font-semibold">
                      Hunt Run - {new Date(run.createdAt).toLocaleDateString()} {new Date(run.createdAt).toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-[#9ca3af] mt-1">
                      {run.jobsRanked} jobs ranked &middot; {run.connectionsFound} connections &middot; {run.queriesGenerated} queries
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium" style={{ color: statusColors[run.status] }}>
                    {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                  </span>
                  {duration && <div className="text-xs text-[#6b7280] mt-1">{duration}s</div>}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
