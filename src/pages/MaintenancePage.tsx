import { useEffect, useState } from 'react';
import { Wrench, Plus, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isStaff } from '@/lib/types';
import type { Maintenance } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Loader';

const CATEGORIES = ['electrical', 'plumbing', 'carpenter', 'cleaning', 'lift', 'water', 'electricity', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export default function MaintenancePage() {
  const { profile } = useAuth();
  const canEdit = profile ? isStaff(profile.role) : false;

  const [items, setItems] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadItems(); }, [search, statusFilter]);

  async function loadItems() {
    setLoading(true);
    let query = supabase.from('maintenance').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (search) query = query.or(`title.ilike.%${search}%,assigned_staff.ilike.%${search}%`);
    const { data } = await query;
    setItems((data as Maintenance[]) ?? []);
    setLoading(false);
  }

  const open = items.filter(i => i.status === 'open').length;
  const inProgress = items.filter(i => i.status === 'assigned' || i.status === 'in_progress').length;
  const completed = items.filter(i => i.status === 'completed').length;

  async function updateStatus(id: string, status: Maintenance['status']) {
    const updates: Partial<Maintenance> = { status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    await supabase.from('maintenance').update(updates).eq('id', id);
    loadItems();
  }

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Track and manage maintenance work orders"
        icon={Wrench}
        actions={canEdit && <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Work Order</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Open" value={open} icon={Wrench} color="error" />
        <StatCard title="In Progress" value={inProgress} icon={Wrench} color="warning" />
        <StatCard title="Completed" value={completed} icon={Wrench} color="success" />
      </div>

      <div className="card p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input placeholder="Search work orders..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input sm:w-40">
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : items.length === 0 ? (
        <div className="card"><EmptyState icon={Wrench} title="No work orders" description="Maintenance requests will appear here." /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Assigned To</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  {canEdit && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Update</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {items.map(i => (
                  <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{i.title}</p>
                      {i.description && <p className="text-xs text-gray-400 line-clamp-1">{i.description}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="badge-neutral capitalize">{i.category}</span></td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600 dark:text-slate-300">{i.assigned_staff ?? 'Unassigned'}</td>
                    <td className="px-4 py-3"><StatusBadge status={i.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <select value={i.status} onChange={e => updateStatus(i.id, e.target.value as Maintenance['status'])} className="text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-gray-600 dark:text-slate-300">
                          {['open', 'assigned', 'in_progress', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && <AddMaintenanceModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadItems(); }} />}
    </div>
  );
}

function AddMaintenanceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'electrical', priority: 'medium', assigned_staff: '', cost: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error: err } = await supabase.from('maintenance').insert({
      title: form.title,
      description: form.description || null,
      category: form.category,
      priority: form.priority,
      assigned_staff: form.assigned_staff || null,
      cost: form.cost,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">New Work Order</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="label">Title *</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" placeholder="Fix broken fan in room 204" /></div>
          <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input min-h-[80px]" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="label">Priority</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="input">{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Assigned Staff</label><input value={form.assigned_staff} onChange={e => setForm({ ...form, assigned_staff: e.target.value })} className="input" placeholder="Electrician name" /></div>
            <div><label className="label">Cost (₹)</label><input type="number" min={0} value={form.cost} onChange={e => setForm({ ...form, cost: Number(e.target.value) })} className="input" /></div>
          </div>
          {error && <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-300">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Order'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
