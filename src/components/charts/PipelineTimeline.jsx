import React from 'react';

const STEPS = [
  { phase: 1, label: '新闻' },
  { phase: 1, label: '公告', parallel: true },
  { phase: 3, label: '汇总' },
  { phase: 5, label: '报告' },
  { phase: 5, label: '你来确认', gate: true },
];

export function PipelineTimeline({ phase, reviewed }) {
  return (
    <ol className="chart-timeline" aria-label="分析流程时间线">
      {STEPS.map((step, index) => {
        const done = step.gate ? reviewed : phase >= step.phase;
        const prevPhase = index === 0 ? 0 : STEPS[index - 1].phase;
        const active = !step.gate && !done && phase >= prevPhase && phase < step.phase;
        return (
          <li
            key={`${step.label}-${index}`}
            className={`${done ? 'done' : ''} ${active ? 'active' : ''} ${step.gate ? 'gate' : ''}`}
          >
            <span>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
