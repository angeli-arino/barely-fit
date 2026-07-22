import { Check, LockKeyhole, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { useAppState } from '../state/AppState';

export function SignInPage() {
  const { dispatch, authenticated } = useAppState();
  const navigate = useNavigate();
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    dispatch({ type: 'sign-in' });
    navigate('/today');
  };

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
            <FormField label="Email" type="email" defaultValue="abby@example.com" autoComplete="email" />
            <FormField label="Password" type="password" defaultValue="prototype" autoComplete="current-password" />
            <Button type="submit" variant="primary" size="lg" full>{authenticated ? 'Continue to training' : 'Sign in privately'}</Button>
          </form>
          <div className="mt-6 space-y-3 border-t border-[var(--border)] pt-5 text-sm text-[var(--text-muted)]">
            <div className="flex items-start gap-3"><Smartphone className="mt-0.5 shrink-0 text-[var(--text-faint)]" size={18} /><span>Home Screen sign-in persists on this iPhone unless you explicitly sign out.</span></div>
            <div className="flex items-start gap-3"><Check className="mt-0.5 shrink-0 text-[var(--success)]" size={18} /><span>No public signup, invitations, members, or social discovery.</span></div>
          </div>
        </div>
        <p className="mt-5 text-center text-xs text-[var(--text-faint)]">Prototype only · authentication is deliberately mocked</p>
      </div>
    </main>
  );
}
