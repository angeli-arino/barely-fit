import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabaseConfigurationError = !url || !publishableKey
  ? 'Private sign-in is not configured for this deployment.'
  : undefined;

// Only VITE_ variables are included in the client bundle. This must always be
// Supabase's publishable (or legacy anon) key—never a privileged server secret.
export const supabase = supabaseConfigurationError
  ? null
  : createClient(url!, publishableKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });

export type MemberSessionStatus = 'allowed' | 'revoked' | 'unreachable';

export async function validateMemberSession(): Promise<MemberSessionStatus> {
  if (!supabase) return 'revoked';

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return userError.status === 401 || userError.status === 403 ? 'revoked' : 'unreachable';
  if (!userData.user) return 'revoked';

  const { error: authorizationError } = await supabase.rpc('assert_authorized_member');
  if (!authorizationError) return 'allowed';
  return authorizationError.code === '42501' ? 'revoked' : 'unreachable';
}
