import type { AuditResult } from "@/lib/api";
import { generateAuditExecutiveSummary } from "@/lib/auditSummary";

type Props = {
  result: AuditResult;
};

export function AuditSummaryCard({ result }: Props) {
  const summary = generateAuditExecutiveSummary(result);

  return (
    <section className="card border-slate-200/90 bg-gradient-to-br from-white to-slate-50">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">AI Executive Summary</h2>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium tracking-wide text-slate-500">
          Concise
        </span>
      </div>
      <div className="mt-4 space-y-3 text-sm text-slate-700">
        <p>
          <span className="font-semibold text-slate-900">What bias exists:</span> {summary.biasExists}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Why it matters:</span> {summary.whyItMatters}
        </p>
        <p>
          <span className="font-semibold text-slate-900">How to fix it:</span> {summary.howToFixIt}
        </p>
      </div>
    </section>
  );
}
