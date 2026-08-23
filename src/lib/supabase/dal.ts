import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});

export const verifySession = cache(async () => {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
});
