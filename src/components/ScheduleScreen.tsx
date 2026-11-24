import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { TODAY_ISO } from '../data/initialData';
import { ProjectItem, TaskItem, TaskStatus, TeamMember } from '../types/taskflow';
import { addDaysISO, formatShortDate, getWeekDays, isOverdue } from '../utils/dateUtils';
import { Avatar } from './Avatar';
import { PriorityLabel, StatusLabel } from './StatusControls';

interface ScheduleScreenProps {
  tasks: TaskItem[];
  projects: ProjectItem[];
  team: TeamMember[];
  onSelectTask: (task: TaskItem) => void;
  onQuickAddDate: (isoDate: string) => void;
}

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({
  tasks,
  projects,
  team,
  onSelectTask,
  onQuickAddDate,
}) => {
  // Week starting Monday Nov 23, 2026
  const [weekStart, setWeekStart] = useState<string>('2026-11-23');

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const overdueTasks = useMemo(
    () =>
      tasks
        .filter((t) => isOverdue(t.dueDate, t.status === TaskStatus.Completed))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [tasks]
  );

  const rangeLabel = `${weekDays[0].monthLabel} ${weekDays[0].dayNum} – ${weekDays[6].monthLabel} ${weekDays[6].dayNum}`;

  return (
    <div className="space-y-6">
      {/* Header & Week Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-[#0F172A]">
            Sprint Schedule
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Weekly delivery timeline · Click any day to schedule a task
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart('2026-11-23')}
            className="h-9 px-3 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] rounded-lg whitespace-nowrap"
          >
            This Week
          </button>
          <div className="flex items-center bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setWeekStart((prev) => addDaysISO(prev, -7))}
              aria-label="Previous week"
              className="h-9 w-9 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-[#0F172A] font-mono tabular-nums whitespace-nowrap">
              {rangeLabel}
            </span>
            <button
              type="button"
              onClick={() => setWeekStart((prev) => addDaysISO(prev, 7))}
              aria-label="Next week"
              className="h-9 w-9 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Overdue Strip (if any) */}
      {overdueTasks.length > 0 && (
        <section className="bg-white border border-[#FECACA] rounded-2xl p-5 shadow-level-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-semibold text-[#B91C1C]">
              Overdue Deliverables ({overdueTasks.length})
            </h2>
            <span className="text-xs text-[#64748B]">Prior to {formatShortDate(TODAY_ISO)}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overdueTasks.map((task) => {
              const assignee = team.find((m) => m.id === task.assigneeId);
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onSelectTask(task)}
                  className="text-left p-3.5 rounded-xl bg-[#FEF2F2]/50 hover:bg-[#FEF2F2] border border-[#FECACA] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{task.title}</p>
                    <p className="text-xs text-[#B91C1C] font-mono mt-0.5 tabular-nums">
                      {task.key} · Due {formatShortDate(task.dueDate)}
                    </p>
                  </div>
                  <Avatar member={assignee} size="xs" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 7-Day Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4 items-start">
        {weekDays.map((day) => {
          const isToday = day.iso === TODAY_ISO;
          const dayTasks = tasks.filter((t) => t.dueDate === day.iso);

          return (
            <section
              key={day.iso}
              className={`rounded-2xl border p-3.5 min-h-[260px] flex flex-col justify-between transition-colors ${
                isToday
                  ? 'bg-[#EDE9FE]/30 border-[#7C3AED]/40'
                  : 'bg-white border-[#E2E8F0]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F1F5F9]">
                  <div>
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-[0.04em] ${
                        isToday ? 'text-[#7C3AED]' : 'text-[#64748B]'
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span
                        className={`font-display text-lg font-bold tabular-nums ${
                          isToday ? 'text-[#630ED4]' : 'text-[#0F172A]'
                        }`}
                      >
                        {day.dayNum}
                      </span>
                      <span className="text-xs text-[#64748B]">{day.monthLabel}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onQuickAddDate(day.iso)}
                    aria-label={`Schedule task on ${day.monthLabel} ${day.dayNum}`}
                    className="w-7 h-7 rounded-lg text-[#64748B] hover:text-[#7C3AED] hover:bg-[#EDE9FE] flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {dayTasks.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] py-6 text-center">No tasks due</p>
                ) : (
                  <div className="space-y-2.5">
                    {dayTasks.map((task) => {
                      const project = projects.find((p) => p.id === task.projectId);
                      const assignee = team.find((m) => m.id === task.assigneeId);

                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => onSelectTask(task)}
                          className="w-full text-left p-3 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#DDD6FE] shadow-level-1 hover:shadow-level-2 transition-all"
                        >
                          <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-1">
                            <span className="font-mono">{task.key}</span>
                            {project && <span className="truncate ml-2">{project.code}</span>}
                          </div>
                          <p
                            className={`text-xs font-semibold leading-snug ${
                              task.status === TaskStatus.Completed
                                ? 'text-[#64748B] line-through'
                                : 'text-[#0F172A]'
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <StatusLabel status={task.status} />
                            <Avatar member={assignee} size="xs" />
                          </div>
                          <div className="mt-1.5">
                            <PriorityLabel priority={task.priority} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
