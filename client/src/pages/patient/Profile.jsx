import { BadgeCheck, Bell, Mail, MessageCircle, Phone, Smartphone, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Avatar from '../../components/Avatar';
import ComingSoonBadge, { Phase2Button, Phase2Tooltip } from '../../components/ComingSoonBadge';

/** Patient profile with Phase 2 placeholders (notification settings, ABHA linking). */
export default function Profile() {
  const { user } = useAuth();

  const channels = [
    { icon: Smartphone, label: 'SMS alerts', text: 'Token booked, 2 patients ahead, your turn' },
    { icon: MessageCircle, label: 'WhatsApp alerts', text: 'Live queue updates on WhatsApp' },
    { icon: Mail, label: 'E-mail summary', text: 'Visit summary after consultation' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageHeader title="My Profile" subtitle="Your SkipOPDQ patient account" />

      <div className="card p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={user.name} size="lg" />
          <div className="flex-1 space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="flex items-center gap-2 text-sm text-slate-600"><Mail size={15} className="text-slate-400" /> {user.email}</p>
            <p className="flex items-center gap-2 text-sm text-slate-600"><Phone size={15} className="text-slate-400" /> {user.phone || 'No mobile number added'}</p>
            <p className="flex items-center gap-2 text-sm text-slate-600"><UserRound size={15} className="text-slate-400" /> Patient account</p>
          </div>
        </div>
      </div>

      {/* ABHA – Phase 2 */}
      <div className="card mt-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex flex-wrap items-center gap-2 font-bold text-slate-900"><BadgeCheck size={18} className="text-primary-500" /> ABHA Health ID <ComingSoonBadge /></h3>
            <p className="mt-1 text-sm text-slate-500">Link your Ayushman Bharat Health Account (ABDM) to share health records with doctors.</p>
          </div>
          <Phase2Button className="sm:w-auto">Link ABHA ID</Phase2Button>
        </div>
      </div>

      {/* Notification settings – Phase 2 */}
      <div className="card mt-6 p-6">
        <h3 className="flex flex-wrap items-center gap-2 font-bold text-slate-900"><Bell size={18} className="text-primary-500" /> Notification Settings <ComingSoonBadge /></h3>
        <p className="mt-1 text-sm text-slate-500">Right now you get in-app alerts on the Live Queue page. SMS and WhatsApp alerts are planned for Phase 2.</p>
        <div className="phase2-disabled mt-4 divide-y divide-slate-100 rounded-xl border border-dashed border-slate-300">
          {channels.map(({ icon: Icon, label, text }) => (
            <Phase2Tooltip key={label} className="flex w-full items-center gap-4 px-4 py-3">
              <Icon size={20} className="text-slate-400" />
              <div className="flex-1"><p className="text-sm font-semibold text-slate-700">{label}</p><p className="text-xs text-slate-500">{text}</p></div>
              <span className="relative h-6 w-11 rounded-full bg-slate-200"><span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" /></span>
            </Phase2Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
