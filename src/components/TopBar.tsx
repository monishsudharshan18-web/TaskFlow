import React from 'react';
import { ChevronRight, Database, Menu, Plus, Search, X } from 'lucide-react';
import { ProjectItem, ViewType } from '../types/taskflow';

interface TopBarProps {
  activeView: ViewType;
  selectedProject?: ProjectItem;
  onClearProjectFilter: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onOpenNewTask: () => void;
  onOpenMobileMenu: () => void;
  onOpenSupabaseModal?: () => void;
  supabaseConnected?: boolean;
}

const VIEW_LABELS: Record<ViewType, string> = {
  overview: 'Overview',
  board: 'Kanban Board',
  tasks: 'Task List',
  schedule: 'Schedule',
  projects: 'Projects & Team',
};

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  selectedProject,
  onClearProjectFilter,
  searchQuery,
  onSearchChange,
  onOpenNewTask,
  onOpenMobileMenu,
  onOpenSupabaseModal,
  supabaseConnected = false,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0] px-4 sm:px-8 flex items-center justify-between gap-4 sm:gap-8">
      {/* Zone 1: Breadcrumb Context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 rounded-lg text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
          <span className="text-[#64748B] font-medium whitespace-nowrap hidden sm:inline">
            Workspace
          </span>
          <ChevronRight className="w-4 h-4 text-[#94A3B8] shrink-0 hidden sm:inline" />
          <span className="font-display font-semibold text-[#0F172A] whitespace-nowrap truncate">
            {VIEW_LABELS[activeView]}
          </span>
          {selectedProject && (
            <>
              <ChevronRight className="w-4 h-4 text-[#94A3B8] shrink-0" />
              <button
                type="button"
                onClick={onClearProjectFilter}
                title="Click to clear project filter"
                className="inline-flex items-center gap-1 text-[#7C3AED] hover:text-[#630ED4] font-medium whitespace-nowrap shrink-0"
              >
                <span>{selectedProject.name}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Zone 2 & 3: Global Search + Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative w-44 sm:w-72">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks, keys..."
            aria-label="Search tasks"
            className="w-full h-10 pl-9 pr-8 bg-white border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder:text-[#94A3B8] tf-focus-ring transition-shadow"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {onOpenSupabaseModal && (
          <button
            type="button"
            onClick={onOpenSupabaseModal}
            className={`h-10 px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-2 transition-all shrink-0 ${
              supabaseConnected
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] hover:bg-[#D1FAE5]'
                : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
            }`}
            title="Supabase Database Status & Setup"
          >
            <Database className={`w-3.5 h-3.5 ${supabaseConnected ? 'text-[#10B981]' : 'text-[#64748B]'}`} />
            <span className="hidden md:inline">
              {supabaseConnected ? 'Supabase Live' : 'Supabase Config'}
            </span>
            <span className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
          </button>
        )}

        <button
          type="button"
          onClick={onOpenNewTask}
          className="h-10 px-4 bg-[#7C3AED] hover:bg-[#8B5CF6] active:scale-[0.98] text-white text-sm font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all duration-150 whitespace-nowrap shrink-0 shadow-level-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
};
