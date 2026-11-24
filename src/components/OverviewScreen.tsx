import React, { useMemo, useState } from 'react';
import { ArrowRight, Calendar, CheckCircle2, Clock, Flame } from 'lucide-react';
import { TODAY_ISO, WEEKLY_THROUGHPUT } from '../data/initialData';
import { ProjectItem, TaskItem, TaskPriority, TaskStatus, TeamMember, ViewType } from '../types/taskflow';
import { formatShortDate, isDueToday, isOverdue } from '../utils/dateUtils';
import { Avatar } from './Avatar';
import { PriorityLabel, ProgressTracker, StatusLabel, TaskCheckbox } from './StatusControls';

interface OverviewScreenProps {
  tasks: TaskItem[];
  projects: ProjectItem[];
  team: TeamMember[];
  onSelectTask: (task: TaskItem) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onNavigateView: (view: ViewType) => void;
  onSelectProject: (projectId: string) => void;
  onOpenNewTask: () => void;
}

type FocusFilter = 'all' | 'urgent' | 'today';

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  tasks,
  projects,
  team,
  onSelectTask,
  onToggleTaskComplete,
  onNavigateView,
  onSelectProject,
  onOpenNewTask,
}) => {
  const [focusFilter, setFocusFilter] = useState<FocusFilter>('all');

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === TaskStatus.Completed).length;
    const inProgress = tasks.filter((t) => t.status === TaskStatus.InProgress).length;
    const inReview = tasks.filter((t) => t.status === TaskStatus.InReview).length;
    const open = total - completed;
    const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status === TaskStatus.Completed)).length;
    const dueToday = tasks.filter(
      (t) => t.status !== TaskStatus.Completed && isDueToday(t.dueDate)
    ).length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, inReview, open, overdue, dueToday, completionPct };
  }, [tasks]);

  const priorityQueue = useMemo(() => {
    const active = tasks.filter((t) => t.status !== TaskStatus.Completed);
    const filtered = active.filter((t) => {
      if (focusFilter === 'urgent') {
        return t.priority === TaskPriority.Urgent || t.priority === TaskPriority.High;
      }
      if (focusFilter === 'today') {
        return t.dueDate <= TODAY_ISO;
      }
      return true;
    });

    const priorityRank: Record<TaskPriority, number> = {
      [TaskPriority.Urgent]: 0,
      [TaskPriority.High]: 1,
      [TaskPriority.Medium]: 2,
      [TaskPriority.Low]: 3,
    };

    return [...filtered]
      .sort((a, b) => {
        const pDiff = priorityRank[a.priority] - priorityRank[b.priority];
        if (pDiff !== 0) return pDiff;
        return a.dueDate.localeCompare(b.dueDate);
      })
      .slice(0, 6);
  }, [tasks, focusFilter]);

  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter((t) => t.status !== TaskStatus.Completed)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 4);
  }, [tasks]);

  const maxBar = Math.max(...WEEKLY_THROUGHPUT.map((d) => Math.max(d.completed, d.planned)), 1);

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-[28px] font-bold tracking-[-0.02em] text-[#0F172A] text-balance">
            Sprint 24 Overview
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Nov 16 – Nov 30 · {stats.open} open items across {projects.length} active workstreams
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateView('board')}
            className="h-9 px-3.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] text-[#0F172A] text-sm font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Open Board</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
          </button>
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-level-1">
          <div className="flex items-center justify-between text-xs font-medium text-[#64748B]">
            <span>Open Tasks</span>
            <Clock className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-3xl font-bold text-[#0F172A] tabular-nums">
              {stats.open}
            </span>
            <span className="text-xs text-[#64748B] tabular-nums">
              of {stats.total} total
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-level-1">
          <div className="flex items-center justify-between text-xs font-medium text-[#64748B]">
            <span>In Progress</span>
            <Flame className="w-4 h-4 text-[#6D28D9]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-3xl font-bold text-[#0F172A] tabular-nums">
              {stats.inProgress}
            </span>
            <span className="text-xs text-[#6D28D9] font-medium tabular-nums">
              {stats.inReview} in review
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-level-1">
          <div className="flex items-center justify-between text-xs font-medium text-[#64748B]">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-3xl font-bold text-[#0F172A] tabular-nums">
              {stats.completed}
            </span>
            <span className="text-xs text-[#047857] font-medium tabular-nums">
              {stats.completionPct}% sprint done
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-level-1">
          <div className="flex items-center justify-between text-xs font-medium text-[#64748B]">
            <span>Due Soon / Overdue</span>
            <Calendar className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-3xl font-bold text-[#0F172A] tabular-nums">
              {stats.dueToday + stats.overdue}
            </span>
            <span
              className={`text-xs font-medium tabular-nums ${
                stats.overdue > 0 ? 'text-[#B91C1C]' : 'text-[#64748B]'
              }`}
            >
              {stats.overdue} overdue · {stats.dueToday} today
            </span>
          </div>
        </div>
      </div>

      {/* Sprint Progress & Weekly Throughput */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-level-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-semibold text-[#0F172A]">
                  Sprint Delivery Progress
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Completion rate across active Sprint 24 deliverables
                </p>
              </div>
              <span className="font-mono text-lg font-semibold text-[#7C3AED] tabular-nums">
                {stats.completionPct}%
              </span>
            </div>

            <div className="mt-4">
              <ProgressTracker value={stats.completed} max={stats.total} />
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#F1F5F9] grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-[#64748B]">Backlog</p>
              <p className="font-mono text-lg font-semibold text-[#0F172A] tabular-nums mt-0.5">
                {tasks.filter((t) => t.status === TaskStatus.Backlog).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">In Progress</p>
              <p className="font-mono text-lg font-semibold text-[#6D28D9] tabular-nums mt-0.5">
                {stats.inProgress}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">In Review</p>
              <p className="font-mono text-lg font-semibold text-[#B45309] tabular-nums mt-0.5">
                {stats.inReview}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Completed</p>
              <p className="font-mono text-lg font-semibold text-[#047857] tabular-nums mt-0.5">
                {stats.completed}
              </p>
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-level-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-[#0F172A]">
                Weekly Throughput
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">Completed vs. planned tasks</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#64748B]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#7C3AED]" />
                Done
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#E2E8F0]" />
                Planned
              </span>
            </div>
          </div>

          <div className="mt-5 h-28 flex items-end justify-between gap-2.5">
            {WEEKLY_THROUGHPUT.map((d) => {
              const plannedHeight = Math.round((d.planned / maxBar) * 100);
              const completedHeight = Math.round((d.completed / maxBar) * 100);
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full max-w-[32px] flex items-end gap-1 h-20">
                    <div
                      className="flex-1 bg-[#E2E8F0] rounded-t-sm transition-all"
                      style={{ height: `${plannedHeight}%` }}
                      title={`${d.day}: ${d.planned} planned`}
                    />
                    <div
                      className="flex-1 bg-[#7C3AED] rounded-t-sm transition-all"
                      style={{ height: `${completedHeight}%` }}
                      title={`${d.day}: ${d.completed} completed`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-[#64748B]">{d.day}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Main Split: Priority Queue & Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Queue */}
        <section className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl shadow-level-1 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-[#0F172A]">Priority Queue</h2>
              <p className="text-xs text-[#64748B]">Check off completed work or inspect details</p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-lg">
              {(
                [
                  { id: 'all', label: 'All Open' },
                  { id: 'urgent', label: 'High & Urgent' },
                  { id: 'today', label: 'Due Today' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFocusFilter(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    focusFilter === tab.id
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {priorityQueue.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-[#0F172A]">No open tasks match this filter</p>
              <p className="text-xs text-[#64748B] mt-1">
                Switch tabs or add a new task to populate your queue.
              </p>
              <button
                type="button"
                onClick={onOpenNewTask}
                className="mt-4 h-9 px-4 bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#7C3AED] text-xs font-semibold rounded-lg transition-colors"
              >
                Create Task
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {priorityQueue.map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                const assignee = team.find((m) => m.id === task.assigneeId);
                const overdue = isOverdue(task.dueDate, false);

                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5">
                        <TaskCheckbox
                          checked={task.status === TaskStatus.Completed}
                          onChange={() => onToggleTaskComplete(task.id)}
                          ariaLabel={`Mark ${task.title} as completed`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] truncate">{task.title}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[#64748B] flex-wrap">
                          <span className="font-mono text-[11px]">{task.key}</span>
                          {project && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{project.name}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <StatusLabel status={task.status} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <PriorityLabel priority={task.priority} />
                      <span
                        className={`font-mono text-xs tabular-nums whitespace-nowrap ${
                          overdue ? 'text-[#B91C1C] font-semibold' : 'text-[#64748B]'
                        }`}
                      >
                        {formatShortDate(task.dueDate)}
                      </span>
                      <Avatar member={assignee} size="xs" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-6 py-3 border-t border-[#F1F5F9] bg-[#F8FAFC]/60 flex justify-end">
            <button
              type="button"
              onClick={() => onNavigateView('tasks')}
              className="text-xs font-semibold text-[#7C3AED] hover:text-[#630ED4] inline-flex items-center gap-1"
            >
              <span>View all {tasks.length} tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Right Column: Projects Progress & Upcoming Deadlines */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-level-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold text-[#0F172A]">
                Active Workstreams
              </h2>
              <button
                type="button"
                onClick={() => onNavigateView('projects')}
                className="text-xs font-semibold text-[#7C3AED] hover:text-[#630ED4]"
              >
                Manage
              </button>
            </div>

            <div className="space-y-4">
              {projects.map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const doneCount = projectTasks.filter(
                  (t) => t.status === TaskStatus.Completed
                ).length;
                const pct =
                  projectTasks.length > 0
                    ? Math.round((doneCount / projectTasks.length) * 100)
                    : 0;

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      onSelectProject(project.id);
                      onNavigateView('board');
                    }}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-[#0F172A] group-hover:text-[#7C3AED] transition-colors">
                        {project.name}
                      </span>
                      <span className="font-mono text-xs text-[#64748B] tabular-nums">
                        {doneCount}/{projectTasks.length} · {pct}%
                      </span>
                    </div>
                    <ProgressTracker value={doneCount} max={projectTasks.length || 1} />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-level-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold text-[#0F172A]">
                Upcoming Deadlines
              </h2>
              <button
                type="button"
                onClick={() => onNavigateView('schedule')}
                className="text-xs font-semibold text-[#7C3AED] hover:text-[#630ED4]"
              >
                Schedule
              </button>
            </div>

            <div className="divide-y divide-[#F1F5F9]">
              {upcomingDeadlines.map((task) => {
                const overdue = isOverdue(task.dueDate, false);
                const today = isDueToday(task.dueDate);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onSelectTask(task)}
                    className="w-full py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{task.title}</p>
                      <p className="text-xs text-[#64748B] mt-0.5 font-mono">{task.key}</p>
                    </div>
                    <span
                      className={`font-mono text-xs tabular-nums whitespace-nowrap shrink-0 ${
                        overdue
                          ? 'text-[#B91C1C] font-semibold'
                          : today
                          ? 'text-[#B45309] font-semibold'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {overdue ? `Overdue · ${formatShortDate(task.dueDate)}` : today ? 'Today' : formatShortDate(task.dueDate)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
