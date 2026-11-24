import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6">
        <p>
          <span className="font-semibold text-slate-700">SkipOPDQ</span> · Final Year Project · v0.6 (MVP – Phase 1)
        </p>
        <div className="flex items-center gap-4">
          <Link to="/doctors" className="hover:text-primary-600">Find Doctors</Link>
          <Link to="/progress" className="hover:text-primary-600">Project Progress</Link>
          <span>City Care Multispeciality Hospital (Demo)</span>
        </div>
      </div>
    </footer>
  );
}
