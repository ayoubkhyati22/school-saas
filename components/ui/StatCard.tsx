import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  description?: string;
  color?: 'default' | 'blue' | 'green' | 'amber' | 'red' | 'purple';
}

const colorMap = {
  default: 'bg-muted text-foreground',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = 'default',
}: StatCardProps) {
  return (
    <div className="bg-card border border-border p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">{value}</p>
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              {trend.isPositive ? (
                <TrendingUp size={14} className="text-green-500" />
              ) : (
                <TrendingDown size={14} className="text-red-500" />
              )}
              <span className={cn('text-xs font-medium', trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">
                {trend.label || 'vs last month'}
              </span>
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        <div className={cn('w-11 h-11 flex items-center justify-center flex-shrink-0', colorMap[color])}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
