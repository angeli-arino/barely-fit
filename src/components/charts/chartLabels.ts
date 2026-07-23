export function trendLabelIndexes(pointCount: number, maximumLabels = 6): Set<number> {
  if (pointCount <= maximumLabels) {
    return new Set(Array.from({ length: pointCount }, (_, index) => index));
  }

  const indexes = new Set<number>([0, pointCount - 1]);
  const interval = (pointCount - 1) / (maximumLabels - 1);
  for (let label = 1; label < maximumLabels - 1; label += 1) {
    indexes.add(Math.round(label * interval));
  }
  return indexes;
}
