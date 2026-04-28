"use client";

import { useState } from "react";
import { runAudit, type AuditResult } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetColumn, setTargetColumn] = useState("selected");
  const [sensitiveColumn, setSensitiveColumn] = useState("gender");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const onAudit = async () => {
    if (!file) {
      setError("Please upload a CSV file first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result: AuditResult = await runAudit(file, targetColumn, sensitiveColumn);
      localStorage.setItem("nishpaksh_audit_result", JSON.stringify(result));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-wrap">
      <section className="card mx-auto max-w-3xl space-y-5">
        <h1 className="text-2xl font-semibold">Upload decision dataset (CSV)</h1>
        <p className="text-sm text-slate-600">
          Expected columns: gender, age, education, experience, city, score, selected.
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-xl border border-slate-300 p-3"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value)}
            placeholder="Target column (e.g. selected)"
            className="rounded-xl border border-slate-300 p-3"
          />
          <input
            value={sensitiveColumn}
            onChange={(e) => setSensitiveColumn(e.target.value)}
            placeholder="Sensitive column (e.g. gender)"
            className="rounded-xl border border-slate-300 p-3"
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          onClick={onAudit}
          disabled={loading}
          className="rounded-xl bg-brand-500 px-5 py-3 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Auditing..." : "Run Fairness Audit"}
        </button>
      </section>
    </main>
  );
}
