import { useEffect, useState } from 'react';
import { UserCheck, Plus, Search, QrCode, X, LogIn, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isAdmin, isStaff } from '@/lib/types';
import type { Visitor, Student } from '@/lib/types';
import { formatDateTime, timeAgo } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Loader';

export default function VisitorsPage() {
  const { profile } = useAuth();
  const canEdit = profile ? (isAdmin(profile.role) || profile.role === 'security_guard' || profile.role === 'receptionist') : false;

  const [visitors, setVisitors] = useState<(Visitor & { student?: Student })[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadVisitors(); loadStudents(); }, [search, statusFilter]);

  async function loadVisitors() {
    setLoading(true);
    let query = supabase.from('visitors').select('*, student:students(*)').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (search) query = query.or(`visitor_name.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data } = await query;
    setVisitors((data as (Visitor & { student: Student })[]) ?? []);
    setLoading(false);
  }

  async function loadStudents() {
    const { data } = await supabase.from('students').select('*').order('full_name');
    setStudents((data as Student[]) ?? []);
  }

  const checkedIn = visitors.filter(v => v.status === 'checked_in').length;
  const pending = visitors.filter(v => v.status === 'pending').length;
  const blacklisted = visitors.filter(v => v.status === 'blacklisted').length;

  async function updateStatus(id: string, status: Visitor['status']) {
    const updates: Partial<Visitor> = { status };
    if (status === 'checked_in') updates.entry_time = new Date().toISOString();
    if (status === 'checked_out') updates.exit_time = new Date().toISOString();
    await supabase.from('visitors').update(updates).eq('id', id);
    loadVisitors();
  }

  return (
    <div>
      <PageHeader
        title="Visitors"
        description="Track visitor entries, exits, and QR-based passes"
        icon={UserCheck}
        actions={canEdit && <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Visitor</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Checked In" value={checkedIn} icon={LogIn} color="primary" />
        <StatCard title="Pending" value={pending} icon={UserCheck} color="warning" />
        <StatCard title="Blacklisted" value={blacklisted} icon={UserCheck} color="error" />
      </div>

      <div className="card p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input sm:w-40">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="blacklisted">Blacklisted</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : visitors.length === 0 ? (
        <div className="card"><EmptyState icon={UserCheck} title="No visitors" description="New visitor entries will appear here." /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Visitor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">To Meet</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Entry</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Exit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  {canEdit && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {visitors.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center text-sm font-semibold">{v.visitor_name.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{v.visitor_name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{v.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-gray-700 dark:text-slate-200">{v.whom_to_meet ?? v.student?.full_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{v.purpose ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600 dark:text-slate-300">{formatDateTime(v.entry_time)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600 dark:text-slate-300">{formatDateTime(v.exit_time)}</td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {v.status === 'pending' && <button onClick={() => updateStatus(v.id, 'checked_in')} className="btn-secondary px-2 py-1 text-xs"><LogIn className="w-3 h-3" /> Check In</button>}
                          {v.status === 'checked_in' && <button onClick={() => updateStatus(v.id, 'checked_out')} className="btn-secondary px-2 py-1 text-xs"><LogOut className="w-3 h-3" /> Check Out</button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && <AddVisitorModal students={students} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadVisitors(); }} />}
    </div>
  );
}

function AddVisitorModal({ students, onClose, onSaved }: { students: Student[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ visitor_name: '', phone: '', purpose: '', whom_to_meet_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const { error: err } = await supabase.from('visitors').insert({
      visitor_name: form.visitor_name,
      phone: form.phone,
      purpose: form.purpose || null,
      whom_to_meet_id: form.whom_to_meet_id || null,
      otp_code: otp,
      status: 'pending',
    });
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">New Visitor</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Visitor Name *</label>
            <input required value={form.visitor_name} onChange={e => setForm({ ...form, visitor_name: e.target.value })} className="input" placeholder="Rajesh Kumar" />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="label">Whom to Meet</label>
            <select value={form.whom_to_meet_id} onChange={e => setForm({ ...form, whom_to_meet_id: e.target.value })} className="input">
              <option value="">— Select Student —</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.roll_number})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Purpose of Visit</label>
            <input value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} className="input" placeholder="Family visit" />
          </div>
          {error && <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-300">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Visitor'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
