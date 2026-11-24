import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Send, Trash2, X } from 'lucide-react';
import { ProjectItem, TaskItem, TaskPriority, TaskStatus, TeamMember } from '../types/taskflow';
import { ProgressTracker, TaskCheckbox } from './StatusControls';
import { Avatar } from './Avatar';

interface TaskDetailDrawerProps {
  task: TaskItem | null;
  projects: ProjectItem[];
  team: TeamMember[];
  currentUser: TeamMember;
  onClose: () => void;
  onUpdateTask: (updated: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  projects,
  team,
  currentUser,
  onClose,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
    setNewSubtask('');
    setNewComment('');
  }, [task?.id]);

  if (!task) return null;

  const completedSubs = task.subtasks.filter((s) => s.completed).length;

  const handleToggleSubtask = (subId: string) => {
    const updatedSubs = task.subtasks.map((s) =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    onUpdateTask({ ...task, subtasks: updatedSubs, updatedAt: new Date().toISOString() });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubtask.trim();
    if (!trimmed) return;
    const updatedSubs = [
      ...task.subtasks,
      { id: `sub-${Date.now()}`, title: trimmed, completed: false },
    ];
    onUpdateTask({ ...task, subtasks: updatedSubs, updatedAt: new Date().toISOString() });
    setNewSubtask('');
  };

  const handleRemoveSubtask = (subId: string) => {
    const updatedSubs = task.subtasks.filter((s) => s.id !== subId);
    onUpdateTask({ ...task, subtasks: updatedSubs, updatedAt: new Date().toISOString() });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) return;
    const updatedComments = [
      ...task.comments,
      {
        id: `c-${Date.now()}`,
        authorId: currentUser.id,
        text: trimmed,
        createdAt: 'Just now',
      },
    ];
    onUpdateTask({ ...task, comments: updatedComments, updatedAt: new Date().toISOString() });
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0F172A]/25 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Inspector Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Inspect task ${task.key}`}
        className="relative z-10 w-full max-w-xl h-full bg-white shadow-level-3 border-l border-[#E2E8F0] flex flex-col"
      >
        {/* Top Drawer Bar */}
        <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <span className="font-mono font-semibold text-[#0F172A]">{task.key}</span>
            <span aria-hidden="true">·</span>
            <span>{projects.find((p) => p.id === task.projectId)?.name ?? 'Workspace'}</span>
          </div>

          <div className="flex items-center gap-2">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete task"
                className="h-8 px-2.5 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#B91C1C] hover:bg-[#FEF2F2] inline-flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  className="h-8 px-3 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold transition-colors"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="h-8 px-2.5 rounded-lg text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9]"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close inspector"
              className="w-8 h-8 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Editable Title */}
          <div>
            <input
              type="text"
              value={task.title}
              onChange={(e) =>
                onUpdateTask({ ...task, title: e.target.value, updatedAt: new Date().toISOString() })
              }
              aria-label="Task title"
              className="w-full font-display text-xl font-bold text-[#0F172A] bg-transparent border border-transparent hover:border-[#E2E8F0] focus:border-[#7C3AED] rounded-lg px-2 py-1 -mx-2 tf-focus-ring"
            />
          </div>

          {/* Metadata Properties Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#F1F5F9]">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B] mb-1.5">
                Status
              </label>
              <select
                value={task.status}
                onChange={(e) =>
                  onUpdateTask({
                    ...task,
                    status: e.target.value as TaskStatus,
                    updatedAt: new Date().toISOString(),
                  })
                }
                className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#0F172A] tf-focus-ring"
              >
                <option value={TaskStatus.Backlog}>Backlog</option>
                <option value={TaskStatus.InProgress}>In Progress</option>
                <option value={TaskStatus.InReview}>In Review</option>
                <option value={TaskStatus.Completed}>Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B] mb-1.5">
                Priority
              </label>
              <select
                value={task.priority}
                onChange={(e) =>
                  onUpdateTask({
                    ...task,
                    priority: e.target.value as TaskPriority,
                    updatedAt: new Date().toISOString(),
                  })
                }
                className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#0F172A] tf-focus-ring"
              >
                <option value={TaskPriority.Urgent}>Urgent</option>
                <option value={TaskPriority.High}>High</option>
                <option value={TaskPriority.Medium}>Medium</option>
                <option value={TaskPriority.Low}>Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B] mb-1.5">
                Assignee
              </label>
              <select
                value={task.assigneeId}
                onChange={(e) =>
                  onUpdateTask({
                    ...task,
                    assigneeId: e.target.value,
                    updatedAt: new Date().toISOString(),
                  })
                }
                className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#0F172A] tf-focus-ring"
              >
                {team.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B] mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={task.dueDate}
                  onChange={(e) =>
                    onUpdateTask({
                      ...task,
                      dueDate: e.target.value,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  className="w-full h-9 pl-9 pr-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F172A] tf-focus-ring"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B] mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={task.description}
              onChange={(e) =>
                onUpdateTask({
                  ...task,
                  description: e.target.value,
                  updatedAt: new Date().toISOString(),
                })
              }
              placeholder="Add implementation notes, acceptance criteria, or links..."
              className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] leading-relaxed placeholder:text-[#94A3B8] tf-focus-ring resize-y"
            />
          </div>

          {/* Subtasks Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
                Subtasks
              </span>
              {task.subtasks.length > 0 && (
                <span className="font-mono text-xs font-medium text-[#64748B] tabular-nums">
                  {completedSubs} of {task.subtasks.length} complete
                </span>
              )}
            </div>

            {task.subtasks.length > 0 && (
              <div className="mb-3">
                <ProgressTracker value={completedSubs} max={task.subtasks.length} />
              </div>
            )}

            <div className="divide-y divide-[#F1F5F9]">
              {task.subtasks.map((sub) => (
                <div key={sub.id} className="py-2.5 flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TaskCheckbox
                      checked={sub.completed}
                      onChange={() => handleToggleSubtask(sub.id)}
                      ariaLabel={`Toggle subtask ${sub.title}`}
                    />
                    <span
                      className={`text-sm truncate ${
                        sub.completed ? 'text-[#94A3B8] line-through' : 'text-[#0F172A]'
                      }`}
                    >
                      {sub.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(sub.id)}
                    aria-label={`Remove subtask ${sub.title}`}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-[#94A3B8] hover:text-[#B91C1C]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="mt-2.5 flex items-center gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a subtask..."
                className="flex-1 h-9 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] tf-focus-ring"
              />
              <button
                type="submit"
                disabled={!newSubtask.trim()}
                className="h-9 px-3 bg-[#EDE9FE] hover:bg-[#DDD6FE] disabled:opacity-50 text-[#7C3AED] text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Activity & Comments */}
          <div className="pt-4 border-t border-[#F1F5F9]">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B] mb-3">
              Comments ({task.comments.length})
            </h3>

            {task.comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {task.comments.map((comment) => {
                  const author = team.find((m) => m.id === comment.authorId);
                  return (
                    <div key={comment.id} className="flex items-start gap-2.5">
                      <Avatar member={author} size="sm" />
                      <div className="flex-1 bg-[#F8FAFC] rounded-xl px-3.5 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#0F172A]">
                            {author?.name ?? 'Team Member'}
                          </span>
                          <span className="text-[11px] text-[#94A3B8]">{comment.createdAt}</span>
                        </div>
                        <p className="text-sm text-[#334155] mt-1 leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <Avatar member={currentUser} size="sm" />
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write an update or comment..."
                className="flex-1 h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] tf-focus-ring"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                aria-label="Post comment"
                className="h-10 px-3.5 bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-50 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </div>
  );
};
