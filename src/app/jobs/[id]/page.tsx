"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ActionBadge } from "@/components/action-badge";
import { ConnectionChip } from "@/components/connection-chip";

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((data) => { setJob(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20 text-[#9ca3af]">Loading...</div>;
  if (!job) return <div className="text-center py-20 text-[#9ca3af]">Job not found.</div>;

  const scores = job.scores?.[0];
  const warmPaths = job.warmPaths ?? [];
  const outreachDrafts = job.outreachDrafts ?? [];

  const handleApply = async () => {
    await fetch(`/api/jobs/${id}/apply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    alert("Marked as applied!");
  };

  const scoreItems = scores ? [
    { label: "Role Fit", value: scores.roleFitScore, max: 25 },
    { label: "Sector Fit", value: scores.sectorFitScore, max: 25 },
    { label: "Seniority", value: scores.seniorityScore, max: 15 },
    { label: "Location", value: scores.locationScore, max: 15 },
    { label: "Network", value: scores.networkScore, max: 10 },
    { label: "Company", value: scores.companyScore, max: 10 },
  ] : [];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <a href="/jobs" className="text-[#3b82f6] text-sm hover:underline">&larr; Back to Jobs</a>
        <h1 className="text-3xl font-bold text-white mt-2">{job.title}</h1>
        <div className="text-[#3b82f6] text-lg font-medium mt-1">{job.company}</div>
        <div className="flex gap-4 mt-2 text-sm text-[#9ca3af]">
          <span>{job.location}</span>
          {job.seniority && <span>{job.seniority}</span>}
          {job.sector && <span>{job.sector}</span>}
        </div>
        <div className="mt-4 flex gap-3">
          <a href={job.url} target="_blank" rel="noopener" className="px-6 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg font-medium transition-colors">
            View on LinkedIn
          </a>
          <button onClick={handleApply} className="px-6 py-2 bg-[#222633] hover:bg-[#2a2e3b] text-white rounded-lg border border-[#2a2e3b] transition-colors">
            Mark Applied
          </button>
        </div>
      </div>

      {/* Score breakdown */}
      {scores && (
        <div className="bg-[#1a1d27] border border-[#2a2e3b] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Score Breakdown</h2>
          <div className="text-3xl font-bold mb-4" style={{ color: scores.overallScore >= 70 ? "#22c55e" : scores.overallScore >= 40 ? "#f59e0b" : "#6b7280" }}>
            {scores.overallScore}/100
          </div>
          <p className="text-sm text-[#9ca3af] mb-4">{scores.explanation}</p>
          <div className="space-y-3">
            {scoreItems.map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <span className="text-sm text-[#9ca3af] w-28">{item.label}</span>
                <div className="flex-1 h-2 bg-[#222633] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#3b82f6] transition-all"
                    style={{ width: `${(item.value / item.max) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-white w-12 text-right">{item.value}/{item.max}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warm paths */}
      {warmPaths.length > 0 && (
        <div className="bg-[#1a1d27] border border-[#2a2e3b] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Who Can Help ({warmPaths.length})</h2>
          <div className="space-y-4">
            {warmPaths.map((wp: any) => (
              <div key={wp.id} className="bg-[#222633] rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <ConnectionChip
                    name={wp.person?.name ?? "Unknown"}
                    title={wp.person?.title}
                    url={wp.person?.linkedinUrl}
                    degree={wp.person?.connectionDegree ?? 0}
                    backgroundTags={(() => { try { const t = wp.person?.backgroundTags; return Array.isArray(t) ? t : JSON.parse(t ?? "[]"); } catch { return []; } })()}
                    mutualConnectionName={wp.person?.mutualConnection?.name}
                  />
                  <ActionBadge action={wp.pathType} />
                </div>
                <p className="text-sm text-[#9ca3af] mt-2">{wp.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outreach drafts */}
      {outreachDrafts.length > 0 && (
        <div className="bg-[#1a1d27] border border-[#2a2e3b] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Ready-to-Send Messages</h2>
          <div className="space-y-4">
            {outreachDrafts.map((draft: any) => (
              <div key={draft.id} className="bg-[#222633] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">To: {draft.person?.name ?? "Unknown"}</span>
                  <span className="text-xs text-[#9ca3af] px-2 py-1 bg-[#1a1d27] rounded">{draft.channel}</span>
                </div>
                {draft.subject && <div className="text-sm text-[#9ca3af] mb-2">Subject: {draft.subject}</div>}
                <pre className="text-sm text-[#e4e4e7] whitespace-pre-wrap font-sans">{draft.body}</pre>
                <button
                  onClick={() => navigator.clipboard.writeText(draft.body)}
                  className="mt-3 px-3 py-1 text-xs bg-[#1a1d27] hover:bg-[#2a2e3b] text-[#3b82f6] rounded border border-[#2a2e3b] transition-colors"
                >
                  Copy Message
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-[#1a1d27] border border-[#2a2e3b] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Job Description</h2>
        <div className="text-sm text-[#9ca3af] whitespace-pre-wrap leading-relaxed">{job.description}</div>
      </div>
    </div>
  );
}
