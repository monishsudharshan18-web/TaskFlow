import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ProjectItem, TaskItem, TaskStatus, TeamMember, ViewType } from '../types/taskflow';
import { formatShortDate } from '../utils/dateUtils';
import { Avatar } from './Avatar';
import { ProgressTracker } from './StatusControls';

interface ProjectsTeamScreenProps {
  projects: ProjectItem[];
  tasks: TaskItem[];
  team: TeamMember[];
  onFilterByProject: (projectId: string) => void;
  onNavigateView: (view: ViewType) => void;
}

export const ProjectsTeamScreen: React.FC<ProjectsTeamScreenProps> = ({
  projects,
  tasks,
  team,
  onFilterByProject,
  onNavigateView,
}) => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-[-0.02em] text-[#0F172A]">
          Projects & Team Workload
        </h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Delivery progress across workstreams and weekly hour allocation per contributor
        </p>
      </div>

      {/* Active Projects Grid */}
      <section className="space-y-4">
        <h2 className="font-display text-base font-semibold text-[#0F172A]">
          Active Projects
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((project) => {
            const projTasks = tasks.filter((t) => t.projectId === project.id);
            const completed = projTasks.filter((t) => t.status === TaskStatus.Completed).length;
            const open = projTasks.length - completed;
            const pct = projTasks.length > 0 ? Math.round((completed / projTasks.length) * 100) : 0;
            const lead = team.find((m) => m.id === project.leadId);

            return (
              <div
                key={project.id}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-level-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-mono text-xs text-[#64748B]">{project.code}</span>
                      <h3 className="font-display text-lg font-semibold text-[#0F172A] mt-0.5">
                        {project.name}
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-[#64748B] tabular-nums whitespace-nowrap">
                      Target {formatShortDate(project.targetDate)}
                    </span>
                  </div>

                  <p className="text-sm text-[#475569] mt-2 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#64748B] font-medium">Completion</span>
                      <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                        {completed}/{projTasks.length} tasks · {pct}%
                      </span>
                    </div>
                    <ProgressTracker value={completed} max={projTasks.length || 1} />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F1F5F9] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar member={lead} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#0F172A] truncate">
                        {lead?.name ?? 'Unassigned'}
                      </p>
                      <p className="text-[11px] text-[#64748B]">Lead · {open} open</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onFilterByProject(project.id);
                      onNavigateView('board');
                    }}
                    className="h-9 px-3.5 bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#7C3AED] text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Open Board</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Team Capacity Table */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl shadow-level-1 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F1F5F9]">
          <h2 className="font-display text-base font-semibold text-[#0F172A]">
            Team Capacity & Allocation
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Estimated open task hours vs. weekly sprint capacity
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="h-9 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B]">
                <th className="pl-6 pr-3">Contributor</th>
                <th className="px-3">Role</th>
                <th className="px-3 text-right">Open Tasks</th>
                <th className="px-3 text-right">Completed</th>
                <th className="px-3 w-52">Allocated Hours</th>
                <th className="pl-3 pr-6 text-right">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {team.map((member) => {
                const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
                const openTasks = memberTasks.filter((t) => t.status !== TaskStatus.Completed);
                const doneCount = memberTasks.length - openTasks.length;
                const openHours = openTasks.reduce((acc, t) => acc + t.estimateHours, 0);
                const utilPct = Math.round((openHours / member.weeklyCapacityHours) * 100);

                return (
                  <tr key={member.id} className="h-14 hover:bg-[#F8FAFC] transition-colors">
                    <td className="pl-6 pr-3">
                      <Avatar member={member} size="sm" showName />
                    </td>
                    <td className="px-3 text-sm text-[#475569]">{member.role}</td>
                    <td className="px-3 text-right font-mono text-sm font-medium text-[#0F172A] tabular-nums">
                      {openTasks.length}
                    </td>
                    <td className="px-3 text-right font-mono text-sm text-[#047857] tabular-nums">
                      {doneCount}
                    </td>
                    <td className="px-3">
                      <ProgressTracker value={openHours} max={member.weeklyCapacityHours} />
                    </td>
                    <td className="pl-3 pr-6 text-right font-mono text-xs font-semibold tabular-nums text-[#0F172A]">
                      {openHours}h / {member.weeklyCapacityHours}h ({utilPct}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
