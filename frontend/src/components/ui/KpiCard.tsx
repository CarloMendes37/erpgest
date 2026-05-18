import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title:     string;
  value:     string | number;
  subtitle?: string;
  icon:      React.ReactNode;
  iconBg?:   string;
  trend?:    number;     // percentage change
  trendLabel?: string;
  danger?:   boolean;
  warning?:  boolean;
}

export default function KpiCard({
  title, value, subtitle, icon, iconBg = 'from-indigo-500 to-purple-500',
  trend, trendLabel, danger, warning,
}: KpiCardProps) {
  return (
    <div className={`kpi-card p-5 flex items-start gap-4
      ${danger  ? 'border-l-4 border-red-400'    : ''}
      ${warning ? 'border-l-4 border-yellow-400'  : ''}`}>
      {/* Icon */}
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${iconBg}
        flex items-center justify-center text-white shadow-card`}>
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">{title}</p>
        <p className={`text-2xl font-bold mt-0.5 truncate
          ${danger ? 'text-red-500' : warning ? 'text-yellow-500' : 'text-gray-800'}`}>
          {value}
        </p>
        {(subtitle || trend !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {trend !== undefined && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold
                ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {trend >= 0
                  ? <TrendingUp size={12} />
                  : <TrendingDown size={12} />}
                {Math.abs(trend)}%
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-gray-400">{trendLabel ?? subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
