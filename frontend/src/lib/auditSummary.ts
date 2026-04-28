import type { AuditResult } from "@/lib/api";

export type AuditExecutiveSummary = {
  biasExists: string;
  whyItMatters: string;
  howToFixIt: string;
};

export type FairnessScoreInfo = {
  score: number;
  level: "Strong" | "Moderate" | "Needs Attention";
  explanation: string;
};

export type BiasRiskLevel = {
  level: "Low" | "Medium" | "High";
  explanation: string;
};

export function generateAuditExecutiveSummary(result: AuditResult): AuditExecutiveSummary {
  const ratio = result.disparate_impact_ratio;
  const rates = Object.values(result.selection_rate_by_gender);
  const spread = rates.length ? Math.max(...rates) - Math.min(...rates) : 0;

  const biasExists =
    ratio < 0.8
      ? `Disparate impact ratio is ${ratio.toFixed(3)}, below the 0.80 fairness threshold.`
      : spread > 0.15
        ? `Selection-rate spread across gender groups is ${(spread * 100).toFixed(1)}%, indicating uneven outcomes.`
        : `No severe bias signal is detected in current metrics, though small group differences remain.`;

  const whyItMatters =
    ratio < 0.8
      ? "Elevated compliance and reputational risk from potentially discriminatory decisions."
      : spread > 0.15
        ? "Inconsistent decisions across gender groups can reduce trust and increase governance scrutiny."
        : "Current risk is lower, but fairness drift can emerge as data and model behavior evolve.";

  const howToFixIt =
    result.recommendations?.[0] ??
    "Calibrate thresholds, rebalance training samples, and validate fairness before each release.";

  return {
    biasExists,
    whyItMatters,
    howToFixIt
  };
}

export function computeFairnessScore(result: AuditResult): FairnessScoreInfo {
  const ratio = result.disparate_impact_ratio;
  const rates = Object.values(result.selection_rate_by_gender);
  const spread = rates.length ? Math.max(...rates) - Math.min(...rates) : 0;

  const ratioPenalty = ratio >= 0.8 ? 0 : Math.min(35, (0.8 - ratio) * 120);
  const spreadPenalty = Math.min(30, spread * 120);
  const accuracyPenalty = Math.max(0, 0.7 - result.model_accuracy) * 60;

  const score = Math.max(0, Math.min(100, Math.round(100 - ratioPenalty - spreadPenalty - accuracyPenalty)));

  if (score >= 80) {
    return {
      score,
      level: "Strong",
      explanation: "Outcomes are reasonably balanced across groups, with lower immediate fairness risk."
    };
  }

  if (score >= 60) {
    return {
      score,
      level: "Moderate",
      explanation: "Some disparity indicators are present and should be addressed before wider rollout."
    };
  }

  return {
    score,
    level: "Needs Attention",
    explanation: "Fairness indicators show meaningful risk and require remediation before production decisions."
  };
}

export function getTopRisks(result: AuditResult): string[] {
  const ratio = result.disparate_impact_ratio;
  const rates = Object.values(result.selection_rate_by_gender);
  const spread = rates.length ? Math.max(...rates) - Math.min(...rates) : 0;
  const risks: string[] = [];

  if (ratio < 0.8) {
    risks.push(`Disparate impact ratio is ${ratio.toFixed(3)}, below the commonly used 0.80 threshold.`);
  }
  if (spread > 0.15) {
    risks.push(`Selection-rate spread is ${(spread * 100).toFixed(1)}%, indicating inconsistent group outcomes.`);
  }
  if (result.model_accuracy < 0.7) {
    risks.push(
      `Model accuracy is ${(result.model_accuracy * 100).toFixed(1)}%, increasing operational risk from unstable decisions.`
    );
  }

  if (!risks.length) {
    risks.push("No critical fairness red flags detected; continue monitoring for drift and subgroup instability.");
  }

  return risks.slice(0, 3);
}

export function getBiasRiskLevel(result: AuditResult): BiasRiskLevel {
  const fairness = computeFairnessScore(result);
  const ratio = result.disparate_impact_ratio;

  if (fairness.score < 60 || ratio < 0.7) {
    return {
      level: "High",
      explanation: "Material disparity indicators suggest elevated legal, reputational, and operational risk."
    };
  }

  if (fairness.score < 80 || ratio < 0.85) {
    return {
      level: "Medium",
      explanation: "Noticeable disparity requires mitigation before scaling model use."
    };
  }

  return {
    level: "Low",
    explanation: "No major fairness warning is present, with continued monitoring still recommended."
  };
}

export function getRecommendedActions(result: AuditResult): string[] {
  if (result.recommendations?.length) {
    return result.recommendations.slice(0, 4);
  }
  return [
    "Review decision thresholds to reduce group-level disparity.",
    "Rebalance training data for underrepresented cohorts.",
    "Add fairness monitoring as a release gate for each model update."
  ];
}
