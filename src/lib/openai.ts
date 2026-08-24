import 'server-only';
import OpenAI from 'openai';
import { HABITS } from '@/lib/habits';

export const COACH_MODEL = 'gpt-4o';

let client: OpenAI | null = null;

// Lazily constructed so a missing OPENAI_API_KEY only fails at request time
// (inside the route handler's try/catch), not while Next.js collects page
// data for every route at build time.
export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI(); // reads OPENAI_API_KEY from env
  }
  return client;
}

const HABIT_LEGEND = HABITS.map((h) => `${h.id}: ${h.text}`).join('\n');

export const COACH_SYSTEM_PROMPT =
  `You are an encouraging accountability coach inside a 21-day habit challenge app. ` +
  `In 1-2 sentences, acknowledge the user's recent pattern and suggest one concrete, practical action ` +
  `(a schedule, environment, or reminder tweak) — never medical, dietary-restriction, or health-diagnosis advice. ` +
  `Be specific to the data given, not generically motivational.\n\nHabit legend:\n${HABIT_LEGEND}`;
