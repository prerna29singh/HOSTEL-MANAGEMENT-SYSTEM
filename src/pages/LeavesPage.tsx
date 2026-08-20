import { useEffect, useState } from 'react';
import { LogOut, Plus, X, Search, QrCode } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isStaff } from '@/lib/types';
import type { Leave, Student } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Loader';

export default function LeavesPage() {
  const { profile } = useAuth();
  const isWarden = profile ? (profile.role === 'warden' || profile.role === 'hostel_admin' || profile.role === 'super_admin') : false;
  const isParent = profile?.role === 'parents';

  const [leaves, setLeaves] = useState<(Leave & { student?: Student })[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadLeaves(); loadStudents(); }, [search]);

  async function loadLeaves() {
    setLoading(true);
    let query = supabase.from('leaves').select('*, student:students(*)').order('created_at', { ascending: false });
    if (search) {
      const student = students.find(s => s.full_name.toLowerCase().includes(search.toLowerCase()));
      if (student) query = query.eq('student_id', student.id);
    }
    const { data } = await query;
    setLeaves((data as (Leave & { student: Student })[]) ?? []);
    setLoading(false);
  }

  async function loadStudents() {
    const { data } = await supabase.from('students').select('*').order('full_name');
    setStudents((data as Student[]) ?? []);
  }

  const pending = leaves.filter(l => l.parent_status === 'pending' || l.warden_status === 'pending').length;
  const approved = leaves.filter(l => l.warden_status === 'approved').length;
  const rejected = leaves.filter(l => l.parent_status === 'rejected' || l.warden_status === 'rejected').length;

  async function approveLeave(id: string, approver: 'parent' | 'warden', status: 'approved' | 'rejected') {
    const updates = approver === 'parent'
      ? { parent_status: status, parent_approved_by: profile?.id }
      : { warden_status: status, warden_approved_by: profile?.id };
    await supabase.from('leaves').update(updates).eq('id', id);
    loadLeaves();
  }

  return (
    <div>
      <PageHeader
        title="Leave Management"
        description="Student leave requests with parent and warden approval workflow"
        icon={LogOut}
        actions={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="w-4 h-4" /> Request Leave</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Pending" value={pending} icon={LogOut} color="warning" />
        <StatCard title="Approved" value={approved} icon={LogOut} color="success" />
        <StatCard title="Rejected" value={rejected} icon={LogOut} color="error" />
      </div>

      <div className="card p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Search by student name..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : leaves.length === 0 ? (
        <div className="card"><EmptyState icon={LogOut} title="No leave requests" description="Student leave requests will appear here." /></div>
      ) : (
        <div className="space-y-3">
          {leaves.map(l => (
            <div key={l.id} className="card p-5 animate-fade-in-up">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{l.student?.full_name ?? '—'}</h3>
                    <span className="text-xs text-gray-400 font-mono">{l.student?.roll_number}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">{l.reason}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-slate-400">
                    <span>From: <strong className="text-gray-700 dark:text-slate-200">{formatDate(l.from_date)}</strong></span>
                    <span>To: <strong className="text-gray-700 dark:text-slate-200">{formatDate(l.to_date)}</strong></span>
                    {l.destination && <span>Destination: <strong className="text-gray-700 dark:text-slate-200">{l.destination}</strong></span>}
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:items-end">
                  <div className="flex gap-2">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1">Parent</p>
                      <StatusBadge status={l.parent_status} />
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1">Warden</p>
                      <StatusBadge status={l.warden_status} />
                    </div>
                  </div>

                  {(isParent || isWarden) && (
                    <div className="flex gap-1">
                      {isParent && l.parent_status === 'pending' && (
                        <>
                          <button onClick={() => approveLeave(l.id, 'parent', 'approved')} className="btn-secondary px-2 py-1 text-xs text-success-600">Approve</button>
                          <button onClick={() => approveLeave(l.id, 'parent', 'rejected')} className="btn-secondary px-2 py-1 text-xs text-error-600">Reject</button>
                        </>
                      )}
                      {isWarden && l.parent_status === 'approved' && l.warden_status === 'pending' && (
                        <>
                          <button onClick={() => approveLeave(l.id, 'warden', 'approved')} className="btn-secondary px-2 py-1 text-xs text-success-600">Approve</button>
                          <button onClick={() => approveLeave(l.id, 'warden', 'rejected')} className="btn-secondary px-2 py-1 text-xs text-error-600">Reject</button>
                        </>
                      )}
                      {l.warden_status === 'approved' && (
                        <span className="badge-primary"><QrCode className="w-3 h-3" /> QR Pass Ready</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddLeaveModal students={students} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadLeaves(); }} />}
    </div>
  );
}

function AddLeaveModal({ students, onClose, onSaved }: { students: Student[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ student_id: '', from_date: '', to_date: '', reason: '', destination: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error: err } = await supabase.from('leaves').insert({
      student_id: form.student_id,
      from_date: form.from_date,
      to_date: form.to_date,
      reason: form.reason,
      destination: form.destination || null,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Request Leave</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Student *</label>
            <select required value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} className="input">
              <option value="">— Select Student —</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.roll_number})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">From Date *</label><input type="date" required value={form.from_date} onChange={e => setForm({ ...form, from_date: e.target.value })} className="input" /></div>
            <div><label className="label">To Date *</label><input type="date" required value={form.to_date} onChange={e => setForm({ ...form, to_date: e.target.value })} className="input" /></div>
          </div>
          <div><label className="label">Destination</label><input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className="input" placeholder="Home / City" /></div>
          <div><label className="label">Reason *</label><textarea required value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="input min-h-[80px]" placeholder="Reason for leave..." /></div>
          {error && <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-300">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Submitting...' : 'Submit Request'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
