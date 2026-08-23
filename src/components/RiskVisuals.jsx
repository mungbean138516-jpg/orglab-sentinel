import React from 'react';
import { AlertTriangle, Check, CircleHelp } from 'lucide-react';

export function AllocationDonut({ holdings }) {
  let cursor = 0;
  const segments = holdings.map((holding) => {
    const start = cursor;
    cursor += holding.allocation;
    return `${holding.color} ${start}% ${cursor}%`;
  });

  return (
    <div className="allocation-visual">
      <div
        className="allocation-donut"
        role="img"
        aria-label={holdings.map((holding) => `${holding.name} ${holding.allocation}%`).join('，')}
        style={{ '--segments': segments.join(', ') }}
      >
        <div>
          <strong>100%</strong>
          <span>模拟关注权重</span>
        </div>
      </div>
      <div className="allocation-legend">
        {holdings.map((holding) => (
          <div key={holding.ticker}>
            <i style={{ '--legend': holding.color }} />
            <span>{holding.name}</span>
            <b>{holding.allocation}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function scale(value, min, max, outputMin, outputMax) {
  if (max === min) return (outputMin + outputMax) / 2;
  return outputMin + ((value - min) / (max - min)) * (outputMax - outputMin);
}

export function ThresholdTrendChart({ trend }) {
  const width = 620;
  const height = 250;
  const left = 52;
  const right = 594;
  const top = 24;
  const bottom = 194;
  const values = [...trend.points.map((point) => point.value), trend.threshold];
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = Math.max((rawMax - rawMin) * 0.24, 1);
  const min = rawMin - padding;
  const max = rawMax + padding;
  const xStep = (right - left) / Math.max(trend.points.length - 1, 1);
  const points = trend.points.map((point, index) => ({
    ...point,
    x: left + index * xStep,
    y: scale(point.value, min, max, bottom, top),
  }));
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const thresholdY = scale(trend.threshold, min, max, bottom, top);
  const triggered = trend.metric === '转载相似度'
    ? trend.points.at(-1).value >= trend.threshold
    : trend.points.at(-1).value <= trend.threshold;

  return (
    <div className="trend-chart-wrap">
      <svg
        className="trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${trend.metric}趋势；演示阈值 ${trend.threshold}${trend.unit}`}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((row) => {
          const y = top + ((bottom - top) / 3) * row;
          return <line className="chart-grid-line" key={row} x1={left} y1={y} x2={right} y2={y} />;
        })}
        <line className="threshold-line" x1={left} y1={thresholdY} x2={right} y2={thresholdY} />
        <text className="threshold-label" x={right - 4} y={thresholdY - 8} textAnchor="end">
          演示阈值 {trend.threshold}{trend.unit}
        </text>
        <path className="trend-area" d={`${path} L ${right} ${bottom} L ${left} ${bottom} Z`} />
        <path className="trend-path" d={path} />
        {points.map((point, index) => (
          <g key={point.label}>
            <circle
              className={`trend-dot ${index === points.length - 1 && triggered ? 'triggered' : ''}`}
              cx={point.x}
              cy={point.y}
              r={index === points.length - 1 ? 6 : 4}
            />
            <text className="chart-value" x={point.x} y={point.y - 13} textAnchor="middle">
              {point.value}{trend.unit}
            </text>
            <text className="chart-axis-label" x={point.x} y={bottom + 29} textAnchor="middle">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
      <div className={`trigger-explainer ${triggered ? 'active' : ''}`}>
        {triggered ? <AlertTriangle size={16} /> : <Check size={16} />}
        <span>
          <b>{triggered ? '已触发人工复核' : '未触发规则'}</b>
          {triggered
            ? '曲线越过演示阈值，只代表进入证据核验，不代表预测股价。'
            : '当前情景值未越过演示阈值。'}
        </span>
      </div>
    </div>
  );
}

export function EvidenceBalance({ scenario }) {
  const claims = Object.values(scenario.evidenceBriefs).flatMap((brief) => brief.claims);
  const confirmed = claims.filter((claim) => claim.state === 'CONFIRMED').length;
  const pending = claims.filter((claim) => claim.state === 'PENDING_VERIFICATION').length;
  const unknown = claims.filter((claim) => claim.state === 'UNKNOWN').length;
  const conflicts = scenario.synthesis.conflicts.length;
  const total = Math.max(confirmed + pending + unknown, 1);
  const items = [
    { label: '已确认', value: confirmed, className: 'verified', icon: Check },
    { label: '待核实', value: pending, className: 'pending', icon: CircleHelp },
    { label: '暂无法判断', value: unknown, className: 'gap', icon: CircleHelp },
  ];

  return (
    <div className="evidence-balance">
      <div className="balance-bar" aria-label="证据状态构成">
        {items.map((item) => (
          <span
            key={item.label}
            className={item.className}
            style={{ width: `${(item.value / total) * 100}%` }}
            title={`${item.label} ${item.value}`}
          />
        ))}
      </div>
      <div className="balance-legend">
        {items.map(({ label, value, className, icon: Icon }) => (
          <div key={label} className={className}>
            <Icon size={14} />
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>
      {conflicts > 0 && (
        <div className="balance-conflict">
          <AlertTriangle size={13} />另保留 {conflicts} 项来源冲突，不并入事实状态计算。
        </div>
      )}
    </div>
  );
}
