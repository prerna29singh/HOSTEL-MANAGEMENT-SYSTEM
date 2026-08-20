import { useEffect, useState } from 'react';
import { IndianRupee, Plus, Search, Download, X, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isAdmin, isStaff } from '@/lib/types';
import type { Fee, Student } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Loader';

const FEE_TYPES = ['admission', 'security_deposit', 'mess', 'electricity', 'water', 'laundry', 'penalty', 'late_fine'];

export default function FeesPage() {
  const { profile } = useAuth();
  const canEdit = profile ? (isAdmin(profile.role) || profile.role === 'receptionist') : false;
  const isStudent = profile?.role === 'student';

  const [fees, setFees] = useState<(Fee & { student?: Student })[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadFees();
    loadStudents();
  }, [search, statusFilter]);

  async function loadFees() {
    setLoading(true);
    let query = supabase.from('fees').select('*, student:students(*)').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (search) {
      const student = students.find(s => s.full_name.toLowerCase().includes(search.toLowerCase()) || s.roll_number.toLowerCase().includes(search.toLowerCase()));
      if (student) query = query.eq('student_id', student.id);
    }
    const { data } = await query;
    setFees((data as (Fee & { student: Student })[]) ?? []);
    setLoading(false);
  }

  async function loadStudents() {
    const { data } = await supabase.from('students').select('*').order('full_name');
    setStudents((data as Student[]) ?? []);
  }

  const collected = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.paid_amount, 0);
  const pending = fees.filter(f => f.status === 'pending' || f.status === 'overdue').reduce((s, f) => s + (f.amount - f.paid_amount), 0);
  const overdue = fees.filter(f => f.status === 'overdue').length;

  return (
    <div>
      <PageHeader
        title="Fees"
        description="Manage fee collection, invoices, and payment tracking"
        icon={IndianRupee}
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary"><Download className="w-4 h-4" /> Export</button>
            {canEdit && <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Fee</button>}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Collected" value={formatCurrency(collected)} icon={IndianRupee} color="success" />
        <StatCard title="Pending Amount" value={formatCurrency(pending)} icon={IndianRupee} color="warning" />
        <StatCard title="Overdue Fees" value={overdue} icon={IndianRupee} color="error" />
      </div>

      <div className="card p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input placeholder="Search by student name or roll number..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input sm:w-40">
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : fees.length === 0 ? (
        <div className="card">
          <EmptyState icon={IndianRupee} title="No fee records" description="Add fee records to track student payments." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Due Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {fees.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{f.student?.full_name ?? '—'}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">{f.student?.roll_number ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-700 dark:text-slate-200 capitalize">{f.fee_type.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(f.amount)}</p>
                      {f.paid_amount > 0 && f.paid_amount < f.amount && (
                        <p className="text-xs text-success-600 dark:text-success-400">Paid: {formatCurrency(f.paid_amount)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600 dark:text-slate-300">{formatDate(f.due_date)}</td>
                    <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-slate-700 inline-flex">
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && (
        <AddFeeModal students={students} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadFees(); }} />
      )}
    </div>
  );
}

function AddFeeModal({ students, onClose, onSaved }: { students: Student[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ student_id: '', fee_type: 'admission', amount: 0, due_date: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error: err } = await supabase.from('fees').insert({
      student_id: form.student_id,
      fee_type: form.fee_type,
      amount: form.amount,
      due_date: form.due_date || null,
      description: form.description || null,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Add Fee Record</h2>
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
          <div>
            <label className="label">Fee Type</label>
            <select value={form.fee_type} onChange={e => setForm({ ...form, fee_type: e.target.value })} className="input">
              {FEE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount (₹) *</label>
              <input type="number" required min={0} value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="input" />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input min-h-[80px]" placeholder="Optional notes..." />
          </div>
          {error && <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-300">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Fee'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
