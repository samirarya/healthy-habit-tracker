'use client';

import { Sparkles, RefreshCw } from 'lucide-react';

interface CoachInsight {
  insight: string;
  createdAt: string;
}

interface CoachInsightCardProps {
  dayIndex: number;
  insight?: CoachInsight;
  loading: boolean;
  error: string | null;
  onGenerate: () => void;
}

export default function CoachInsightCard({ dayIndex, insight, loading, error, onGenerate }: CoachInsightCardProps) {
  return (
    <div className="mx-6 mt-4 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-violet-800 dark:text-violet-300 font-semibold text-sm">
          <Sparkles className="w-4 h-4" /> AI Streak Coach
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 bg-white dark:bg-gray-900 border border-violet-200 dark:border-violet-800 px-2.5 py-1 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {insight ? 'Refresh' : 'Get Coach Insight'}
        </button>
      </div>

      <div className="mt-2 text-sm text-violet-900 dark:text-violet-200">
        {loading && !insight && <span className="text-violet-600 dark:text-violet-400">Thinking about Day {dayIndex}…</span>}
        {!loading && error && (
          <span className="text-rose-700 dark:text-rose-400">
            Coach insight isn&apos;t available right now — your check-in was saved.
          </span>
        )}
        {!error && insight && <span>{insight.insight}</span>}
        {!loading && !error && !insight && (
          <span className="text-violet-600 dark:text-violet-400">Get a personalized nudge based on your recent check-ins.</span>
        )}
      </div>
    </div>
  );
}
