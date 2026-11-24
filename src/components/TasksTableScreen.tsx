import React, { useMemo, useState } from 'react';
import { ArrowUpDown, CheckCircle2, Trash2 } from 'lucide-react';
import { ProjectItem, TaskItem, TaskPriority, TaskStatus, TeamMember } from '../types/taskflow';
import { formatShortDate, isOverdue } from '../utils/dateUtils';
import { Avatar } from './Avatar';
import { PriorityLabel, STATUS_META, TaskCheckbox } from './StatusControls';

interface TasksTableScreenProps {
  tasks: TaskItem[];
  projects: ProjectItem[];
  team: TeamMember[];
  onSelectTask: (task: TaskItem) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onBulkUpdateStatus: (taskIds: string[], status: TaskStatus) => void;
  onBulkDelete: (taskIds: string[]) => void;
  onOpenNewTask: () => void;
}

type SortField = 'dueDate' | 'priority' | 'title' | 'status';

const PRIORITY_RANK: Record<TaskPriority, number> = {
  [TaskPriority.Urgent]: 0,
  [TaskPriority.High]: 1,
  [TaskPriority.Medium]: 2,
  [TaskPriority.Low]: 3,
};

export const TasksTableScreen: React.FC<TasksTableScreenProps> = ({
  tasks,
  projects,
  team,
  onSelectTask,
  onUpdateTaskStatus,
  onBulkUpdateStatus,
  onBulkDelete,
  onOpenNewTask,
}) => {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortField>('dueDate');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredTasks = useMemo(() => {
    const list = tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'dueDate') {
        cmp = a.dueDate.localeCompare(b.dueDate);
      } else if (sortBy === 'priority') {
        cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      } else if (sortBy === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortBy === 'status') {
        cmp = a.status.localeCompare(b.status);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [tasks, statusFilter, priorityFilter, sortBy, sortAsc]);

  const allSelected =
    filteredTasks.length > 0 && filteredTasks.every((t) => selectedIds.includes(t.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTasks.map((t) => t.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-[#0F172A]">
            Task List
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5 tabular-nums">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-white border border-[#E2E8F0] rounded-lg overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All' },
                { id: TaskStatus.Backlog, label: 'Backlog' },
                { id: TaskStatus.InProgress, label: 'In Progress' },
                { id: TaskStatus.InReview, label: 'In Review' },
                { id: TaskStatus.Completed, label: 'Completed' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-[#EDE9FE] text-[#7C3AED] font-semibold'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            aria-label="Filter by priority"
            className="h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#0F172A] tf-focus-ring"
          >
            <option value="all">All Priorities</option>
            <option value={TaskPriority.Urgent}>Urgent</option>
            <option value={TaskPriority.High}>High</option>
            <option value={TaskPriority.Medium}>Medium</option>
            <option value={TaskPriority.Low}>Low</option>
          </select>
        </div>
      </div>

      {/* Contextual Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#EDE9FE] border border-[#DDD6FE] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[#5B21B6] tabular-nums">
            {selectedIds.length} task{selectedIds.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onBulkUpdateStatus(selectedIds, TaskStatus.Completed);
                setSelectedIds([]);
              }}
              className="h-8 px-3 bg-white hover:bg-[#F8FAFC] text-[#047857] text-xs font-semibold rounded-lg border border-[#E2E8F0] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Completed</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onBulkUpdateStatus(selectedIds, TaskStatus.InProgress);
                setSelectedIds([]);
              }}
              className="h-8 px-3 bg-white hover:bg-[#F8FAFC] text-[#6D28D9] text-xs font-semibold rounded-lg border border-[#E2E8F0] whitespace-nowrap"
            >
              Move to In Progress
            </button>
            <button
              type="button"
              onClick={() => {
                onBulkDelete(selectedIds);
                setSelectedIds([]);
              }}
              className="h-8 px-3 bg-white hover:bg-[#FEF2F2] text-[#B91C1C] text-xs font-semibold rounded-lg border border-[#E2E8F0] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="h-8 px-2.5 text-xs font-medium text-[#5B21B6] hover:underline whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* High-Density Task Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-level-1 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-base font-semibold text-[#0F172A]">
              No matching tasks found
            </p>
            <p className="text-sm text-[#64748B] mt-1">
              Adjust your active status or priority filters, or create a new task.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                }}
                className="h-9 px-4 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-semibold rounded-lg"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={onOpenNewTask}
                className="h-9 px-4 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-semibold rounded-lg"
              >
                New Task
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="h-9 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
                  <th className="w-12 pl-5 pr-2">
                    <TaskCheckbox
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      ariaLabel="Select all visible tasks"
                    />
                  </th>
                  <th className="px-3">
                    <button
                      type="button"
                      onClick={() => handleSort('title')}
                      className="inline-flex items-center gap-1 hover:text-[#0F172A]"
                    >
                      <span>Task</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-3 w-40">
                    <button
                      type="button"
                      onClick={() => handleSort('status')}
                      className="inline-flex items-center gap-1 hover:text-[#0F172A]"
                    >
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-3 w-28">
                    <button
                      type="button"
                      onClick={() => handleSort('priority')}
                      className="inline-flex items-center gap-1 hover:text-[#0F172A]"
                    >
                      <span>Priority</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-3 w-36">Project</th>
                  <th className="px-3 w-40">Assignee</th>
                  <th className="px-3 w-28 text-right">Subtasks</th>
                  <th className="pl-3 pr-5 w-28 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('dueDate')}
                      className="inline-flex items-center gap-1 hover:text-[#0F172A]"
                    >
                      <span>Due</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredTasks.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  const assignee = team.find((m) => m.id === task.assigneeId);
                  const isSelected = selectedIds.includes(task.id);
                  const completedSubs = task.subtasks.filter((s) => s.completed).length;
                  const overdue = isOverdue(task.dueDate, task.status === TaskStatus.Completed);

                  return (
                    <tr
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className={`h-[52px] cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#EDE9FE]/35' : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <td className="pl-5 pr-2" onClick={(e) => e.stopPropagation()}>
                        <TaskCheckbox
                          checked={isSelected}
                          onChange={() => toggleSelectRow(task.id)}
                          ariaLabel={`Select ${task.title}`}
                        />
                      </td>
                      <td className="px-3 max-w-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-xs text-[#64748B] shrink-0">
                            {task.key}
                          </span>
                          <span
                            className={`text-sm font-medium truncate ${
                              task.status === TaskStatus.Completed
                                ? 'text-[#64748B] line-through'
                                : 'text-[#0F172A]'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.status}
                          onChange={(e) =>
                            onUpdateTaskStatus(task.id, e.target.value as TaskStatus)
                          }
                          aria-label={`Change status for ${task.title}`}
                          className={`h-7 px-2 rounded-md border border-[#E2E8F0] bg-white text-xs font-medium tf-focus-ring ${
                            STATUS_META[task.status].textClass
                          }`}
                        >
                          <option value={TaskStatus.Backlog}>Backlog</option>
                          <option value={TaskStatus.InProgress}>In Progress</option>
                          <option value={TaskStatus.InReview}>In Review</option>
                          <option value={TaskStatus.Completed}>Completed</option>
                        </select>
                      </td>
                      <td className="px-3">
                        <PriorityLabel priority={task.priority} />
                      </td>
                      <td className="px-3 text-xs font-medium text-[#475569] truncate">
                        {project ? project.name : '—'}
                      </td>
                      <td className="px-3">
                        <Avatar member={assignee} size="xs" showName />
                      </td>
                      <td className="px-3 text-right font-mono text-xs text-[#64748B] tabular-nums">
                        {task.subtasks.length > 0
                          ? `${completedSubs}/${task.subtasks.length}`
                          : '—'}
                      </td>
                      <td
                        className={`pl-3 pr-5 text-right font-mono text-xs tabular-nums whitespace-nowrap ${
                          overdue ? 'text-[#B91C1C] font-semibold' : 'text-[#64748B]'
                        }`}
                      >
                        {formatShortDate(task.dueDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
