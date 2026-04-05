import type { RecommendedAction } from "@/lib/types";

const actionConfig: Record<
  RecommendedAction,
  { label: string; bgClass: string; textClass: string }
> = {
  apply_now: {
    label: "Apply Now",
    bgClass: "bg-green/15",
    textClass: "text-green",
  },
  ask_referral: {
    label: "Ask for Referral",
    bgClass: "bg-primary/15",
    textClass: "text-primary",
  },
  ask_intro: {
    label: "Request Intro",
    bgClass: "bg-yellow/15",
    textClass: "text-yellow",
  },
  message_recruiter: {
    label: "Message Recruiter",
    bgClass: "bg-purple/15",
    textClass: "text-purple",
  },
  deprioritize: {
    label: "Low Priority",
    bgClass: "bg-muted/10",
    textClass: "text-muted",
  },
};

interface ActionBadgeProps {
  action: RecommendedAction | string;
  size?: "sm" | "md";
}

export function ActionBadge({ action, size = "md" }: ActionBadgeProps) {
  const config = actionConfig[action as RecommendedAction] ?? {
    label: action,
    bgClass: "bg-muted/10",
    textClass: "text-muted",
  };

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bgClass} ${config.textClass} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
}
