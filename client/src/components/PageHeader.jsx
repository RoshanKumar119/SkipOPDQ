/** Page title row with optional subtitle and action buttons. */
export default function PageHeader({ title, subtitle, actions, badge }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-slate-900">{title}{badge}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
