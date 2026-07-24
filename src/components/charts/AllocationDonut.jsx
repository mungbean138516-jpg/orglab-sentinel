import React from 'react';
import { describeArc, donutSegments } from './chartMath.js';

export function AllocationDonut({ holdings, centerLabel = '模拟', centerValue }) {
  const cx = 60;
  const cy = 60;
  const radius = 48;
  const segments = donutSegments(holdings);
  return (
    <div className="chart-donut" role="img" aria-label="仓位分布环形图">
      <svg viewBox="0 0 120 120" width="120" height="120">
        {segments.map((segment) => {
          const sweep = segment.endAngle - segment.startAngle;
          if (sweep <= 0) return null;
          // Full circle: use two half-arcs so SVG path closes cleanly
          if (sweep >= 359.9) {
            return (
              <circle
                key={segment.ticker}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="14"
              />
            );
          }
          return (
            <path
              key={segment.ticker}
              d={describeArc(cx, cy, radius, segment.startAngle, segment.endAngle)}
              fill="none"
              stroke={segment.color}
              strokeWidth="14"
              strokeLinecap="butt"
            />
          );
        })}
        <circle cx={cx} cy={cy} r="34" className="donut-hole" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="donut-value">{centerValue}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="donut-label">{centerLabel}</text>
      </svg>
    </div>
  );
}
