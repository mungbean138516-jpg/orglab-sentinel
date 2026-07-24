import React from 'react';

export function OrgScoreBars({ results }) {
  const max = Math.max(...results.map((r) => r.score), 1);
  return (
    <div className="chart-bars" role="img" aria-label="组织实验得分对比">
      {results.map((result) => (
        <div className={`bar-col ${result.winner ? 'winner' : ''}`} key={result.id}>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ height: `${(result.score / max) * 100}%`, background: result.color }}
            />
          </div>
          <b>{result.score}</b>
          <span>{result.name}</span>
        </div>
      ))}
    </div>
  );
}
