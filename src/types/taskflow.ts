export enum TaskStatus {
  Backlog = 'backlog',
  InProgress = 'in_progress',
  InReview = 'in_review',
  Completed = 'completed',
}

export enum TaskPriority {
  Urgent = 'urgent',
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export type ViewType = 'overview' | 'board' | 'tasks' | 'schedule' | 'projects';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarBg: string;
  avatarText: string;
  weeklyCapacityHours: number;
}

export interface ProjectItem {
  id: string;
  name: string;
  code: string;
  description: string;
  leadId: string;
  targetDate: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  key: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string;
  dueDate: string; // YYYY-MM-DD
  estimateHours: number;
  subtasks: Subtask[];
  comments: TaskComment[];
  updatedAt: string;
}
