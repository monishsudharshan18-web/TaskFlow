import React from 'react';
import {
  CalendarDays,
  FolderKanban,
  Kanban,
  LayoutDashboard,
  ListChecks,
  RotateCcw,
  X,
} from 'lucide-react';
import { ProjectItem, TaskItem, TaskStatus, TeamMember, ViewType } from '../types/taskflow';
import { Avatar } from './Avatar';

interface SidebarProps {
  activeView: ViewType;
  onSelectView: (view: ViewType) => void;
  projects: ProjectItem[];
  tasks: TaskItem[];
  selectedProjectId: string | 'all';
  onSelectProject: (projectId: string | 'all') => void;
  currentUser: TeamMember;
  onResetData: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: ViewType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'board', label: 'Kanban Board', icon: Kanban },
  { id: 'tasks', label: 'Task List', icon: ListChecks },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'projects', label: 'Projects & Team', icon: FolderKanban },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  projects,
  tasks,
  selectedProjectId,
  onSelectProject,
  currentUser,
  onResetData,
  mobileOpen,
  onCloseMobile,
}) => {
  const openCountForProject = (projectId: string) =>
    tasks.filter((t) => t.projectId === projectId && t.status !== TaskStatus.Completed).length;

  const totalOpenCount = tasks.filter((t) => t.status !== TaskStatus.Completed).length;

  const sidebarContent = (
    <aside className="w-64 h-full bg-white border-r border-[#E2E8F0] flex flex-col justify-between select-none">
      <div className="p-5 flex-1 overflow-y-auto">
        {/* Brand Zone */}
        <div className="flex items-center justify-between mb-7 px-2">
          <button
            type="button"
            onClick={() => {
              onSelectView('overview');
              onCloseMobile();
            }}
            className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] rounded-lg"
          >
            <span className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="7" height="16" rx="2" fill="#FFFFFF" />
                <rect x="14" y="4" width="7" height="10" rx="2" fill="#DDD6FE" />
                <rect x="14" y="16" width="7" height="4" rx="1.5" fill="#FFFFFF" />
              </svg>
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-[#0F172A] whitespace-nowrap shrink-0">
              TaskFlow
            </span>
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Navigation */}
        <nav aria-label="Primary Workspace" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] ${
                  isActive
                    ? 'bg-[#EDE9FE] text-[#7C3AED] font-semibold'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] font-medium'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-[#7C3AED]' : 'text-[#64748B]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Projects Filter Section */}
        <div className="mt-8 pt-6 border-t border-[#F1F5F9]">
          <div className="px-3 mb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
              Projects
            </span>
            <span className="font-mono text-[11px] font-medium text-[#64748B] tabular-nums">
              {totalOpenCount} open
            </span>
          </div>

          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onSelectProject('all');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 h-9 rounded-lg text-sm transition-colors duration-150 ${
                selectedProjectId === 'all'
                  ? 'bg-[#F8FAFC] text-[#0F172A] font-semibold'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] font-medium'
              }`}
            >
              <span className="truncate">All Projects</span>
              <span className="font-mono text-xs tabular-nums text-[#64748B]">{totalOpenCount}</span>
            </button>

            {projects.map((project) => {
              const isSelected = selectedProjectId === project.id;
              const openCount = openCountForProject(project.id);
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    onSelectProject(project.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 h-9 rounded-lg text-sm transition-colors duration-150 ${
                    isSelected
                      ? 'bg-[#EDE9FE] text-[#6D28D9] font-semibold'
                      : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] font-medium'
                  }`}
                >
                  <span className="truncate">{project.name}</span>
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isSelected ? 'text-[#6D28D9]' : 'text-[#64748B]'
                    }`}
                  >
                    {openCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Workspace User Footer */}
      <div className="p-4 border-t border-[#F1F5F9] space-y-2.5">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <Avatar member={currentUser} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#0F172A] truncate">{currentUser.name}</p>
            <p className="text-xs text-[#64748B] truncate">{currentUser.role}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetData}
          className="w-full flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 h-screen sticky top-0">{sidebarContent}</div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0F172A]/30 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
