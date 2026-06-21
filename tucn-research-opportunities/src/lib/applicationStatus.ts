// Shared, friendly labels and monochrome badge styles for application statuses.
// 'pending' is the legacy value and is treated the same as 'new' (Submitted).

export const STATUS_LABEL: Record<string, string> = {
  new: 'Submitted',
  pending: 'Submitted',
  under_review: 'Under review',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

export const STATUS_BADGE: Record<string, string> = {
  new: 'bg-zinc-100 text-zinc-700 border border-zinc-200',
  pending: 'bg-zinc-100 text-zinc-700 border border-zinc-200',
  under_review: 'bg-amber-50 text-amber-700 border border-amber-200',
  shortlisted: 'bg-zinc-900 text-white border border-zinc-900',
  accepted: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border border-red-200',
};

export const STATUS_BAR: Record<string, string> = {
  new: 'bg-zinc-300',
  pending: 'bg-zinc-300',
  under_review: 'bg-amber-400',
  shortlisted: 'bg-zinc-900',
  accepted: 'bg-emerald-500',
  rejected: 'bg-red-500',
};

export const INTERVIEW_LABEL: Record<string, string> = {
  none: '',
  invited: 'Interview invited',
  scheduled: 'Interview scheduled',
  completed: 'Interview completed',
  cancelled: 'Interview cancelled',
};

export const INTERVIEW_BADGE: Record<string, string> = {
  invited: 'bg-amber-50 text-amber-700 border border-amber-200',
  scheduled: 'bg-zinc-900 text-white border border-zinc-900',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-zinc-100 text-zinc-500 border border-zinc-200',
};

export function interviewLabel(status?: string | null): string {
  return INTERVIEW_LABEL[status || 'none'] || '';
}

export function interviewBadge(status?: string | null): string {
  return INTERVIEW_BADGE[status || 'none'] || INTERVIEW_BADGE.invited;
}

export function statusLabel(status?: string | null): string {
  return STATUS_LABEL[status || 'new'] || 'Submitted';
}

export function statusBadge(status?: string | null): string {
  return STATUS_BADGE[status || 'new'] || STATUS_BADGE.new;
}
