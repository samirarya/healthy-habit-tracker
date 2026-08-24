'use client';

import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Circle,
  Flame,
  RotateCcw,
  Calendar,
  Award,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Heart,
  AlertCircle,
  Check
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { HABITS, CATEGORIES, type DayData, type ChallengeState } from '@/lib/habits';
import { computeCurrentStreak } from '@/lib/streak';
import CoachInsightCard from '@/components/CoachInsightCard';

const CATEGORY_ICONS = {
  'Morning': Sunrise,
  'Breakfast & Midday': Coffee,
  'Afternoon': Sun,
  'Evening': Sunset,
  'Night': Moon,
};

interface CoachInsight {
  insight: string;
  createdAt: string;
}

interface HabitTrackerProps {
  userId: string;
  initialChallenge: ChallengeState;
  initialInsights: Record<number, CoachInsight>;
}

export default function HabitTracker({ userId, initialChallenge, initialInsights }: HabitTrackerProps) {
  const [challenge, setChallenge] = useState<ChallengeState>(initialChallenge);

  const [activeTabDay, setActiveTabDay] = useState<number>(1);
  const [showResetModal, setShowResetModal] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);

  const [insights, setInsights] = useState<Record<number, CoachInsight>>(initialInsights);
  const [loadingDay, setLoadingDay] = useState<number | null>(null);
  const [coachError, setCoachError] = useState<string | null>(null);

  const generateInsight = async (dayIndex: number) => {
    setLoadingDay(dayIndex);
    setCoachError(null);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayIndex }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      if (!res.ok) {
        setCoachError(data.error ?? 'coach_unavailable');
        return;
      }
      setInsights(prev => ({ ...prev, [dayIndex]: { insight: data.insight, createdAt: new Date().toISOString() } }));
    } catch {
      setCoachError('coach_unavailable');
    } finally {
      setLoadingDay(null);
    }
  };

  const prevCompletedRef = useRef<Record<number, boolean>>({});
  useEffect(() => {
    const wasCompleted = prevCompletedRef.current[activeTabDay];
    const isCompleted = !!challenge.days[activeTabDay]?.completed;
    prevCompletedRef.current[activeTabDay] = isCompleted;

    if (isCompleted && !wasCompleted && !insights[activeTabDay] && loadingDay === null) {
      generateInsight(activeTabDay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge.days, activeTabDay]);

  useEffect(() => {
    const supabase = createClient();
    const timeout = setTimeout(() => {
      supabase
        .from('challenge_progress')
        .update({
          days: challenge.days,
          current_day_index: challenge.currentDayIndex,
          start_date: challenge.startDate,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) console.error('Failed to save progress:', error);
        });
    }, 500);

    return () => clearTimeout(timeout);
  }, [challenge, userId]);

  // Calculate stats
  const totalDays = 21;
  const completedDaysCount = Object.values(challenge.days).filter(d => d.completed).length;

  const currentStreak = computeCurrentStreak(challenge.days, totalDays);

  const completionPercentage = Math.round((completedDaysCount / totalDays) * 100);

  const toggleHabit = (dayNum: number, habitId: string) => {
    setChallenge(prev => {
      const dayData = prev.days[dayNum] || { habits: {}, completed: false };
      const newHabits = { ...dayData.habits, [habitId]: !dayData.habits[habitId] };

      // Check if all habits are checked
      const allChecked = HABITS.every(h => newHabits[h.id]);

      const updatedDays = {
        ...prev.days,
        [dayNum]: {
          habits: newHabits,
          completed: allChecked,
        }
      };

      if (allChecked && !dayData.completed) {
        setCelebration(`Day ${dayNum} completed! 🎉 Keep the momentum going!`);
        setTimeout(() => setCelebration(null), 4000);
      }

      return {
        ...prev,
        days: updatedDays,
      };
    });
  };

  const markDayCompleteToggle = (dayNum: number) => {
    setChallenge(prev => {
      const dayData = prev.days[dayNum] || { habits: {}, completed: false };
      const nextCompleted = !dayData.completed;

      // If marking complete, check all habits
      const newHabits = { ...dayData.habits };
      if (nextCompleted) {
        HABITS.forEach(h => { newHabits[h.id] = true; });
        setCelebration(`Day ${dayNum} marked as complete! 🌟`);
        setTimeout(() => setCelebration(null), 4000);
      } else {
        HABITS.forEach(h => { newHabits[h.id] = false; });
      }

      return {
        ...prev,
        days: {
          ...prev.days,
          [dayNum]: {
            habits: newHabits,
            completed: nextCompleted,
          }
        }
      };
    });
  };

  const resetChallenge = () => {
    const initialDays: Record<number, DayData> = {};
    for (let i = 1; i <= 21; i++) {
      initialDays[i] = { habits: {}, completed: false };
    }
    setChallenge({
      startDate: new Date().toISOString(),
      days: initialDays,
      currentDayIndex: 1,
    });
    setActiveTabDay(1);
    setShowResetModal(false);
    setCelebration('Challenge reset. Day 1 starts now! 💪');
    setTimeout(() => setCelebration(null), 4000);

    setInsights({});
    const supabase = createClient();
    supabase
      .from('coach_insights')
      .delete()
      .eq('user_id', userId)
      .then(({ error }) => {
        if (error) console.error('Failed to clear coach insights:', error);
      });
  };

  const currentDayData = challenge.days[activeTabDay] || { habits: {}, completed: false };
  const completedHabitsCount = HABITS.filter(h => currentDayData.habits[h.id]).length;
  const dayProgressPct = Math.round((completedHabitsCount / HABITS.length) * 100);

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" /> 21-Day Habit Accountability Tracker
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Healthy Habit Challenge
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Master your daily routine across Morning, Midday, Afternoon, Evening & Night. Miss a day and your streak resets!
            </p>
          </div>
          <button
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition self-start md:self-auto"
          >
            <RotateCcw className="w-4 h-4" /> Reset Challenge
          </button>
        </div>
      </div>

      {/* Celebration Banner */}
      {celebration && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in shadow-sm">
          <Award className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{celebration}</span>
        </div>
      )}

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm mb-1">
            <span>Current Streak</span>
            <Flame className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {currentStreak} <span className="text-lg font-normal text-gray-500">/ 21 days</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Consecutive days completed</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm mb-1">
            <span>Total Completed</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {completedDaysCount} <span className="text-lg font-normal text-gray-500">days</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{completionPercentage}% overall completion</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm mb-1">
            <span>Active Day</span>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Day {activeTabDay}
          </div>
          <p className="text-xs text-gray-500 mt-1">{dayProgressPct}% habits checked today</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm mb-1">
            <span>Challenge Status</span>
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
            {currentStreak === 21 ? '🏆 Completed!' : currentStreak > 0 ? '🔥 On Track' : '⚡ Ready to Build'}
          </div>
          <p className="text-xs text-gray-500 mt-1">21-Day Rule Active</p>
        </div>
      </div>

      {/* Day Selector Bar (Days 1 - 21) */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-xs">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" /> Select Challenge Day (1 to 21)
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {Array.from({ length: 21 }, (_, i) => i + 1).map((dayNum) => {
            const isCompleted = challenge.days[dayNum]?.completed;
            const isSelected = activeTabDay === dayNum;
            return (
              <button
                key={dayNum}
                onClick={() => setActiveTabDay(dayNum)}
                className={`flex-shrink-0 w-12 h-14 rounded-lg flex flex-col items-center justify-center text-xs font-semibold transition border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-600/30'
                    : isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>D{dayNum}</span>
                <span className="mt-1">
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-gray-400 opacity-60" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Checklist Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Day {activeTabDay} Checklist
              {currentDayData.completed && (
                <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Completed 🎉
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {completedHabitsCount} of {HABITS.length} habits completed ({dayProgressPct}%)
            </p>
          </div>
          <button
            onClick={() => markDayCompleteToggle(activeTabDay)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 self-start sm:self-auto ${
              currentDayData.completed
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
            }`}
          >
            {currentDayData.completed ? (
              <>Mark Incomplete</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Complete Entire Day
              </>
            )}
          </button>
        </div>

        {/* AI Streak Coach */}
        <CoachInsightCard
          dayIndex={activeTabDay}
          insight={insights[activeTabDay]}
          loading={loadingDay === activeTabDay}
          error={loadingDay === null ? coachError : null}
          onGenerate={() => generateInsight(activeTabDay)}
        />

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2">
          <div
            className="bg-emerald-500 h-2 transition-all duration-300"
            style={{ width: `${dayProgressPct}%` }}
          />
        </div>

        {/* Habits by Category */}
        <div className="p-6 space-y-8">
          {CATEGORIES.map((category) => {
            const categoryHabits = HABITS.filter(h => h.category === category);
            const IconComponent = CATEGORY_ICONS[category];
            const completedCatCount = categoryHabits.filter(h => currentDayData.habits[h.id]).length;

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-md font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <IconComponent className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    {category} Routine
                  </h3>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                    {completedCatCount} / {categoryHabits.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryHabits.map((habit) => {
                    const isChecked = !!currentDayData.habits[habit.id];
                    return (
                      <div
                        key={habit.id}
                        onClick={() => toggleHabit(activeTabDay, habit.id)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-gray-900 dark:text-white'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                        }`}
                      >
                        <button
                          type="button"
                          className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 focus:outline-none"
                        >
                          {isChecked ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 dark:text-gray-700" />
                          )}
                        </button>
                        <span className={`text-sm font-medium leading-snug ${isChecked ? 'line-through opacity-80' : ''}`}>
                          {habit.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rules & Accountability Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-5 text-blue-900 dark:text-blue-200 text-sm space-y-2">
        <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
          <AlertCircle className="w-4 h-4" /> The 21-Day Accountability Rule
        </div>
        <p>
          Consistency is key! To maintain your streak and successfully finish the 21-day healthy habit challenge, check off all 18 daily dimensions across your morning, midday, afternoon, evening, and night routines. If a day is missed, your streak resets. Stay accountable and transform your daily habits!
        </p>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Reset 21-Day Challenge?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This will clear all checked habits and reset your streak back to Day 1. Are you sure you want to start over?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={resetChallenge}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-sm"
              >
                Yes, Reset Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
