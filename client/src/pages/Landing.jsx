import { Link } from 'react-router-dom';
import {
  Activity, BellRing, CalendarClock, Clock3, Hospital, MapPinned, Search, ShieldCheck, Stethoscope, Ticket, Users,
} from 'lucide-react';
import { useAuth, HOME_BY_ROLE } from '../context/AuthContext';
import ComingSoonBadge, { Phase2Tooltip } from '../components/ComingSoonBadge';

const STEPS = [
  { icon: Search, title: 'Search', text: 'Find your doctor and see live availability, OPD timing and how many patients are waiting.' },
  { icon: Ticket, title: 'Book Token', text: 'Book a token for today in one tap. Online and walk-in patients share one fair queue.' },
  { icon: Activity, title: 'Track Live', text: 'Watch "Now Serving", patients ahead and your estimated waiting time update in real time.' },
  { icon: MapPinned, title: 'Arrive on Time', text: 'Get a suggested arrival time and an alert when your turn is approaching.' },
];

const PROBLEMS = [
  'Is my doctor available today?',
  'What are the OPD timings?',
  'Is the doctor running late?',
  'How many patients are waiting?',
  'When should I actually reach the hospital?',
];

const ROLES = [
  { icon: Users, title: 'For Patients', points: ['Real-time doctor availability', 'Book an OPD token from home', 'Live queue position & waiting time', 'Turn-approaching alerts'] },
  { icon: Stethoscope, title: 'For Doctors', points: ['One-tap status: Available / Busy / Unavailable', 'Announce delays with a note', 'Call Next, Mark Done, Skip', 'Today\'s queue at a glance'] },
  { icon: Hospital, title: 'For Hospitals', points: ['Manage departments, doctors & schedules', 'Live OPD dashboard', 'Add walk-in patients to the same queue', 'Less crowding in waiting areas'] },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 text-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-coral-500/20" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <span className="h-2 w-2 animate-pulse rounded-full bg-coral-400" /> Smart OPD Queue Management
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl">
              Skip the OPD queue.<br />Arrive when it&apos;s your turn.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-primary-50">
              SkipOPDQ shows real-time doctor availability, lets you book an OPD token and tracks your queue position live –
              so you spend time with your family, not in a crowded waiting hall.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link to={HOME_BY_ROLE[user.role]} className="btn bg-white px-6 py-3 text-primary-600 hover:bg-primary-50">Go to my dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="btn bg-white px-6 py-3 text-primary-600 hover:bg-primary-50">Log in</Link>
                  <Link to="/register" className="btn border border-white/60 px-6 py-3 text-white hover:bg-white/10">Register as Patient</Link>
                </>
              )}
              <Link to="/doctors" className="btn px-6 py-3 text-white underline-offset-4 hover:underline">Check doctor availability →</Link>
            </div>
          </div>

          {/* Mock live token card */}
          <div className="mx-auto w-full max-w-sm">
            <div className="rounded-3xl bg-white p-6 text-slate-800 shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">Dr. Rajesh Sharma · OPD-101</p>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-coral-500">
                  <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-coral-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-coral-500" /></span>
                  LIVE
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 text-center">
                <div className="rounded-2xl bg-primary-50 p-4">
                  <p className="text-xs font-semibold uppercase text-primary-600">Your Token</p>
                  <p className="text-5xl font-extrabold text-primary-600">6</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Now Serving</p>
                  <p className="text-5xl font-extrabold text-slate-800">3</p>
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-1/2 rounded-full bg-primary-500" /></div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500">3 patients ahead</span>
                <span className="font-semibold text-slate-800">~30 min wait</span>
              </div>
              <p className="mt-4 rounded-xl bg-coral-50 px-3 py-2 text-center text-sm font-semibold text-coral-600">Reach the OPD by 11:40 AM</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-coral-500">The problem</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Patients wait for hours without knowing anything</h2>
            <p className="mt-4 text-slate-600">
              In most hospital OPDs, patients arrive early and wait in overcrowded halls because they have no idea about the doctor&apos;s
              real situation. Elderly patients, pregnant women and parents with sick children suffer the most.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {PROBLEMS.map((p) => (
              <li key={p} className="card flex items-center gap-3 p-4 text-sm font-medium text-slate-700">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-50 font-bold text-coral-500">?</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-500">How it works</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Four simple steps</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="relative rounded-2xl border border-slate-200 p-6">
                <span className="absolute right-5 top-5 text-4xl font-extrabold text-slate-100">{i + 1}</span>
                <div className="mb-4 inline-flex rounded-xl bg-primary-50 p-3 text-primary-500"><Icon size={24} /></div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {ROLES.map(({ icon: Icon, title, points }) => (
            <div key={title} className="card p-6">
              <div className="mb-4 inline-flex rounded-xl bg-primary-500 p-3 text-white"><Icon size={22} /></div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {points.map((p) => <li key={p} className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary-500" />{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-4 rounded-2xl bg-slate-900 p-6 text-white sm:grid-cols-3 sm:p-8">
          <div className="flex items-center gap-3"><Clock3 className="text-primary-300" /> <span>Estimated wait = patients ahead × avg. consultation time + doctor delay</span></div>
          <div className="flex items-center gap-3"><BellRing className="text-coral-400" /> <span>In-app alert when only 2 patients are ahead of you</span></div>
          <div className="flex items-center gap-3"><CalendarClock className="text-primary-300" /> <span>Weekly OPD schedules managed by the hospital</span></div>
        </div>
      </section>

      {/* Mobile app – Phase 2 */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="card flex flex-col items-center gap-6 bg-gradient-to-r from-white to-primary-50 p-8 md:flex-row">
          <div className="flex h-28 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border-4 border-slate-800 bg-primary-500 text-white shadow-lg">
            <span className="text-[8px] font-semibold uppercase opacity-80">Token</span><span className="text-2xl font-extrabold">6</span>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="flex flex-wrap items-center justify-center gap-2 text-2xl font-bold text-slate-900 md:justify-start">SkipOPDQ Mobile App <ComingSoonBadge /></h2>
            <p className="mt-2 text-slate-600">Track your token with push notifications on Android and iOS. Until then, the web app works on any mobile browser.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {['Google Play', 'App Store'].map((store) => (
              <Phase2Tooltip key={store}>
                <button type="button" disabled className="phase2-disabled flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-left text-white">
                  <span><span className="block text-[10px] uppercase">{store === 'Google Play' ? 'Get it on' : 'Download on the'}</span><span className="block text-sm font-bold">{store}</span></span>
                </button>
              </Phase2Tooltip>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
