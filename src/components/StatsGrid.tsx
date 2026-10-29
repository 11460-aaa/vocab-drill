import type { WordStats } from '../types';
import { BarChartIcon, BookIcon, TargetIcon, TrophyIcon } from './Icons';
import { formatAccuracy } from '../lib/stats';

interface StatsGridProps {
  stats: WordStats;
  compact?: boolean;
}

/** 四项核心统计：总词数、已掌握、待复习、累计正确率。 */
export function StatsGrid({ stats, compact = false }: StatsGridProps) {
  const items = [
    {
      label: '总词数',
      value: String(stats.total),
      hint: '生词本里的全部词条',
      icon: BookIcon,
      tone: 'bg-moss-50 text-moss-600',
    },
    {
      label: '已掌握',
      value: String(stats.mastered),
      hint: '连续答对 3 次',
      icon: TrophyIcon,
      tone: 'bg-papaya-50 text-papaya-700',
    },
    {
      label: '待复习',
      value: String(stats.due),
      hint: '尚未达到掌握标准',
      icon: TargetIcon,
      tone: 'bg-[#eef1ff] text-[#586bb5]',
    },
    {
      label: '累计正确率',
      value: formatAccuracy(stats.accuracy, stats.totalCorrect + stats.totalWrong),
      hint: `${stats.totalCorrect} 对 · ${stats.totalWrong} 错`,
      icon: BarChartIcon,
      tone: 'bg-coral-50 text-coral-600',
    },
  ];

  return (
    <div className={`grid grid-cols-2 gap-3 ${compact ? 'lg:grid-cols-4' : 'sm:grid-cols-4'}`}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={`panel flex flex-col justify-between ${
              compact ? 'gap-3 p-4' : 'gap-4 p-5'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-ink-500">{item.label}</span>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.tone}`}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <div>
              <p
                className={`font-display font-semibold leading-none tracking-tight text-ink-900 ${
                  compact ? 'text-[28px]' : 'text-4xl'
                }`}
              >
                {item.value}
              </p>
              <p className="mt-2 text-[11px] text-ink-400">{item.hint}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
