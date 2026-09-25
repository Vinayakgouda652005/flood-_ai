import React from 'react';

export const RiskBadge = ({
  level,
  size = 'md',
  showIndicator = true,
}) => {
  const getStyles = () => {
    switch (level) {
      case 'LOW':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-800',
          border: 'border-emerald-200',
          dot: 'bg-emerald-600',
          label: 'LOW RISK',
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-300',
          dot: 'bg-amber-500',
          label: 'MODERATE RISK',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-900',
          border: 'border-orange-300',
          dot: 'bg-orange-600',
          label: 'HIGH RISK',
        };
      case 'VERY_HIGH':
        return {
          bg: 'bg-red-50',
          text: 'text-red-900',
          border: 'border-red-300',
          dot: 'bg-red-600',
          label: 'VERY HIGH RISK',
        };
      default:
        return {
          bg: 'bg-slate-50',
          text: 'text-slate-800',
          border: 'border-slate-200',
          dot: 'bg-slate-500',
          label: level,
        };
    }
  };

  const style = getStyles();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wide',
    lg: 'text-sm px-3 py-1.5 font-bold tracking-wide',
  }[size] || 'text-xs px-2.5 py-1 font-semibold tracking-wide';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border ${style.bg} ${style.text} ${style.border} ${sizeClasses} whitespace-nowrap`}
    >
      {showIndicator && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{style.label}</span>
    </span>
  );
};
