/** Centered spinner used for loading states. */
export default function Loader({ label = 'Loading...', className = 'py-20' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-slate-500 ${className}`}>
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
