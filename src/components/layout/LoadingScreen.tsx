export function LoadingScreen() {
  return (
    <div className="grid min-h-dvh place-items-center bg-[var(--bg)] p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3"><div className="grid size-11 place-items-center rounded-[13px] bg-[var(--accent)] font-black text-[#151515]">B</div><div><div className="font-black tracking-[.08em]">BARELY FIT</div><div className="text-xs text-[var(--text-muted)]">restoring local workout</div></div></div>
        <div className="space-y-3" aria-label="Loading saved workout">
          <div className="h-24 animate-pulse-soft rounded-[var(--radius-lg)] bg-[var(--surface)]" />
          <div className="h-16 animate-pulse-soft rounded-[var(--radius-lg)] bg-[var(--surface)]" />
          <div className="h-16 animate-pulse-soft rounded-[var(--radius-lg)] bg-[var(--surface)]" />
        </div>
      </div>
    </div>
  );
}
