"use client";

import { useEffect, useState, useCallback } from "react";

interface HuntRunStep {
  id: string;
  name: string;
  status: string;
  detail?: string;
  error?: string;
}

interface HuntRunData {
  id: string;
  status: string;
  steps: HuntRunStep[];
  jobsFetched: number;
  jobsCanonical: number;
  jobsRanked: number;
  connectionsFound: number;
  errors: string[];
}

interface HuntRunStatusProps {
  huntRunId: string;
  onCompleted?: (data: HuntRunData) => void;
}

const stepIcons: Record<string, string> = {
  completed: "checkmark",
  running: "spinner",
  failed: "error",
  pending: "pending",
};

function StepIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <div className="w-6 h-6 rounded-full bg-green/15 flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
      );
    case "running":
      return (
        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <div className="spinner" />
        </div>
      );
    case "failed":
      return (
        <div className="w-6 h-6 rounded-full bg-red/15 flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-muted" />
        </div>
      );
  }
}

function formatStepName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function HuntRunStatus({ huntRunId, onCompleted }: HuntRunStatusProps) {
  const [data, setData] = useState<HuntRunData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/hunt-runs/${huntRunId}`);
      if (!res.ok) throw new Error("Failed to fetch status");
      const json = await res.json();
      setData(json);

      if (json.status === "completed" || json.status === "failed") {
        onCompleted?.(json);
        return true; // stop polling
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return true; // stop polling on error
    }
  }, [huntRunId, onCompleted]);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout>;

    async function doPoll() {
      if (!mounted) return;
      const done = await poll();
      if (!done && mounted) {
        timer = setTimeout(doPoll, 2000);
      }
    }

    doPoll();

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [poll]);

  if (error) {
    return (
      <div className="card border-red/30">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p className="text-sm text-red">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="spinner" />
          <p className="text-sm text-muted">Connecting to hunt run...</p>
        </div>
      </div>
    );
  }

  const runningStep = data.steps.find((s) => s.status === "running");

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {data.status === "running" ? (
            <>
              <div className="spinner" />
              <div>
                <p className="text-sm font-semibold text-text">Hunt in progress...</p>
                {runningStep && (
                  <p className="text-xs text-muted mt-0.5">
                    {formatStepName(runningStep.name)}
                    {runningStep.detail && ` - ${runningStep.detail}`}
                  </p>
                )}
              </div>
            </>
          ) : data.status === "completed" ? (
            <>
              <div className="w-6 h-6 rounded-full bg-green/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-green">Hunt completed</p>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full bg-red/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-red">Hunt failed</p>
            </>
          )}
        </div>

        {/* Mini stats while running */}
        {data.status !== "pending" && (
          <div className="flex items-center gap-4 text-xs text-muted">
            <span>{data.jobsFetched} fetched</span>
            <span>{data.jobsRanked} ranked</span>
            <span>{data.connectionsFound} connections</span>
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {data.steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-3">
            <StepIcon status={step.status} />
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm ${
                  step.status === "running"
                    ? "text-primary font-medium"
                    : step.status === "completed"
                    ? "text-text"
                    : step.status === "failed"
                    ? "text-red"
                    : "text-muted"
                }`}
              >
                {formatStepName(step.name)}
              </p>
              {step.detail && step.status === "running" && (
                <p className="text-xs text-muted mt-0.5 truncate">{step.detail}</p>
              )}
              {step.error && (
                <p className="text-xs text-red mt-0.5">{step.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Errors */}
      {data.errors.length > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-red/5 border border-red/20">
          <p className="text-xs font-medium text-red mb-1">Errors encountered:</p>
          {data.errors.map((err, i) => (
            <p key={i} className="text-xs text-red/80">{err}</p>
          ))}
        </div>
      )}
    </div>
  );
}
