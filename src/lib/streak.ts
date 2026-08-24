import type { DayData } from '@/lib/habits';

// Consecutive completed days from Day 1 upwards — not calendar-based,
// stops counting at the first incomplete day regardless of which day is active.
export function computeCurrentStreak(days: Record<number, DayData>, totalDays = 21): number {
  let streak = 0;
  for (let i = 1; i <= totalDays; i++) {
    if (days[i]?.completed) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
