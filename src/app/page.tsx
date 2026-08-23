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

  return <HabitTracker userId={user.id} initialChallenge={initialChallenge} />;
}
