import { AlertCircle, CheckCircle2, CircleDashed } from "lucide-react";

import type { MatchCandidate } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const labels: Record<MatchCandidate["confidence"], string> = {
  high: "High confidence",
  possible: "Possible match",
  verify: "Needs verification",
};

export function ConfidenceBadge({
  confidence,
  score,
}: Pick<MatchCandidate, "confidence" | "score">) {
  const Icon =
    confidence === "high"
      ? CheckCircle2
      : confidence === "possible"
        ? CircleDashed
        : AlertCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        confidence === "high" && "bg-emerald-300/12 text-emerald-200",
        confidence === "possible" && "bg-[var(--brass)]/15 text-[#e4bd7d]",
        confidence === "verify" && "bg-white/8 text-white/65",
      )}
      title={`Rule-based evidence score: ${score} out of 100. This is not a probability.`}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {labels[confidence]}
      <span className="sr-only">. Evidence score {score} out of 100.</span>
    </span>
  );
}
