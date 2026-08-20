import { useEffect, useState } from 'react';
import { Bell, Plus, X, Pin, PinOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isStaff } from '@/lib/types';
import type { Notice } from '@/lib/types';
import { timeAgo } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { PageSkeleton } from '@/components/ui/Loader';

const CATEGORIES = ['general', 'urgent', 'event', 'maintenance', 'fee', 'mess', 'holiday', 'other'];
const CATEGORY_COLORS: Record<string, string> = {
  urgent: 'error', maintenance: 'warning', fee: 'primary', event: 'primary', holiday: 'success', mess: 'accent',
};

export default function NoticesPage() {
  const { profile } = useAuth();
  const canEdit = profile ? isStaff(profile.role) : false;

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => { loadNotices(); }, [categoryFilter]);

  async function loadNotices() {
    setLoading(true);
    let query = supabase.from('notices').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter);
    const { data } = await query;
    setNotices((data as Notice[]) ?? []);
    setLoading(false);
  }

  async function togglePin(id: string, pinned: boolean) {
    await supabase.from('notices').update({ is_pinned: !pinned }).eq('id', id);
    loadNotices();
  }

  const pinned = notices.filter(n => n.is_pinned).length;
  const urgent = notices.filter(n => n.category === 'urgent').length;

  return (
    <div>
      <PageHeader
        title="Notices"
        description="Announcements, events, and important updates"
        icon={Bell}
        actions={canEdit && <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="w-4 h-4" /> Post Notice</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Notices" value={notices.length} icon={Bell} color="primary" />
        <StatCard title="Pinned" value={pinned} icon={Pin} color="accent" />
        <StatCard title="Urgent" value={urgent} icon={Bell} color="error" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setCategoryFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${categoryFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 dark:bg-slate-900 dark:text-slate-300 border border-gray-200 dark:border-slate-800'}`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${categoryFilter === c ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 dark:bg-slate-900 dark:text-slate-300 border border-gray-200 dark:border-slate-800'}`}>{c}</button>
        ))}
      </div>

      {loading ? (
        <PageSkeleton />
      ) : notices.length === 0 ? (
        <div className="card"><EmptyState icon={Bell} title="No notices" description="Posted announcements will appear here." /></div>
      ) : (
        <div className="space-y-3">
          {notices.map(n => (
            <div key={n.id} className={`card p-5 animate-fade-in-up ${n.is_pinned ? 'border-l-4 border-l-accent-500' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {n.is_pinned && <Pin className="w-4 h-4 text-accent-500 fill-accent-500" />}
                    <h3 className="font-semibold text-gray-900 dark:text-white">{n.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">{n.content}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
                    <span>{timeAgo(n.created_at)}</span>
                    <span>·</span>
                    <StatusBadge status={n.category} variant={(CATEGORY_COLORS[n.category] as 'primary' | 'warning' | 'error' | 'success' | 'accent') ?? 'neutral'} />
                  </div>
                </div>
                {canEdit && (
                  <button onClick={() => togglePin(n.id, n.is_pinned)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-accent-500 dark:hover:bg-slate-800">
                    {n.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddNoticeModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); loadNotices(); }} />}
    </div>
  );
}

function AddNoticeModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile } = useAuth();
  const [form, setForm] = useState({ title: '', content: '', category: 'general', is_pinned: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error: err } = await supabase.from('notices').insert({
      title: form.title,
      content: form.content,
      category: form.category,
      is_pinned: form.is_pinned,
      posted_by: profile?.id,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Post Notice</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="label">Title *</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" placeholder="Important Announcement" /></div>
          <div><label className="label">Content *</label><textarea required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="input min-h-[100px]" placeholder="Notice details..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_pinned} onChange={e => setForm({ ...form, is_pinned: e.target.checked })} className="w-5 h-5 rounded accent-primary-600" />
                <span className="text-sm text-gray-700 dark:text-slate-300">Pin this notice</span>
              </label>
            </div>
          </div>
          {error && <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-300">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Posting...' : 'Post Notice'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
