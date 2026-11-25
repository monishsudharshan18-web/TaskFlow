import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_TEAM } from '../src/data/initialData.js';
import { TaskItem, TaskPriority, TaskStatus } from '../src/types/taskflow.js';

dotenv.config();

// Supabase configuration from environment
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

let supabaseClient: SupabaseClient | null = null;
let isConfigured = false;

if (SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('your-project-id')) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
      },
    });
    isConfigured = true;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize client:', err);
    supabaseClient = null;
    isConfigured = false;
  }
}

// In-Memory store fallback when Supabase is not configured yet
class InMemoryStore {
  private tasks: TaskItem[] = [...INITIAL_TASKS];
  private projects = [...INITIAL_PROJECTS];
  private team = [...INITIAL_TEAM];

  getTasks(projectId?: string, search?: string): TaskItem[] {
    let result = [...this.tasks];
    if (projectId && projectId !== 'all') {
      result = result.filter((t) => t.projectId === projectId);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.key.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return result;
  }

  getTaskById(id: string): TaskItem | null {
    return this.tasks.find((t) => t.id === id) || null;
  }

  createTask(task: TaskItem): TaskItem {
    const existingIndex = this.tasks.findIndex((t) => t.id === task.id || t.key === task.key);
    if (existingIndex >= 0) {
      this.tasks[existingIndex] = task;
    } else {
      this.tasks.unshift(task);
    }
    return task;
  }

  updateTask(id: string, updates: Partial<TaskItem>): TaskItem | null {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    const updated = {
      ...this.tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.tasks[index] = updated;
    return updated;
  }

  deleteTask(id: string): boolean {
    const prevLen = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    return this.tasks.length < prevLen;
  }

  bulkUpdateStatus(ids: string[], status: TaskStatus): number {
    let count = 0;
    const idSet = new Set(ids);
    this.tasks = this.tasks.map((t) => {
      if (idSet.has(t.id)) {
        count++;
        return { ...t, status, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    return count;
  }

  bulkDelete(ids: string[]): number {
    const idSet = new Set(ids);
    const prevLen = this.tasks.length;
    this.tasks = this.tasks.filter((t) => !idSet.has(t.id));
    return prevLen - this.tasks.length;
  }

  getProjects() {
    return this.projects;
  }

  getTeam() {
    return this.team;
  }

  reset() {
    this.tasks = [...INITIAL_TASKS];
    this.projects = [...INITIAL_PROJECTS];
    this.team = [...INITIAL_TEAM];
  }
}

const memoryStore = new InMemoryStore();

// Conversion helpers between DB schema (snake_case) and TypeScript model (camelCase)
function mapDbTaskToTaskItem(row: any): TaskItem {
  return {
    id: row.id,
    key: row.key,
    title: row.title,
    description: row.description || '',
    status: (row.status as TaskStatus) || TaskStatus.Backlog,
    priority: (row.priority as TaskPriority) || TaskPriority.Medium,
    projectId: row.project_id || row.projectId || '',
    assigneeId: row.assignee_id || row.assigneeId || '',
    dueDate: row.due_date || row.dueDate || '',
    estimateHours: Number(row.estimate_hours ?? row.estimateHours ?? 0),
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

function mapTaskItemToDbRow(task: Partial<TaskItem>): any {
  const row: any = {};
  if (task.id !== undefined) row.id = task.id;
  if (task.key !== undefined) row.key = task.key;
  if (task.title !== undefined) row.title = task.title;
  if (task.description !== undefined) row.description = task.description;
  if (task.status !== undefined) row.status = task.status;
  if (task.priority !== undefined) row.priority = task.priority;
  if (task.projectId !== undefined) row.project_id = task.projectId;
  if (task.assigneeId !== undefined) row.assignee_id = task.assigneeId;
  if (task.dueDate !== undefined) row.due_date = task.dueDate || null;
  if (task.estimateHours !== undefined) row.estimate_hours = task.estimateHours;
  if (task.subtasks !== undefined) row.subtasks = task.subtasks;
  if (task.comments !== undefined) row.comments = task.comments;
  row.updated_at = new Date().toISOString();
  return row;
}

export const dbService = {
  isSupabaseConfigured(): boolean {
    return isConfigured && supabaseClient !== null;
  },

  getSupabaseClient(): SupabaseClient | null {
    return supabaseClient;
  },

  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    if (!this.isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase credentials not configured. Operating in local in-memory fallback mode.',
      };
    }

    try {
      const { data, error } = await supabaseClient!.from('tasks').select('count').limit(1);
      if (error) {
        return {
          success: false,
          message: `Connected to Supabase URL, but database error: ${error.message}. (Did you run supabase/schema.sql?)`,
          details: error,
        };
      }
      return {
        success: true,
        message: 'Successfully connected to Supabase database!',
        details: data,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection failed: ${err.message || 'Unknown network error'}`,
        details: err,
      };
    }
  },

  async getTasks(projectId?: string, search?: string): Promise<TaskItem[]> {
    if (!this.isSupabaseConfigured()) {
      return memoryStore.getTasks(projectId, search);
    }

    try {
      let query = supabaseClient!.from('tasks').select('*').order('created_at', { ascending: false });
      if (projectId && projectId !== 'all') {
        query = query.eq('project_id', projectId);
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,key.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[Supabase] getTasks error:', error.message);
        return memoryStore.getTasks(projectId, search);
      }
      return (data || []).map(mapDbTaskToTaskItem);
    } catch (err) {
      console.error('[Supabase] getTasks exception:', err);
      return memoryStore.getTasks(projectId, search);
    }
  },

  async getTaskById(id: string): Promise<TaskItem | null> {
    if (!this.isSupabaseConfigured()) {
      return memoryStore.getTaskById(id);
    }

    try {
      const { data, error } = await supabaseClient!.from('tasks').select('*').eq('id', id).single();
      if (error || !data) return null;
      return mapDbTaskToTaskItem(data);
    } catch (err) {
      return memoryStore.getTaskById(id);
    }
  },

  async createTask(task: TaskItem): Promise<TaskItem> {
    if (!this.isSupabaseConfigured()) {
      return memoryStore.createTask(task);
    }

    try {
      const dbRow = mapTaskItemToDbRow(task);
      const { data, error } = await supabaseClient!
        .from('tasks')
        .upsert(dbRow, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('[Supabase] createTask error:', error.message);
        return memoryStore.createTask(task);
      }
      return mapDbTaskToTaskItem(data);
    } catch (err) {
      console.error('[Supabase] createTask exception:', err);
      return memoryStore.createTask(task);
    }
  },

  async updateTask(id: string, updates: Partial<TaskItem>): Promise<TaskItem | null> {
    if (!this.isSupabaseConfigured()) {
      return memoryStore.updateTask(id, updates);
    }

    try {
      const dbRow = mapTaskItemToDbRow(updates);
      const { data, error } = await supabaseClient!
        .from('tasks')
        .update(dbRow)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Supabase] updateTask error:', error.message);
        return memoryStore.updateTask(id, updates);
      }
      return mapDbTaskToTaskItem(data);
    } catch (err) {
      console.error('[Supabase] updateTask exception:', err);
      return memoryStore.updateTask(id, updates);
    }
  },

  async deleteTask(id: string): Promise<boolean> {
    if (!this.isSupabaseConfigured()) {
      return memoryStore.deleteTask(id);
    }

    try {
      const { error } = await supabaseClient!.from('tasks').delete().eq('id', id);
      if (error) {
        console.error('[Supabase] deleteTask error:', error.message);
        return memoryStore.deleteTask(id);
      }
      return true;
    } catch (err) {
      console.error('[Supabase] deleteTask exception:', err);
      return memoryStore.deleteTask(id);
    }
  },

  async bulkUpdateStatus(ids: string[], status: TaskStatus): Promise<number> {
    if (!this.isSupabaseConfigured()) {
      return memoryStore.bulkUpdateStatus(ids, status);
    }

    try {
      const { data, error } = await supabaseClient!
        .from('tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', ids)
        .select();

      if (error) {
        console.error('[Supabase] bulkUpdateStatus error:', error.message);
        return memoryStore.bulkUpdateStatus(ids, status);
      }
      return data?.length ?? ids.length;
    } catch (err) {
      return memoryStore.bulkUpdateStatus(ids, status);
    }
  },

  async bulkDelete(ids: string[]): Promise<number> {
    if (!this.isSupabaseConfigured()) {
      return memoryStore.bulkDelete(ids);
    }

    try {
      const { error } = await supabaseClient!.from('tasks').delete().in('id', ids);
      if (error) {
        console.error('[Supabase] bulkDelete error:', error.message);
        return memoryStore.bulkDelete(ids);
      }
      return ids.length;
    } catch (err) {
      return memoryStore.bulkDelete(ids);
    }
  },

  async getProjects() {
    if (!this.isSupabaseConfigured()) {
      return memoryStore.getProjects();
    }

    try {
      const { data, error } = await supabaseClient!.from('projects').select('*').order('name');
      if (error || !data || data.length === 0) return memoryStore.getProjects();
      return data.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        description: p.description || '',
        leadId: p.lead_id || p.leadId || '',
        targetDate: p.target_date || p.targetDate || '',
      }));
    } catch {
      return memoryStore.getProjects();
    }
  },

  async getTeam() {
    if (!this.isSupabaseConfigured()) {
      return memoryStore.getTeam();
    }

    try {
      const { data, error } = await supabaseClient!.from('team_members').select('*');
      if (error || !data || data.length === 0) return memoryStore.getTeam();
      return data.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        initials: m.initials,
        avatarBg: m.avatar_bg || m.avatarBg || '#E0F2FE',
        avatarText: m.avatar_text || m.avatarText || '#0369A1',
        weeklyCapacityHours: Number(m.weekly_capacity_hours ?? m.weeklyCapacityHours ?? 40),
      }));
    } catch {
      return memoryStore.getTeam();
    }
  },

  async seedData(): Promise<{ success: boolean; message: string }> {
    if (!this.isSupabaseConfigured()) {
      memoryStore.reset();
      return { success: true, message: 'Local data store reset with initial seed data.' };
    }

    try {
      // 1. Projects
      for (const p of INITIAL_PROJECTS) {
        await supabaseClient!.from('projects').upsert({
          id: p.id,
          name: p.name,
          code: p.code,
          description: p.description,
          lead_id: p.leadId,
          target_date: p.targetDate,
        });
      }

      // 2. Team Members
      for (const m of INITIAL_TEAM) {
        await supabaseClient!.from('team_members').upsert({
          id: m.id,
          name: m.name,
          role: m.role,
          initials: m.initials,
          avatar_bg: m.avatarBg,
          avatar_text: m.avatarText,
          weekly_capacity_hours: m.weeklyCapacityHours,
        });
      }

      // 3. Tasks
      for (const t of INITIAL_TASKS) {
        await supabaseClient!.from('tasks').upsert(mapTaskItemToDbRow(t));
      }

      return { success: true, message: 'Successfully seeded projects, team members, and tasks to Supabase!' };
    } catch (err: any) {
      return { success: false, message: `Failed to seed Supabase: ${err.message}` };
    }
  },
};
