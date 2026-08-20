import { useEffect, useState } from 'react';
import { MessageSquareWarning, Plus, X, Search, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isAdmin, isStaff } from '@/lib/types';
import type { Complaint, Student } from '@/lib/types';
import { timeAgo } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Loader';

const CATEGORIES = ['general', 'electrical', 'plumbing', 'cleaning', 'furniture', 'wifi', 'mess', 'security', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function ComplaintsPage() {
  const { profile } = useAuth();
  const canManage = profile ? isStaff(profile.role) : false;

  const [complaints, setComplaints] = useState<(Complaint & { student?: Student })[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadComplaints(); loadStudents(); }, [search, statusFilter]);

  async function loadComplaints() {
    setLoading(true);
    let query = supabase.from('complaints').select('*, student:students(*)').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    const { data } = await query;
    setComplaints((data as (Complaint & { student: Student })[]) ?? []);
    setLoading(false);
  }

  async function loadStudents() {
    const { data } = await supabase.from('students').select('*');
    setStudents((data as Student[]) ?? []);
  }

  const open = complaints.filter(c => c.status === 'open').length;
  const inProgress = complaints.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;

  async function updateStatus(id: string, status: Complaint['status']) {
    await supabase.from('complaints').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    loadComplaints();
  }

  return (
    <div>
      <PageHeader
        title="Complaints"
        description="Track and resolve student complaints"
        icon={MessageSquareWarning}
        actions={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Complaint</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Open" value={open} icon={MessageSquareWarning} color="error" />
        <StatCard title="In Progress" value={inProgress} icon={MessageSquareWarning} color="warning" />
        <StatCard title="Resolved" value={resolved} icon={MessageSquareWarning} color="success" />
      </div>

      <div className="card p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input placeholder="Search complaints..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input sm:w-40">
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : complaints.length === 0 ? (
        <div className="card"><EmptyState icon={MessageSquareWarning} title="No complaints" description="Student complaints will appear here." /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complaints.map(c => (
            <div key={c.id} className="card p-5 animate-fade-in-up hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{c.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    by {c.student?.full_name ?? '—'} · {timeAgo(c.created_at)}
                  </p>
                </div>
                <div className="flex gap-1 ml-2">
                  <StatusBadge status={c.priority} />
                  <StatusBadge status={c.status} />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-300 line-clamp-2 mb-3">{c.description}</p>
              <div className="flex items-center gap-2">
                <span className="badge-neutral capitalize">{c.category}</span>
                {canManage && c.status !== 'resolved' && c.status !== 'rejected' && (
                  <select
                    value={c.status}
                    onChange={e => updateStatus(c.id, e.target.value as Complaint['status'])}
                    className="ml-auto text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-gray-600 dark:text-slate-300"
                  >
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddComplaintModal students={students} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadComplaints(); }} />}
    </div>
  );
}

function AddComplaintModal({ students, onClose, onSaved }: { students: Student[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ student_id: '', title: '', description: '', category: 'general', priority: 'medium' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error: err } = await supabase.from('complaints').insert({
      student_id: form.student_id,
      title: form.title,
      description: form.description,
      category: form.category,
      priority: form.priority,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">New Complaint</h2>
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
            <label className="label">Title *</label>
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" placeholder="Wi-Fi not working in room 204" />
          </div>
          <div>
            <label className="label">Description *</label>
            <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input min-h-[100px]" placeholder="Describe the issue in detail..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input">
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="input">
                {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
          </div>
          {error && <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-300">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Submit Complaint'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
