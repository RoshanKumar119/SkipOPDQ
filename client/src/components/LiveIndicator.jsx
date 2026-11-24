import { useSocket } from '../context/SocketContext';

/** Small pulsing "Live" dot showing the real-time connection state. */
export default function LiveIndicator({ className = '' }) {
  const { connected } = useSocket();
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
        connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
      } ${className}`}
      title={connected ? 'Connected – updates arrive instantly' : 'Reconnecting to live updates...'}
    >
      <span className="relative flex h-2.5 w-2.5">
        {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      </span>
      {connected ? 'Live' : 'Reconnecting'}
    </span>
  );
}
