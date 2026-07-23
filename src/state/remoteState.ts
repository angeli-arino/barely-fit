import { supabase } from '../lib/supabase';

export async function loadRemoteState<T>(memberId: string): Promise<{ value: T; updatedAt: string } | undefined> {
  if (!supabase) return undefined;
  const { data, error } = await supabase
    .from('member_state')
    .select('state, updated_at')
    .eq('member_id', memberId)
    .maybeSingle();
  if (error) throw error;
  return data ? { value: data.state as T, updatedAt: data.updated_at as string } : undefined;
}

export async function saveRemoteState<T>(memberId: string, state: T) {
  if (!supabase) return;
  const { error } = await supabase
    .from('member_state')
    .upsert({ member_id: memberId, state, updated_at: new Date().toISOString() });
  if (error) throw error;
}
