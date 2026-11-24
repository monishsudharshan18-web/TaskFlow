import React from 'react';
import { TeamMember } from '../types/taskflow';

interface AvatarProps {
  member?: TeamMember;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const SIZE_CLASSES: Record<'xs' | 'sm' | 'md' | 'lg', string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export const Avatar: React.FC<AvatarProps> = ({ member, size = 'sm', showName = false }) => {
  if (!member) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-500 font-semibold shrink-0 ${SIZE_CLASSES[size]}`}
        aria-label="Unassigned"
      >
        ?
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <span
        className={`inline-flex items-center justify-center rounded-full font-semibold tracking-tight shrink-0 ring-1 ring-inset ring-black/5 ${SIZE_CLASSES[size]}`}
        style={{ backgroundColor: member.avatarBg, color: member.avatarText }}
        title={`${member.name} · ${member.role}`}
        aria-label={member.name}
      >
        {member.initials}
      </span>
      {showName && (
        <span className="text-sm text-[#0F172A] font-medium truncate">{member.name}</span>
      )}
    </span>
  );
};
