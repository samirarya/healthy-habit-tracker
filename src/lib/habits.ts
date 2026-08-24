export interface HabitItem {
  id: string;
  category: 'Morning' | 'Breakfast & Midday' | 'Afternoon' | 'Evening' | 'Night';
  text: string;
}

export const HABITS: HabitItem[] = [
  // Morning
  { id: 'morning_wake', category: 'Morning', text: 'Wake up at consistent time' },
  { id: 'morning_hydrate', category: 'Morning', text: 'Hydrate (1–2 glasses of water)' },
  { id: 'morning_stretch', category: 'Morning', text: 'Stretching / movement (5–10 min)' },
  { id: 'morning_meditate', category: 'Morning', text: 'Mindful breathing / meditation' },

  // Breakfast & Midday
  { id: 'midday_breakfast', category: 'Breakfast & Midday', text: 'High-protein, high-fiber meal (Breakfast)' },
  { id: 'midday_breaks', category: 'Breakfast & Midday', text: 'Standing/walking breaks each hour' },
  { id: 'midday_sunlight', category: 'Breakfast & Midday', text: 'Morning sunlight exposure (5–10 min)' },

  // Afternoon
  { id: 'afternoon_lunch', category: 'Afternoon', text: 'Balanced lunch' },
  { id: 'afternoon_walk', category: 'Afternoon', text: 'Post-meal walk (10 min)' },
  { id: 'afternoon_hydrate', category: 'Afternoon', text: 'Hydration (water / herbal tea)' },
  { id: 'afternoon_reset', category: 'Afternoon', text: 'Mid-afternoon reset (stretch/breathe/steps)' },
  { id: 'afternoon_snack', category: 'Afternoon', text: 'Healthy snack' },

  // Evening
  { id: 'evening_activity', category: 'Evening', text: '30–45 min physical activity' },
  { id: 'evening_dinner', category: 'Evening', text: 'Light, balanced dinner' },
  { id: 'evening_screens', category: 'Evening', text: 'Limit screen time before bed' },

  // Night
  { id: 'night_journal', category: 'Night', text: 'Mindfulness / gratitude journal' },
  { id: 'night_stretch', category: 'Night', text: 'Gentle stretching / relaxation' },
  { id: 'night_sleep', category: 'Night', text: 'Sleep 7–8 hrs (fixed bedtime)' },
];

export const CATEGORIES = ['Morning', 'Breakfast & Midday', 'Afternoon', 'Evening', 'Night'] as const;

export interface DayData {
  habits: Record<string, boolean>;
  completed: boolean;
}

export interface ChallengeState {
  startDate: string; // ISO date string
  days: Record<number, DayData>; // Day 1 to 21
  currentDayIndex: number; // 1 to 21
}
