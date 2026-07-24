import React from 'react';
import { gaugeAngle } from './chartMath.js';

export function RiskGauge({ score, ready }) {
  const angle = ready ? gaugeAngle(score) : null;
  const display = !ready ? '…' : score === null ? '—' : String(score);
  return (
    <div className="chart-gauge" role="img" aria-label={`风险分 ${display}`}>
      <div className="gauge-arc" data-ready={ready && score !== null}>
        <span
          className="gauge-needle"
          style={angle === null ? { opacity: 0.25 } : { transform: `rotate(${angle}deg)` }}
        />
      </div>
      <strong className="gauge-score">{display}</strong>
      <span className="gauge-caption">
        {!ready ? '计算中' : score === null ? '暂缓评分' : '风险分 / 100'}
      </span>
    </div>
  );
}
