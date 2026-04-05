"use client";

import { ActionBadge } from "./action-badge";
import { ConnectionChip } from "./connection-chip";

interface Contact {
  personId: string;
  personName: string;
  personTitle?: string;
  personUrl?: string;
  companyName?: string;
  connectionDegree: number;
  pathType: string;
  strength: number;
  explanation: string;
  suggestedMessage?: string;
  mutualConnectionName?: string;
  mutualConnectionUrl?: string;
  backgroundTags: string[];
}

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

export function JobCard({ rankedJob, onApply }: { rankedJob: RankedJob; onApply: () => void }) {
  const { job, score, whyRelevant, whatToDoFirst, action, rank } = rankedJob;

  let contacts: Contact[] = [];
  try {
    contacts = JSON.parse(rankedJob.whoCanHelp || "[]");
  } catch {}

  const scoreColor = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#6b7280";
  const scoreBg = score >= 70 ? "rgba(34,197,94,0.12)" : score >= 40 ? "rgba(245,158,11,0.12)" : "rgba(107,114,128,0.1)";

  return (
    <div className="bg-[#1a1d27] border border-[#2a2e3b] rounded-xl p-6 hover:border-[#3b82f6] transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-[#6b7280] text-sm font-mono">#{rank}</span>
            <a href={job.url} target="_blank" rel="noopener" className="text-lg font-semibold text-white hover:text-[#3b82f6] transition-colors">
              {job.title}
            </a>
          </div>
          <div className="text-[#3b82f6] font-medium mt-1">{job.company}</div>
          <div className="flex gap-4 mt-2 text-sm text-[#9ca3af]">
            <span>{job.location}</span>
            {job.seniority && <span>{job.seniority}</span>}
            {job.sector && <span>{job.sector}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ backgroundColor: scoreBg, color: scoreColor }}>
            {score}%
          </span>
          <ActionBadge action={action} />
        </div>
      </div>

      {/* Why relevant */}
      <div className="mt-4 text-sm text-[#9ca3af]">
        <span className="text-[#6b7280] font-medium">Why: </span>{whyRelevant}
      </div>

      {/* What to do first */}
      <div className="mt-2 text-sm text-[#e4e4e7] bg-[#222633] rounded-lg px-4 py-3">
        <span className="text-[#f59e0b] font-medium">Next step: </span>{whatToDoFirst}
      </div>

      {/* Connections */}
      {contacts.length > 0 && (
        <div className="mt-4 border-t border-[#2a2e3b] pt-4">
          <div className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-3">Who Can Help ({contacts.length})</div>
          <div className="flex flex-wrap gap-2">
            {contacts.map((c) => (
              <ConnectionChip
                key={c.personId}
                name={c.personName}
                title={c.personTitle}
                url={c.personUrl}
                degree={c.connectionDegree}
                backgroundTags={c.backgroundTags}
                mutualConnectionName={c.mutualConnectionName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-4 flex gap-3">
        <button onClick={onApply} className="px-4 py-2 text-sm bg-[#222633] hover:bg-[#2a2e3b] text-white rounded-lg border border-[#2a2e3b] transition-colors">
          Mark Applied
        </button>
        <a href={`/jobs/${job.id}`} className="px-4 py-2 text-sm bg-[#222633] hover:bg-[#2a2e3b] text-[#3b82f6] rounded-lg border border-[#2a2e3b] transition-colors">
          View Details
        </a>
      </div>
    </div>
  );
}
