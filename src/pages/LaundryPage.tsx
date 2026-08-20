import { useEffect, useState } from 'react';
import { Shirt, Plus, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Laundry, Student } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Loader';

export default function LaundryPage() {
  const [laundry, setLaundry] = useState<(Laundry & { student?: Student })[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadLaundry(); loadStudents(); }, [search]);

  async function loadLaundry() {
    setLoading(true);
    let query = supabase.from('laundry').select('*, student:students(*)').order('created_at', { ascending: false });
    if (search) {
      const student = students.find(s => s.full_name.toLowerCase().includes(search.toLowerCase()));
      if (student) query = query.eq('student_id', student.id);
    }
    const { data } = await query;
    setLaundry((data as (Laundry & { student: Student })[]) ?? []);
    setLoading(false);
  }

  async function loadStudents() {
    const { data } = await supabase.from('students').select('*').order('full_name');
    setStudents((data as Student[]) ?? []);
  }

  const booked = laundry.filter(l => l.status === 'booked').length;
  const inWash = laundry.filter(l => l.status === 'picked_up' || l.status === 'in_wash').length;
  const delivered = laundry.filter(l => l.status === 'delivered').length;

  async function updateStatus(id: string, status: Laundry['status']) {
    const updates: Partial<Laundry> = { status };
    if (status === 'picked_up') updates.pickup_time = new Date().toISOString();
    if (status === 'delivered') updates.delivery_time = new Date().toISOString();
    await supabase.from('laundry').update(updates).eq('id', id);
    loadLaundry();
  }

  return (
    <div>
      <PageHeader
        title="Laundry"
        description="Book, track, and manage laundry services"
        icon={Shirt}
        actions={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="w-4 h-4" /> Book Laundry</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Booked" value={booked} icon={Shirt} color="primary" />
        <StatCard title="In Progress" value={inWash} icon={Shirt} color="warning" />
        <StatCard title="Delivered" value={delivered} icon={Shirt} color="success" />
      </div>

      <div className="card p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Search by student name..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : laundry.length === 0 ? (
        <div className="card"><EmptyState icon={Shirt} title="No laundry bookings" description="Laundry requests will appear here." /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Clothes</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Charge</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {laundry.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{l.student?.full_name ?? '—'}</p>
                      <p className="text-xs text-gray-400 font-mono">{l.student?.roll_number}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600 dark:text-slate-300">{formatDate(l.booking_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-200">{l.clothes_count}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm font-medium text-gray-900 dark:text-white">₹{l.charge}</td>
                    <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={l.status}
                        onChange={e => updateStatus(l.id, e.target.value as Laundry['status'])}
                        className="text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-gray-600 dark:text-slate-300"
                      >
                        {['booked', 'picked_up', 'in_wash', 'ready', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && <AddLaundryModal students={students} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadLaundry(); }} />}
    </div>
  );
}

function AddLaundryModal({ students, onClose, onSaved }: { students: Student[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ student_id: '', clothes_count: 1, charge: 30 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error: err } = await supabase.from('laundry').insert({
      student_id: form.student_id,
      clothes_count: form.clothes_count,
      charge: form.charge,
      status: 'booked',
      payment_status: 'pending',
    });
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Book Laundry</h2>
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
            <div><label className="label">Clothes Count *</label><input type="number" required min={1} value={form.clothes_count} onChange={e => setForm({ ...form, clothes_count: Number(e.target.value) })} className="input" /></div>
            <div><label className="label">Charge (₹)</label><input type="number" min={0} value={form.charge} onChange={e => setForm({ ...form, charge: Number(e.target.value) })} className="input" /></div>
          </div>
          {error && <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-300">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Booking...' : 'Book Now'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
