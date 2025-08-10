// Simple windowing helper: given total items, height, rowHeight, and scrollTop, compute visible [start, end)
export function computeWindow({ total, containerHeight, rowHeight, scrollTop, overscan = 5 }) {
  if (total <= 0 || containerHeight <= 0 || rowHeight <= 0) return { start: 0, end: 0 };
  const first = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / rowHeight) + overscan * 2;
  const end = Math.min(total, first + visibleCount);
  return { start: first, end };
}

export function getTopOffset(start, rowHeight) {
  return Math.max(0, start) * Math.max(0, rowHeight);
}
