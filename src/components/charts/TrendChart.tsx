import { useId } from 'react';

interface Point {
  label: string;
  value: number;
}

export function TrendChart({ points, unit, summary }: { points: Point[]; unit: string; summary: string }) {
  const titleId = useId();
  const descriptionId = useId();
  const width = 640;
  const height = 220;
  const padX = 34;
  const padTop = 20;
  const padBottom = 38;
  const min = Math.min(...points.map((point) => point.value));
  const max = Math.max(...points.map((point) => point.value));
  const spread = Math.max(1, max - min);
  const coords = points.map((point, index) => ({
    ...point,
    x: padX + (index * (width - padX * 2)) / Math.max(1, points.length - 1),
    y: padTop + ((max - point.value) / spread) * (height - padTop - padBottom),
  }));
  const path = coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div>
      <svg className="h-auto w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
        <title id={titleId}>Training trend</title>
        <desc id={descriptionId}>{summary}</desc>
        {[0, 1, 2, 3].map((row) => {
          const y = padTop + (row * (height - padTop - padBottom)) / 3;
          return <line key={row} x1={padX} x2={width - padX} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />;
        })}
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={point.x} cy={point.y} r="6" fill="var(--surface)" stroke="var(--accent)" strokeWidth="4" />
            <text x={point.x} y={height - 12} textAnchor="middle" fill="var(--text-faint)" fontSize="13" fontWeight="600">{point.label}</text>
            <text x={point.x} y={point.y - 14} textAnchor="middle" fill="var(--text)" fontSize="13" fontWeight="700">{point.value}{unit}</text>
          </g>
        ))}
      </svg>
      <p className="mt-2 rounded-[12px] bg-[var(--surface-strong)] px-3 py-2 text-sm leading-6 text-[var(--text-muted)]"><span className="font-semibold text-[var(--text)]">Chart summary:</span> {summary}</p>
    </div>
  );
}
