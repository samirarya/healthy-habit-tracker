import OpenAI from 'openai';
import { getUser } from '@/lib/supabase/dal';
import { createClient } from '@/lib/supabase/server';
import { getOpenAIClient, COACH_MODEL, COACH_SYSTEM_PROMPT } from '@/lib/openai';
import { HABITS, type DayData } from '@/lib/habits';
import { computeCurrentStreak } from '@/lib/streak';

function missedHabitIds(day?: DayData): string[] {
  return HABITS.map((h) => h.id).filter((id) => !day?.habits[id]);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const dayIndex = body?.dayIndex;
  if (!Number.isInteger(dayIndex) || dayIndex < 1 || dayIndex > 21) {
    return Response.json({ error: 'invalid_day_index' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: progressRow } = await supabase
    .from('challenge_progress')
    .select('days')
    .eq('user_id', user.id)
    .single();
  const days: Record<number, DayData> = progressRow?.days ?? {};

  // Simple cost-abuse guard: reject if the user's last coach call was too recent.
  const { data: lastInsight } = await supabase
    .from('coach_insights')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastInsight && Date.now() - new Date(lastInsight.created_at).getTime() < 10_000) {
    return Response.json({ error: 'rate_limited' }, { status: 429 });
  }

  const currentStreak = computeCurrentStreak(days);
  const recentHistory = Array.from({ length: 7 }, (_, i) => dayIndex - 6 + i)
    .filter((d) => d >= 1 && days[d])
    .map((d) => ({
      dayIndex: d,
      completed: !!days[d].completed,
      missedHabitIds: missedHabitIds(days[d]),
    }));

  const todayMissed = missedHabitIds(days[dayIndex]);
  const promptData = {
    dayIndex,
    currentStreak,
    today: {
      completedCount: HABITS.length - todayMissed.length,
      totalHabits: HABITS.length,
      missedHabitIds: todayMissed,
    },
    recentHistory,
  };

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: COACH_MODEL,
      max_tokens: 300,
      messages: [
        { role: 'system', content: COACH_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(promptData) },
      ],
    });

    const insight = response.choices[0]?.message?.content ?? '';

    const { error: upsertError } = await supabase
      .from('coach_insights')
      .upsert(
        { user_id: user.id, day_index: dayIndex, insight, model: COACH_MODEL },
        { onConflict: 'user_id,day_index' }
      );
    if (upsertError) {
      console.error('Failed to persist coach insight:', upsertError);
    }

    return Response.json({ insight });
  } catch (err) {
    if (err instanceof OpenAI.RateLimitError) {
      return Response.json({ error: 'coach_rate_limited' }, { status: 429 });
    }
    console.error('Coach insight generation failed:', err);
    return Response.json({ error: 'coach_unavailable' }, { status: 502 });
  }
}
