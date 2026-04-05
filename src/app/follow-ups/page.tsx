"use client";

import { useState, useEffect } from "react";

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  const load = () => {
    fetch("/api/follow-ups")
      .then((r) => r.json())
      .then((data) => { setFollowUps(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markDone = async (id: string) => {
    await fetch("/api/follow-ups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const createFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;
    await fetch("/api/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, dueDate }),
    });
    setTitle("");
    setDueDate("");
    load();
  };

  const isOverdue = (d: string) => new Date(d) < new Date();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Follow-Ups</h1>

      {/* Quick add */}
      <form onSubmit={createFollowUp} className="flex gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New follow-up task..."
          className="flex-1 px-4 py-2 bg-[#1a1d27] border border-[#2a2e3b] rounded-lg text-white outline-none focus:border-[#3b82f6]"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="px-4 py-2 bg-[#1a1d27] border border-[#2a2e3b] rounded-lg text-white outline-none focus:border-[#3b82f6]"
        />
        <button type="submit" className="px-6 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg font-medium transition-colors">
          Add
        </button>
      </form>

      {loading && <div className="text-center py-20 text-[#9ca3af]">Loading...</div>}
      {!loading && followUps.length === 0 && (
        <div className="text-center py-20 text-[#9ca3af]">No follow-ups yet.</div>
      )}

      <div className="space-y-3">
        {followUps.map((fu: any) => {
          const overdue = fu.status === "pending" && isOverdue(fu.dueDate);
          return (
            <div
              key={fu.id}
              className={`bg-[#1a1d27] border rounded-xl p-5 flex items-center justify-between ${
                fu.status === "done" ? "border-[#2a2e3b] opacity-50" : overdue ? "border-[#ef4444]" : "border-[#2a2e3b]"
              }`}
            >
              <div>
                <div className={`font-semibold ${fu.status === "done" ? "line-through text-[#6b7280]" : "text-white"}`}>
                  {fu.title}
                </div>
                {fu.description && <div className="text-sm text-[#9ca3af] mt-1">{fu.description}</div>}
                <div className="flex gap-4 mt-2 text-xs">
                  <span className={overdue ? "text-[#ef4444] font-medium" : "text-[#6b7280]"}>
                    Due: {new Date(fu.dueDate).toLocaleDateString()}
                    {overdue && " (OVERDUE)"}
                  </span>
                  {fu.application?.job && (
                    <span className="text-[#3b82f6]">{fu.application.job.title} at {fu.application.job.company}</span>
                  )}
                </div>
              </div>
              {fu.status === "pending" && (
                <button
                  onClick={() => markDone(fu.id)}
                  className="px-4 py-2 text-sm bg-[#222633] hover:bg-[#22c55e] hover:text-white text-[#22c55e] rounded-lg border border-[#2a2e3b] transition-colors"
                >
                  Mark Done
                </button>
              )}
              {fu.status === "done" && (
                <span className="text-[#22c55e] text-sm">Done</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
