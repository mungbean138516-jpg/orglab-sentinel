export function donutSegments(items) {
  const total = items.reduce((sum, item) => sum + item.allocation, 0) || 1;
  let cursor = 0;
  return items.map((item) => {
    const sweep = (item.allocation / total) * 360;
    const segment = {
      ...item,
      startAngle: cursor,
      endAngle: cursor + sweep,
    };
    cursor += sweep;
    return segment;
  });
}

/** @param {number|null|undefined} score */
export function gaugeAngle(score) {
  if (score === null || score === undefined || Number.isNaN(score)) return null;
  const clamped = Math.min(100, Math.max(0, score));
  return -90 + (clamped / 100) * 180;
}

export function polarToCartesian(cx, cy, radius, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}
