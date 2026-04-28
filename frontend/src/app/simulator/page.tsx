"use client";

import { useState } from "react";
import { simulate } from "@/lib/api";

type Result = { prediction: number; probability: number };

export default function SimulatorPage() {
  const [payload, setPayload] = useState('{"age": 30, "gender": "female", "score": 0.75}');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSimulate = async () => {
    try {
      setLoading(true);
      setError("");
      const parsed = JSON.parse(payload) as Record<string, string | number>;
      const response = await simulate(parsed);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-wrap">
      <section className="card mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold">What-If Simulator</h1>
        <p className="text-sm text-slate-600">
          Modify profile fields and inspect model outcome probabilities for fairness-sensitive what-if testing.
        </p>
        <textarea
          className="h-48 w-full rounded-xl border border-slate-300 p-3 font-mono text-sm"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
        />
        <button
          onClick={onSimulate}
          disabled={loading}
          className="rounded-xl bg-brand-500 px-5 py-3 font-medium text-white disabled:opacity-60"
        >
          {loading ? "Running..." : "Run Simulation"}
        </button>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {result && (
          <div className="rounded-xl bg-slate-100 p-4 text-sm">
            <p>
              Predicted class: <span className="font-medium">{result.prediction}</span>
            </p>
            <p>
              Positive probability: <span className="font-medium">{(result.probability * 100).toFixed(2)}%</span>
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
