import { ProjectItem, TaskItem, TaskPriority, TaskStatus, TeamMember } from '../types/taskflow';
import { INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_TEAM } from '../data/initialData';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export interface SupabaseStatusResponse {
  configured: boolean;
  success: boolean;
  message: string;
  details?: any;
}

export interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
  database: 'supabase' | 'local-in-memory';
  supabaseConfigured: boolean;
}

export const api = {
  // ==========================================
  // Health & Supabase Status
  // ==========================================
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  async getSupabaseStatus(): Promise<SupabaseStatusResponse> {
    const res = await fetch(`${BASE_URL}/api/supabase/status`);
    if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
    return res.json();
  },

  async seedData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/api/supabase/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Seed failed: ${res.statusText}`);
    return res.json();
  },

  // ==========================================
  // Projects & Team
  // ==========================================
  async getProjects(): Promise<ProjectItem[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/projects`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // Fallback
    }
    return INITIAL_PROJECTS;
  },

  async getTeam(): Promise<TeamMember[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/team`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // Fallback
    }
    return INITIAL_TEAM;
  },

  // ==========================================
  // Tasks CRUD
  // ==========================================
  async getTasks(projectId?: string, search?: string): Promise<TaskItem[]> {
    const params = new URLSearchParams();
    if (projectId && projectId !== 'all') params.append('projectId', projectId);
    if (search) params.append('search', search);

    const url = `${BASE_URL}/api/tasks${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load tasks: ${res.statusText}`);
    }
    return res.json();
  },

  async getTaskById(id: string): Promise<TaskItem> {
    const res = await fetch(`${BASE_URL}/api/tasks/${id}`);
    if (!res.ok) {
      throw new Error(`Task ${id} not found`);
    }
    return res.json();
  },

  async createTask(task: TaskItem): Promise<TaskItem> {
    const res = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create task: ${res.statusText}`);
    }
    return res.json();
  },

  async updateTask(id: string, updates: Partial<TaskItem>): Promise<TaskItem> {
    const res = await fetch(`${BASE_URL}/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update task: ${res.statusText}`);
    }
    return res.json();
  },

  async deleteTask(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/api/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete task ${id}`);
    }
  },

  async bulkUpdateStatus(taskIds: string[], status: TaskStatus): Promise<number> {
    const res = await fetch(`${BASE_URL}/api/tasks/bulk-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskIds, status }),
    });
    if (!res.ok) {
      throw new Error(`Failed to update status for tasks`);
    }
    const data = await res.json();
    return data.updatedCount;
  },

  async bulkDelete(taskIds: string[]): Promise<number> {
    const res = await fetch(`${BASE_URL}/api/tasks/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskIds }),
    });
    if (!res.ok) {
      throw new Error(`Failed to delete selected tasks`);
    }
    const data = await res.json();
    return data.deletedCount;
  },
};
