import { MonitorPlay } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ComingSoonBadge from '../../components/ComingSoonBadge';

/** TV Token Display Board – placeholder (Phase 2). */
export default function DisplayBoard() {
  return (
    <div>
      <PageHeader title="TV Token Display Board" badge={<ComingSoonBadge />} subtitle="Full-screen token board for waiting-area TVs." />
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <div className="phase2-disabled w-full max-w-xl rounded-2xl bg-slate-900 p-6 text-left text-white">
          <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-widest text-slate-400">
            <span>General Medicine · Ground Floor</span><span>Now Serving</span>
          </div>
          {['OPD-101', 'OPD-102'].map((room) => (
            <div key={room} className="mb-2 flex items-center justify-between rounded-xl bg-slate-800 px-4 py-3">
              <span className="font-semibold text-slate-300">{room}</span>
              <span className="text-3xl font-extrabold text-slate-500">– –</span>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-full bg-amber-50 p-4 text-amber-600"><MonitorPlay size={32} /></div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Coming Soon</h2>
        <p className="mt-2 max-w-lg text-sm text-slate-500">
          A large-screen view for each department&apos;s waiting area showing the token being served in every OPD room, with an audio
          announcement when a new token is called. Planned for Phase 2.
        </p>
      </div>
    </div>
  );
}
