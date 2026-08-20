import { useEffect, useState } from 'react';
import { ShieldCheck, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AuditLog, Profile } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Loader';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<(AuditLog & { profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadLogs(); }, [search]);

  async function loadLogs() {
    setLoading(true);
    let query = supabase.from('audit_logs').select('*, profile:profiles(*)').order('created_at', { ascending: false }).limit(100);
    if (search) query = query.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`);
    const { data } = await query;
    setLogs((data as (AuditLog & { profile: Profile })[]) ?? []);
    setLoading(false);
  }

  const todayCount = logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <div>
      <PageHeader title="Audit Logs" description="System activity trail and security audit records" icon={ShieldCheck} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Events" value={logs.length} icon={ShieldCheck} color="primary" />
        <StatCard title="Today" value={todayCount} icon={ShieldCheck} color="success" />
        <StatCard title="Tracked Actions" value="All CRUD" icon={ShieldCheck} color="accent" />
      </div>

      <div className="card p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Search by action or entity type..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : logs.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ShieldCheck}
            title="No audit logs yet"
            description="System actions will be tracked and displayed here as users interact with the platform."
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-slate-300">
                          {l.profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{l.profile?.full_name ?? 'System'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700 dark:text-slate-200 font-mono">{l.action}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="badge-neutral">{l.entity_type ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600 dark:text-slate-300">{formatDateTime(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
