import React from 'react';

export const StatCard = ({
  label,
  value,
  unit,
  subtext,
  contextTag,
  highlight = 'default',
  children,
}) => {
  const getHighlightBorder = () => {
    switch (highlight) {
      case 'danger':
        return 'border-l-4 border-l-red-600 border-slate-200';
      case 'warning':
        return 'border-l-4 border-l-amber-500 border-slate-200';
      case 'info':
        return 'border-l-4 border-l-sky-600 border-slate-200';
      default:
        return 'border-slate-200';
    }
  };

  return (
    <div
      className={`bg-white border rounded p-4 text-slate-800 ${getHighlightBorder()} shadow-xs`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {contextTag && (
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            {contextTag}
          </span>
        )}
      </div>

      {children ? (
        <div className="mt-1">{children}</div>
      ) : (
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-semibold text-slate-600">
              {unit}
            </span>
          )}
        </div>
      )}

      {subtext && (
        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2">
          {subtext}
        </p>
      )}
    </div>
  );
};
