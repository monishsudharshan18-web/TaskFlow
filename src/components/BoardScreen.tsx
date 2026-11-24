import React, { useMemo, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { ProjectItem, TaskItem, TaskPriority, TaskStatus, TeamMember } from '../types/taskflow';
import { formatShortDate, isOverdue } from '../utils/dateUtils';
import { Avatar } from './Avatar';
import { PriorityLabel, ProgressTracker, STATUS_META } from './StatusControls';

interface BoardScreenProps {
  tasks: TaskItem[];
  projects: ProjectItem[];
  team: TeamMember[];
  onSelectTask: (task: TaskItem) => void;
  onMoveTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onQuickAddColumn: (status: TaskStatus) => void;
}

const COLUMNS: TaskStatus[] = [
  TaskStatus.Backlog,
  TaskStatus.InProgress,
  TaskStatus.InReview,
  TaskStatus.Completed,
];

export const BoardScreen: React.FC<BoardScreenProps> = ({
  tasks,
  projects,
  team,
  onSelectTask,
  onMoveTaskStatus,
  onQuickAddColumn,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (assigneeFilter !== 'all' && t.assigneeId !== assigneeFilter) return false;
      return true;
    });
  }, [tasks, priorityFilter, assigneeFilter]);

  const handleDrop = (e: React.DragEvent, colStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onMoveTaskStatus(taskId, colStatus);
    }
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Board Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-[#0F172A]">
            Kanban Board
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Drag cards across workflow columns or click any card to inspect subtasks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-white border border-[#E2E8F0] rounded-lg">
            {(
              [
                { id: 'all', label: 'All' },
                { id: TaskPriority.Urgent, label: 'Urgent' },
                { id: TaskPriority.High, label: 'High' },
                { id: TaskPriority.Medium, label: 'Medium' },
                { id: TaskPriority.Low, label: 'Low' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPriorityFilter(item.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  priorityFilter === item.id
                    ? 'bg-[#EDE9FE] text-[#7C3AED] font-semibold'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            aria-label="Filter by assignee"
            className="h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#0F172A] tf-focus-ring"
          >
            <option value="all">All Assignees</option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4-Column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
        {COLUMNS.map((colStatus) => {
          const meta = STATUS_META[colStatus];
          const colTasks = filteredTasks.filter((t) => t.status === colStatus);
          const isDropTarget = dragOverCol === colStatus;

          return (
            <section
              key={colStatus}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverCol !== colStatus) setDragOverCol(colStatus);
              }}
              onDragLeave={() => {
                if (dragOverCol === colStatus) setDragOverCol(null);
              }}
              onDrop={(e) => handleDrop(e, colStatus)}
              className={`rounded-2xl p-3 transition-colors duration-150 ${
                isDropTarget
                  ? 'bg-[#EDE9FE]/50 ring-2 ring-[#7C3AED]/30'
                  : 'bg-[#F1F5F9]/75'
              }`}
            >
              {/* Kanban Column Header */}
              <div className="flex items-center justify-between px-2 py-1.5 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="font-display text-[15px] font-semibold text-[#0F172A] truncate">
                    {meta.label}
                  </h2>
                  <span className="font-mono text-xs font-semibold text-[#6D28D9] bg-[#EDE9FE] px-2 py-0.5 rounded-md tabular-nums">
                    {colTasks.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onQuickAddColumn(colStatus)}
                  aria-label={`Add task to ${meta.label}`}
                  className="w-7 h-7 rounded-lg text-[#64748B] hover:text-[#7C3AED] hover:bg-white flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Column Cards */}
              <div className="space-y-3 min-h-[120px]">
                {colTasks.length === 0 ? (
                  <div className="border border-dashed border-[#CBD5E1] rounded-xl p-5 text-center">
                    <p className="text-xs text-[#64748B]">No tasks in {meta.label}</p>
                    <button
                      type="button"
                      onClick={() => onQuickAddColumn(colStatus)}
                      className="mt-2 text-xs font-semibold text-[#7C3AED] hover:text-[#630ED4]"
                    >
                      + Add task
                    </button>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const project = projects.find((p) => p.id === task.projectId);
                    const assignee = team.find((m) => m.id === task.assigneeId);
                    const completedSubs = task.subtasks.filter((s) => s.completed).length;
                    const totalSubs = task.subtasks.length;
                    const overdue = isOverdue(task.dueDate, task.status === TaskStatus.Completed);
                    const nextStatusIndex =
                      (COLUMNS.indexOf(task.status) + 1) % COLUMNS.length;
                    const nextStatus = COLUMNS[nextStatusIndex];

                    return (
                      <article
                        key={task.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedTaskId(task.id);
                          e.dataTransfer.setData('text/plain', task.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverCol(null);
                        }}
                        onClick={() => onSelectTask(task)}
                        className={`bg-white border border-[#E2E8F0] hover:border-[#DDD6FE] rounded-xl p-4 shadow-level-1 hover:shadow-level-2 transition-all duration-150 cursor-pointer group ${
                          draggedTaskId === task.id ? 'opacity-60 scale-[0.99]' : ''
                        }`}
                      >
                        {/* Quiet 1-line Kicker (Zero-Pill) */}
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[#64748B]">
                          <span className="truncate">
                            <span className="font-mono font-medium">{task.key}</span>
                            {project && (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span>{project.name}</span>
                              </>
                            )}
                          </span>

                          {colStatus !== TaskStatus.Completed && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveTaskStatus(task.id, nextStatus);
                              }}
                              title={`Advance to ${STATUS_META[nextStatus].label}`}
                              aria-label={`Move ${task.title} to ${STATUS_META[nextStatus].label}`}
                              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 -mr-1 rounded text-[#64748B] hover:text-[#7C3AED] hover:bg-[#EDE9FE] transition-all"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Task Title */}
                        <h3 className="mt-1.5 font-display text-[15px] font-semibold leading-snug text-[#0F172A] group-hover:text-[#630ED4] transition-colors">
                          {task.title}
                        </h3>

                        {/* Subtasks Progress */}
                        {totalSubs > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-1">
                              <span>Subtasks</span>
                              <span className="font-mono tabular-nums">
                                {completedSubs}/{totalSubs}
                              </span>
                            </div>
                            <ProgressTracker value={completedSubs} max={totalSubs} />
                          </div>
                        )}

                        {/* Card Footer */}
                        <div className="mt-3.5 pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                          <PriorityLabel priority={task.priority} />

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span
                              className={`font-mono text-[11px] tabular-nums ${
                                overdue ? 'text-[#B91C1C] font-semibold' : 'text-[#64748B]'
                              }`}
                            >
                              {formatShortDate(task.dueDate)}
                            </span>
                            <Avatar member={assignee} size="xs" />
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
