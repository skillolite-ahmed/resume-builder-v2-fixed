import React from 'react';
import type { ValidationSummary } from '../types/resume';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ValidationPanelProps {
  summary: ValidationSummary;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ summary }) => {
  const getStatusBadge = (status: 'PASS' | 'FAIL' | 'NOT TESTED' | 'BLOCKED') => {
    switch (status) {
      case 'PASS':
        return (
          <span className="badge badge-pass">
            <CheckCircle2 size={13} /> PASS
          </span>
        );
      case 'FAIL':
        return (
          <span className="badge badge-fail">
            <XCircle size={13} /> FAIL
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="badge badge-blocked">
            <AlertTriangle size={13} /> BLOCKED
          </span>
        );
      default:
        return <span className="badge badge-neutral">NOT TESTED</span>;
    }
  };

  return (
    <div className="validation-container">
      <div className="validation-header">
        <div className="validation-title-row">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-800 text-sm">Fidelity & Validation Summary</h3>
          </div>
          <div>{getStatusBadge(summary.overallStatus)}</div>
        </div>

        {/* Word Preservation Gauge */}
        <div className="validation-stats">
          <div className="stat-card">
            <span className="stat-label">Factual Preservation</span>
            <div className="stat-value-row">
              <span className="stat-number">{summary.wordPreservationRate}%</span>
              <span className="stat-desc">Original content preserved</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className={`progress-bar-fill ${
                  summary.wordPreservationRate >= 80 ? 'fill-green' : 'fill-amber'
                }`}
                style={{ width: `${Math.min(100, summary.wordPreservationRate)}%` }}
              />
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-label">Fabricated Placeholders</span>
            <div className="stat-value-row">
              <span className={`stat-number ${summary.unknownPlaceholdersCount === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.unknownPlaceholdersCount}
              </span>
              <span className="stat-desc">"Unknown" labels introduced</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist items */}
      <div className="validation-list">
        {summary.items.map(item => (
          <div key={item.id} className="validation-item">
            <div className="item-top">
              <span className="item-label">{item.label}</span>
              {getStatusBadge(item.status)}
            </div>
            <p className="item-msg">{item.message}</p>
            {item.details && <p className="item-details">{item.details}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};
