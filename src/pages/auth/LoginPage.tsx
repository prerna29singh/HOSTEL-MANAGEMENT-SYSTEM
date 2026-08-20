import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Lock, Mail, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/lib/types';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/types';

const DEMO_ACCOUNTS: { role: UserRole; email: string; description: string }[] = [
  { role: 'super_admin', email: 'admin@hostelhub.edu', description: 'Full system access' },
  { role: 'hostel_admin', email: 'hod@hostelhub.edu', description: 'Manage operations' },
  { role: 'warden', email: 'warden@hostelhub.edu', description: 'Block management' },
  { role: 'student', email: 'student@hostelhub.edu', description: 'Student portal' },
];

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
      return;
    }
    navigate('/app/dashboard');
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('hostelhub123');
    setError(null);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-accent-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">HostelHub</h1>
              <p className="text-sm text-primary-200">Smart Hostel Management</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-display font-bold leading-tight">
              The complete platform for
              <br />
              modern hostel operations.
            </h2>
            <p className="text-lg text-primary-200 max-w-md">
              Student management, room allocation, fees, visitors, complaints, attendance, mess,
              laundry, maintenance — all in one place.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md pt-4">
              {[
                { label: 'Students', value: '1,240+' },
                { label: 'Rooms', value: '320+' },
                { label: 'Modules', value: '12' },
                { label: 'Roles', value: '7' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-primary-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-primary-300">
            © 2026 HostelHub. Built for universities and commercial hostels.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50 dark:bg-slate-950">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-gray-900 dark:text-white">HostelHub</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">Smart Hostel Management</p>
            </div>
          </div>

          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">
            Sign in to your HostelHub account to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@hostelhub.edu"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-300">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              New to HostelHub?{' '}
              <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
                Create an account
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-500 uppercase tracking-wide mb-3">
              Quick demo access
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  onClick={() => fillDemo(acc.email)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-slate-200">{ROLE_LABELS[acc.role]}</div>
                    <div className="text-xs text-gray-400 dark:text-slate-500">{acc.description}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
