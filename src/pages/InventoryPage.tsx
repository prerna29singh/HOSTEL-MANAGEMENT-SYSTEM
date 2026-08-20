import { useEffect, useState } from 'react';
import { Package, Plus, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isAdmin, isStaff } from '@/lib/types';
import type { InventoryItem } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Loader';

const CATEGORIES = ['furniture', 'mattress', 'fan', 'light', 'bed', 'chair', 'table', 'equipment', 'other'];

export default function InventoryPage() {
  const { profile } = useAuth();
  const canEdit = profile ? isStaff(profile.role) : false;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadItems(); }, [search, categoryFilter]);

  async function loadItems() {
    setLoading(true);
    let query = supabase.from('inventory').select('*').order('name');
    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter);
    if (search) query = query.ilike('name', `%${search}%`);
    const { data } = await query;
    setItems((data as InventoryItem[]) ?? []);
    setLoading(false);
  }

  const totalItems = items.reduce((s, i) => s + i.total_quantity, 0);
  const availableItems = items.reduce((s, i) => s + i.available_quantity, 0);
  const damaged = items.filter(i => i.condition_status === 'damaged').length;

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Track furniture, equipment, and hostel assets"
        icon={Package}
        actions={canEdit && <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Item</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Items" value={totalItems} icon={Package} color="primary" />
        <StatCard title="Available" value={availableItems} icon={Package} color="success" />
        <StatCard title="Damaged" value={damaged} icon={Package} color="error" />
      </div>

      <div className="card p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input sm:w-40">
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : items.length === 0 ? (
        <div className="card"><EmptyState icon={Package} title="No inventory items" description="Add furniture and equipment to track hostel assets." /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Item</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Available / Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Condition</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {items.map(i => (
                  <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{i.name}</p>
                      {i.vendor && <p className="text-xs text-gray-400">{i.vendor}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="badge-neutral capitalize">{i.category}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{i.available_quantity}</span>
                        <span className="text-sm text-gray-400">/ {i.total_quantity}</span>
                      </div>
                      <div className="w-24 h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 mt-1">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${i.total_quantity > 0 ? (i.available_quantity / i.total_quantity) * 100 : 0}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell"><StatusBadge status={i.condition_status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600 dark:text-slate-300">{i.cost ? formatCurrency(i.cost) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && <AddItemModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadItems(); }} />}
    </div>
  );
}

function AddItemModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', category: 'furniture', total_quantity: 1, available_quantity: 1, condition_status: 'good', vendor: '', cost: 0, purchase_date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error: err } = await supabase.from('inventory').insert({
      name: form.name,
      category: form.category,
      total_quantity: form.total_quantity,
      available_quantity: form.available_quantity,
      condition_status: form.condition_status,
      vendor: form.vendor || null,
      cost: form.cost || null,
      purchase_date: form.purchase_date || null,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Add Inventory Item</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="label">Item Name *</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Study Chair" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="label">Condition</label><select value={form.condition_status} onChange={e => setForm({ ...form, condition_status: e.target.value })} className="input">{['good', 'fair', 'damaged', 'repairing'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Total Qty *</label><input type="number" required min={0} value={form.total_quantity} onChange={e => setForm({ ...form, total_quantity: Number(e.target.value) })} className="input" /></div>
            <div><label className="label">Available</label><input type="number" min={0} value={form.available_quantity} onChange={e => setForm({ ...form, available_quantity: Number(e.target.value) })} className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Vendor</label><input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} className="input" /></div>
            <div><label className="label">Cost (₹)</label><input type="number" min={0} value={form.cost} onChange={e => setForm({ ...form, cost: Number(e.target.value) })} className="input" /></div>
          </div>
          <div><label className="label">Purchase Date</label><input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} className="input" /></div>
          {error && <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-300">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Item'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
