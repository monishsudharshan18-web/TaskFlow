import { useEffect, useMemo, useState, useCallback } from 'react';
import { INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_TEAM, TODAY_ISO } from './data/initialData';
import { TaskItem, TaskStatus, ViewType } from './types/taskflow';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { OverviewScreen } from './components/OverviewScreen';
import { BoardScreen } from './components/BoardScreen';
import { TasksTableScreen } from './components/TasksTableScreen';
import { ScheduleScreen } from './components/ScheduleScreen';
import { ProjectsTeamScreen } from './components/ProjectsTeamScreen';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { NewTaskModal } from './components/NewTaskModal';
import { SupabaseModal } from './components/SupabaseModal';
import { api } from './services/api';

const STORAGE_KEY = 'taskflow_workspace_tasks_v1';

export default function App() {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to initial seed data
    }
    return INITIAL_TASKS;
  });

  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [newTaskOpen, setNewTaskOpen] = useState<boolean>(false);
  const [newTaskDefaultStatus, setNewTaskDefaultStatus] = useState<TaskStatus>(TaskStatus.Backlog);
  const [newTaskDefaultDate, setNewTaskDefaultDate] = useState<string>(TODAY_ISO);

  // Sync to local storage backup
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Ignore storage quota issues
    }
  }, [tasks]);

  // Load tasks from backend / Supabase
  const loadTasksFromBackend = useCallback(async () => {
    setIsLoading(true);
    try {
      const [backendTasks, status] = await Promise.allSettled([
        api.getTasks(),
        api.getSupabaseStatus(),
      ]);

      if (backendTasks.status === 'fulfilled' && Array.isArray(backendTasks.value)) {
        setTasks(backendTasks.value);
      }
      if (status.status === 'fulfilled') {
        setSupabaseConnected(status.value.success);
      }
    } catch (err) {
      console.warn('Backend fetch error (using cached tasks):', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasksFromBackend();
  }, [loadTasksFromBackend]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (supabaseModalOpen) setSupabaseModalOpen(false);
        else if (newTaskOpen) setNewTaskOpen(false);
        else if (selectedTaskId) setSelectedTaskId(null);
        else if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [newTaskOpen, selectedTaskId, mobileMenuOpen, supabaseModalOpen]);

  const currentUser = INITIAL_TEAM[0];
  const selectedProject = useMemo(
    () => INITIAL_PROJECTS.find((p) => p.id === selectedProjectId),
    [selectedProjectId]
  );

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((t) => {
      if (selectedProjectId !== 'all' && t.projectId !== selectedProjectId) return false;
      if (q) {
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchKey = t.key.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        if (!matchTitle && !matchKey && !matchDesc) return false;
      }
      return true;
    });
  }, [tasks, selectedProjectId, searchQuery]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const nextKeyNumber = useMemo(() => {
    const maxNum = tasks.reduce((max, t) => {
      const num = parseInt(t.key.replace('TF-', ''), 10);
      return Number.isFinite(num) && num > max ? num : max;
    }, 252);
    return maxNum + 1;
  }, [tasks]);

  // CRUD Operation Handlers with Optimistic Updates & Backend Persistence
  const handleToggleTaskComplete = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const newStatus = target.status === TaskStatus.Completed ? TaskStatus.InProgress : TaskStatus.Completed;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );

    try {
      await api.updateTask(taskId, { status: newStatus });
    } catch (err) {
      console.error('Failed to sync complete toggle:', err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t
      )
    );

    try {
      await api.updateTask(taskId, { status });
    } catch (err) {
      console.error('Failed to update task status on server:', err);
    }
  };

  const handleBulkUpdateStatus = async (taskIds: string[], status: TaskStatus) => {
    const setIds = new Set(taskIds);
    setTasks((prev) =>
      prev.map((t) =>
        setIds.has(t.id) ? { ...t, status, updatedAt: new Date().toISOString() } : t
      )
    );

    try {
      await api.bulkUpdateStatus(taskIds, status);
    } catch (err) {
      console.error('Failed to bulk update status on server:', err);
    }
  };

  const handleBulkDelete = async (taskIds: string[]) => {
    const setIds = new Set(taskIds);
    setTasks((prev) => prev.filter((t) => !setIds.has(t.id)));
    if (selectedTaskId && setIds.has(selectedTaskId)) {
      setSelectedTaskId(null);
    }

    try {
      await api.bulkDelete(taskIds);
    } catch (err) {
      console.error('Failed to bulk delete tasks on server:', err);
    }
  };

  const handleUpdateTask = async (updated: TaskItem) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

    try {
      await api.updateTask(updated.id, updated);
    } catch (err) {
      console.error('Failed to update task on server:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskId === taskId) setSelectedTaskId(null);

    try {
      await api.deleteTask(taskId);
    } catch (err) {
      console.error('Failed to delete task on server:', err);
    }
  };

  const handleCreateTask = async (newTask: TaskItem) => {
    setTasks((prev) => [newTask, ...prev]);

    try {
      const created = await api.createTask(newTask);
      // Replace with server version if ID/timestamps changed
      setTasks((prev) => prev.map((t) => (t.id === newTask.id ? created : t)));
    } catch (err) {
      console.error('Failed to create task on server:', err);
    }
  };

  const handleResetData = async () => {
    setTasks(INITIAL_TASKS);
    setSelectedProjectId('all');
    setSearchQuery('');
    setSelectedTaskId(null);

    try {
      await api.seedData();
      await loadTasksFromBackend();
    } catch (err) {
      console.error('Failed to seed reset data:', err);
    }
  };

  const openNewTaskModal = (status = TaskStatus.Backlog, date = TODAY_ISO) => {
    setNewTaskDefaultStatus(status);
    setNewTaskDefaultDate(date);
    setNewTaskOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        projects={INITIAL_PROJECTS}
        tasks={tasks}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        currentUser={currentUser}
        onResetData={handleResetData}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          activeView={activeView}
          selectedProject={selectedProject}
          onClearProjectFilter={() => setSelectedProjectId('all')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenNewTask={() => openNewTaskModal(TaskStatus.Backlog, TODAY_ISO)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
          supabaseConnected={supabaseConnected}
        />

        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-[1440px] w-full mx-auto">
          {isLoading && (
            <div className="mb-4 px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 text-xs rounded-lg flex items-center justify-between">
              <span>Synchronizing workspace with backend...</span>
            </div>
          )}

          {activeView === 'overview' && (
            <OverviewScreen
              tasks={filteredTasks}
              projects={INITIAL_PROJECTS}
              team={INITIAL_TEAM}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
              onToggleTaskComplete={handleToggleTaskComplete}
              onNavigateView={setActiveView}
              onSelectProject={setSelectedProjectId}
              onOpenNewTask={() => openNewTaskModal(TaskStatus.Backlog, TODAY_ISO)}
            />
          )}

          {activeView === 'board' && (
            <BoardScreen
              tasks={filteredTasks}
              projects={INITIAL_PROJECTS}
              team={INITIAL_TEAM}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
              onMoveTaskStatus={handleUpdateTaskStatus}
              onQuickAddColumn={(status) => openNewTaskModal(status, TODAY_ISO)}
            />
          )}

          {activeView === 'tasks' && (
            <TasksTableScreen
              tasks={filteredTasks}
              projects={INITIAL_PROJECTS}
              team={INITIAL_TEAM}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              onBulkDelete={handleBulkDelete}
              onOpenNewTask={() => openNewTaskModal(TaskStatus.Backlog, TODAY_ISO)}
            />
          )}

          {activeView === 'schedule' && (
            <ScheduleScreen
              tasks={filteredTasks}
              projects={INITIAL_PROJECTS}
              team={INITIAL_TEAM}
              onSelectTask={(task) => setSelectedTaskId(task.id)}
              onQuickAddDate={(isoDate) => openNewTaskModal(TaskStatus.Backlog, isoDate)}
            />
          )}

          {activeView === 'projects' && (
            <ProjectsTeamScreen
              projects={INITIAL_PROJECTS}
              tasks={tasks}
              team={INITIAL_TEAM}
              onFilterByProject={setSelectedProjectId}
              onNavigateView={setActiveView}
            />
          )}
        </main>
      </div>

      <TaskDetailDrawer
        task={selectedTask}
        projects={INITIAL_PROJECTS}
        team={INITIAL_TEAM}
        currentUser={currentUser}
        onClose={() => setSelectedTaskId(null)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />

      <NewTaskModal
        isOpen={newTaskOpen}
        defaultStatus={newTaskDefaultStatus}
        defaultDate={newTaskDefaultDate}
        defaultProjectId={selectedProjectId === 'all' ? undefined : selectedProjectId}
        projects={INITIAL_PROJECTS}
        team={INITIAL_TEAM}
        nextKeyNumber={nextKeyNumber}
        onClose={() => setNewTaskOpen(false)}
        onCreateTask={handleCreateTask}
      />

      <SupabaseModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        onDataChanged={loadTasksFromBackend}
      />
    </div>
  );
}
