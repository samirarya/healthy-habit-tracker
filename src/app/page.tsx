import { verifySession } from '@/lib/supabase/dal';
import { createClient } from '@/lib/supabase/server';
import HabitTracker from '@/components/HabitTracker';

export default async function Home() {
  const user = await verifySession();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from('challenge_progress')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const initialChallenge = {
    startDate: row?.start_date ?? new Date().toISOString(),
    days: row?.days ?? {},
    currentDayIndex: row?.current_day_index ?? 1,
  };

  const { data: insightRows } = await supabase
    .from('coach_insights')
    .select('day_index, insight, created_at')
    .eq('user_id', user.id);

  const initialInsights = Object.fromEntries(
    (insightRows ?? []).map((r) => [r.day_index, { insight: r.insight, createdAt: r.created_at }])
  );

  return <HabitTracker userId={user.id} initialChallenge={initialChallenge} initialInsights={initialInsights} />;
}
