// Deterministic pastel colour per name so each doctor keeps the same avatar colour
const COLORS = [
  'bg-primary-100 text-primary-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700',
  'bg-indigo-100 text-indigo-700',
];

/** Initials avatar (photo placeholder). */
export default function Avatar({ name = '', initials, size = 'md' }) {
  const text =
    initials ||
    name
      .replace(/^Dr\.?\s+/i, '')
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  const hash = [...name].reduce((h, c) => h + c.charCodeAt(0), 0);
  const sizes = { sm: 'h-9 w-9 text-sm', md: 'h-14 w-14 text-lg', lg: 'h-20 w-20 text-2xl' };
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-2xl font-bold ${COLORS[hash % COLORS.length]} ${sizes[size]}`}>
      {text}
    </div>
  );
}
