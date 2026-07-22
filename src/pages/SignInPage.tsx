import { Check, LockKeyhole, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { useAppState } from '../state/AppState';

export function SignInPage() {
  const { authenticated, authConfigurationError, signIn } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(undefined);
    setSubmitting(true);
    const signInError = await signIn(email, password);
    setSubmitting(false);
    if (signInError) setError(signInError);
  };

  if (authenticated) return <Navigate to="/today" replace />;

  return (
    <main className="safe-top safe-bottom grid min-h-dvh place-items-center bg-[var(--bg)] px-5 py-10">
      <div className="w-full max-w-md animate-rise">
        <div className="mb-10 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-[14px] bg-[var(--accent)] text-lg font-black text-[#151515]">B</div>
          <div><div className="font-black tracking-[.08em]">BARELY FIT</div><div className="text-sm text-[var(--text-muted)]">private workout tracking</div></div>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)] sm:p-7">
          <div className="mb-6 grid size-12 place-items-center rounded-[14px] bg-[var(--accent-soft)] text-[var(--accent)]"><LockKeyhole size={22} /></div>
          <h1 className="text-balance text-3xl font-black tracking-[-.045em]">Your training stays private.</h1>
          <p className="mt-3 leading-7 text-[var(--text-muted)]">One private Member, no public profile. This device remains signed in so a Workout is always one tap away.</p>
          <form className="mt-7 space-y-4" onSubmit={submit}>
            <FormField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            <FormField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            {error && <p role="alert" className="rounded-[var(--radius-md)] border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">{error}</p>}
            <Button type="submit" variant="primary" size="lg" full disabled={Boolean(authConfigurationError) || submitting}>{submitting ? 'Signing in…' : authenticated ? 'Continue to training' : 'Sign in privately'}</Button>
          </form>
          <div className="mt-6 space-y-3 border-t border-[var(--border)] pt-5 text-sm text-[var(--text-muted)]">
            <div className="flex items-start gap-3"><Smartphone className="mt-0.5 shrink-0 text-[var(--text-faint)]" size={18} /><span>Home Screen sign-in persists on this iPhone unless you explicitly sign out.</span></div>
            <div className="flex items-start gap-3"><Check className="mt-0.5 shrink-0 text-[var(--success)]" size={18} /><span>No public signup, invitations, Members, or social discovery.</span></div>
          </div>
        </div>
        <p className="mt-5 text-center text-xs text-[var(--text-faint)]">{authConfigurationError ?? 'Private Member access only · public signup is disabled'}</p>
      </div>
    </main>
  );
}
