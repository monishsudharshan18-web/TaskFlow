import React from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
} from 'lucide-react';
import { TaskPriority, TaskStatus } from '../types/taskflow';

export const STATUS_META: Record<
  TaskStatus,
  { label: string; textClass: string; surfaceBg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  [TaskStatus.Backlog]: {
    label: 'Backlog',
    textClass: 'text-[#475569]',
    surfaceBg: '#F1F5F9',
    icon: Circle,
  },
  [TaskStatus.InProgress]: {
    label: 'In Progress',
    textClass: 'text-[#6D28D9]',
    surfaceBg: '#EDE9FE',
    icon: Clock,
  },
  [TaskStatus.InReview]: {
    label: 'In Review',
    textClass: 'text-[#B45309]',
    surfaceBg: '#FFFBEB',
    icon: Eye,
  },
  [TaskStatus.Completed]: {
    label: 'Completed',
    textClass: 'text-[#047857]',
    surfaceBg: '#ECFDF5',
    icon: CheckCircle2,
  },
};

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; textClass: string; icon: React.ComponentType<{ className?: string }>; order: number }
> = {
  [TaskPriority.Urgent]: {
    label: 'Urgent',
    textClass: 'text-[#B91C1C]',
    icon: AlertCircle,
    order: 0,
  },
  [TaskPriority.High]: {
    label: 'High',
    textClass: 'text-[#B45309]',
    icon: ArrowUp,
    order: 1,
  },
  [TaskPriority.Medium]: {
    label: 'Medium',
    textClass: 'text-[#6D28D9]',
    icon: ArrowRight,
    order: 2,
  },
  [TaskPriority.Low]: {
    label: 'Low',
    textClass: 'text-[#64748B]',
    icon: ArrowDown,
    order: 3,
  },
};

export const StatusLabel: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${meta.textClass}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{meta.label}</span>
    </span>
  );
};

export const PriorityLabel: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const meta = PRIORITY_META[priority];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap shrink-0 ${meta.textClass}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{meta.label}</span>
    </span>
  );
};

interface TaskCheckboxProps {
  checked: boolean;
  onChange: (e: React.MouseEvent | React.ChangeEvent) => void;
  ariaLabel: string;
}

export const TaskCheckbox: React.FC<TaskCheckboxProps> = ({ checked, onChange, ariaLabel }) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onChange(e);
      }}
      className={`w-[18px] h-[18px] rounded-[4px] inline-flex items-center justify-center transition-all duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-1 ${
        checked
          ? 'bg-[#7C3AED] border border-[#7C3AED] text-white'
          : 'bg-white border-[1.5px] border-[#CBD5E1] hover:border-[#7C3AED]'
      }`}
    >
      {checked && <Check className="w-3 h-3 stroke-[3]" />}
    </button>
  );
};

export const ProgressTracker: React.FC<{ value: number; max?: number; className?: string }> = ({
  value,
  max = 100,
  className = '',
}) => {
  const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;
  return (
    <div
      className={`w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-200"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #7C3AED 0%, #8B5CF6 100%)',
        }}
      />
    </div>
  );
};
