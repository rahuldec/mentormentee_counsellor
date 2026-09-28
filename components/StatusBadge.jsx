const STATUS_CONFIG = {
  pending:     { dot: '#F59E0B', bg: '#FFFBEB', text: '#92400E' },
  accepted:    { dot: '#10B981', bg: '#ECFDF5', text: '#065F46' },
  declined:    { dot: '#EF4444', bg: '#FFF1F2', text: '#9F1239' },
  rescheduled: { dot: '#3B82F6', bg: '#EFF6FF', text: '#1E40AF' },
  completed:   { dot: '#8B5CF6', bg: '#F5F3FF', text: '#4C1D95' },
  reopened:    { dot: '#EC4899', bg: '#FDF2F8', text: '#831843' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { dot: '#94A3B8', bg: '#F8FAFC', text: '#475569' };
  return (
    <span style={{ background: cfg.bg, color: cfg.text }} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap">
      <span style={{ background: cfg.dot, width: 6, height: 6, borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
      {status}
    </span>
  );
}
