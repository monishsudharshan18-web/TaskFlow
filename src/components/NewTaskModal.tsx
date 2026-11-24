import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { TODAY_ISO } from '../data/initialData';
import { ProjectItem, TaskItem, TaskPriority, TaskStatus, TeamMember } from '../types/taskflow';

interface NewTaskModalProps {
  isOpen: boolean;
  defaultStatus?: TaskStatus;
  defaultDate?: string;
  defaultProjectId?: string;
  projects: ProjectItem[];
  team: TeamMember[];
  nextKeyNumber: number;
  onClose: () => void;
  onCreateTask: (task: TaskItem) => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  defaultStatus = TaskStatus.Backlog,
  defaultDate = TODAY_ISO,
  defaultProjectId,
  projects,
  team,
  nextKeyNumber,
  onClose,
  onCreateTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
  const [projectId, setProjectId] = useState<string>(defaultProjectId || projects[0]?.id || 'p1');
  const [assigneeId, setAssigneeId] = useState<string>(team[0]?.id || 'm1');
  const [dueDate, setDueDate] = useState<string>(defaultDate);
  const [estimateHours, setEstimateHours] = useState<number>(4);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority(TaskPriority.Medium);
      setProjectId(defaultProjectId || projects[0]?.id || 'p1');
      setAssigneeId(team[0]?.id || 'm1');
      setDueDate(defaultDate || TODAY_ISO);
      setEstimateHours(4);
      setError('');
    }
  }, [isOpen, defaultStatus, defaultDate, defaultProjectId, projects, team]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Please enter a task title.');
      return;
    }

    const newTask: TaskItem = {
      id: `t-${Date.now()}`,
      key: `TF-${nextKeyNumber}`,
      title: trimmed,
      description: description.trim(),
      status,
      priority,
      projectId,
      assigneeId,
      dueDate: dueDate || TODAY_ISO,
      estimateHours: Math.max(1, Number(estimateHours) || 2),
      subtasks: [],
      comments: [],
      updatedAt: new Date().toISOString(),
    };

    onCreateTask(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#0F172A]/35 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-title"
        className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-level-3 border border-[#E2E8F0] overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div>
            <h2 id="new-task-title" className="font-display text-lg font-bold text-[#0F172A]">
              Create New Task
            </h2>
            <p className="text-xs text-[#64748B] font-mono">TF-{nextKeyNumber}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="task-title-input" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
              Task Title
            </label>
            <input
              id="task-title-input"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., Implement webhook signature verification"
              className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] tf-focus-ring"
            />
            {error && <p className="mt-1.5 text-xs font-medium text-[#B91C1C]">{error}</p>}
          </div>

          <div>
            <label htmlFor="task-desc-input" className="block text-xs font-semibold text-[#0F172A] mb-1.5">
              Description
            </label>
            <textarea
              id="task-desc-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline scope, requirements, or acceptance criteria..."
              className="w-full p-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] tf-focus-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] tf-focus-ring"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] tf-focus-ring"
              >
                {team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] tf-focus-ring"
              >
                <option value={TaskStatus.Backlog}>Backlog</option>
                <option value={TaskStatus.InProgress}>In Progress</option>
                <option value={TaskStatus.InReview}>In Review</option>
                <option value={TaskStatus.Completed}>Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] tf-focus-ring"
              >
                <option value={TaskPriority.Urgent}>Urgent</option>
                <option value={TaskPriority.High}>High</option>
                <option value={TaskPriority.Medium}>Medium</option>
                <option value={TaskPriority.Low}>Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F172A] tf-focus-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Estimate (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={estimateHours}
                onChange={(e) => setEstimateHours(Number(e.target.value))}
                className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-lg text-sm font-mono text-[#0F172A] tf-focus-ring"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-sm font-semibold rounded-lg transition-colors shadow-level-1"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
