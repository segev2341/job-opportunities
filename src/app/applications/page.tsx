"use client";

import { useState, useEffect } from "react";

const STATUS_COLORS: Record<string, string> = {
  interested: "#3b82f6",
  applied: "#f59e0b",
  interviewing: "#a855f7",
  offered: "#22c55e",
  rejected: "#ef4444",
  withdrawn: "#6b7280",
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApps = () => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => { setApps(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadApps(); }, []);

  const updateStatus = async (appId: string, status: string) => {
    await fetch("/api/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: appId, status }),
    });
    loadApps();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Applications</h1>

      {loading && <div className="text-center py-20 text-[#9ca3af]">Loading...</div>}
      {!loading && apps.length === 0 && (
        <div className="text-center py-20 text-[#9ca3af]">No applications yet. Apply to jobs from the dashboard.</div>
      )}

      <div className="space-y-3">
        {apps.map((app: any) => (
          <div key={app.id} className="bg-[#1a1d27] border border-[#2a2e3b] rounded-xl p-5 flex items-center justify-between">
            <div>
              <a href={`/jobs/${app.job?.id}`} className="text-white font-semibold hover:text-[#3b82f6]">
                {app.job?.title ?? "Unknown"}
              </a>
              <div className="text-sm text-[#3b82f6] mt-1">{app.job?.company}</div>
              <div className="flex gap-4 mt-2 text-xs text-[#6b7280]">
                {app.appliedAt && <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>}
                <span>{app.outreachEvents?.length ?? 0} outreach events</span>
                <span>{app.followUpTasks?.length ?? 0} follow-ups</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={app.status}
                onChange={(e) => updateStatus(app.id, e.target.value)}
                className="bg-[#222633] border border-[#2a2e3b] text-white px-3 py-2 rounded-lg text-sm outline-none"
                style={{ borderColor: STATUS_COLORS[app.status] ?? "#2a2e3b" }}
              >
                {Object.keys(STATUS_COLORS).map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[app.status] ?? "#6b7280" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
