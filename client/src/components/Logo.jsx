import { Link } from 'react-router-dom';

/** SkipOPDQ logo text + tagline. */
export default function Logo({ to = '/', showTagline = true, light = false }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-lg font-extrabold text-white shadow-sm">
        +
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-coral-500" />
      </span>
      <span className="leading-tight">
        <span className={`block text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}>
          Skip<span className={light ? 'text-primary-200' : 'text-primary-500'}>OPD</span>Q
        </span>
        {showTagline && (
          <span className={`hidden text-[11px] sm:block ${light ? 'text-primary-100' : 'text-slate-500'}`}>
            Skip the OPD queue. Arrive when it&apos;s your turn.
          </span>
        )}
      </span>
    </Link>
  );
}
