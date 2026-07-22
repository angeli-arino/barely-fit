import { supabase } from '../lib/supabase';

export async function loadRemoteState<T>(memberId: string): Promise<T | undefined> {
  if (!supabase) return undefined;
  const { data, error } = await supabase
    .from('member_state')
    .select('state')
    .eq('member_id', memberId)
    .maybeSingle();
  if (error) throw error;
  return data?.state as T | undefined;
}

export async function saveRemoteState<T>(memberId: string, state: T) {
  if (!supabase) return;
  const { error } = await supabase
    .from('member_state')
    .upsert({ member_id: memberId, state, updated_at: new Date().toISOString() });
  if (error) throw error;
}
