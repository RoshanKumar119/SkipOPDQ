import { Lock } from 'lucide-react';

/** Reusable "Coming Soon – Phase 2" badge for planned (not yet built) features. */
export default function ComingSoonBadge({ label = 'Coming Soon – Phase 2', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-inset ring-amber-300 ${className}`}>
      <Lock size={10} /> {label}
    </span>
  );
}

/** Tooltip wrapper: shows "Planned for Phase 2" on hover/focus. */
export function Phase2Tooltip({ children, text = 'Planned for Phase 2', className = '' }) {
  return (
    <span className={`group relative inline-flex ${className}`} tabIndex={0} aria-label={text}>
      {children}
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow transition group-hover:opacity-100 group-focus:opacity-100">
        {text}
      </span>
    </span>
  );
}

/**
 * Consistent disabled button for Phase 2 features:
 * greyed out, lock icon, tooltip "Planned for Phase 2" and the Coming Soon badge.
 */
export function Phase2Button({ icon: Icon, children, className = '', showBadge = true }) {
  return (
    <Phase2Tooltip className={className}>
      <button type="button" disabled aria-disabled="true"
        className="phase2-disabled inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-500">
        <Lock size={14} />
        {Icon && <Icon size={16} />}
        {children}
        {showBadge && <ComingSoonBadge label="Phase 2" />}
      </button>
    </Phase2Tooltip>
  );
}
