interface ConnectionChipProps {
  name: string;
  title?: string;
  url?: string;
  degree: number;
  backgroundTags: string[];
  mutualConnectionName?: string;
}

export function ConnectionChip({
  name,
  title,
  url,
  degree,
  backgroundTags,
  mutualConnectionName,
}: ConnectionChipProps) {
  const degreeColors: Record<number, { bg: string; text: string; label: string }> = {
    1: { bg: "bg-green/15", text: "text-green", label: "1st" },
    2: { bg: "bg-yellow/15", text: "text-yellow", label: "2nd" },
  };

  const degreeStyle = degreeColors[degree] ?? {
    bg: "bg-muted/10",
    text: "text-muted",
    label: `${degree}`,
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-bg border border-border">
      {/* Avatar */}
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-card-hover flex items-center justify-center">
        <span className="text-xs font-semibold text-text">
          {name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Name and degree */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text truncate">{name}</span>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${degreeStyle.bg} ${degreeStyle.text}`}
          >
            {degreeStyle.label}
          </span>
        </div>

        {/* Title */}
        {title && (
          <p className="text-xs text-muted mt-0.5 truncate">{title}</p>
        )}

        {/* Tags */}
        {backgroundTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {backgroundTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Mutual connection */}
        {degree === 2 && mutualConnectionName && (
          <p className="text-[11px] text-muted mt-1">
            via{" "}
            <span className="text-text font-medium">{mutualConnectionName}</span>
          </p>
        )}
      </div>
    </div>
  );
}
