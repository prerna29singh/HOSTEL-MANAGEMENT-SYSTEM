import { useEffect, useState } from 'react';
import { CalendarCheck, Search } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isStaff } from '@/lib/types';
import type { Attendance, Student } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import '@/lib/chartSetup';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Loader';

export default function AttendancePage() {
  const { profile } = useAuth();
  const canMark = profile ? isStaff(profile.role) : false;

  const [records, setRecords] = useState<(Attendance & { student?: Student })[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'hostel' | 'night' | 'mess'>('hostel');

  useEffect(() => { loadAttendance(); loadStudents(); }, [date, type]);

  async function loadAttendance() {
    setLoading(true);
    const { data } = await supabase
      .from('attendance')
      .select('*, student:students(*)')
      .eq('date', date)
      .eq('type', type)
      .order('created_at', { ascending: false });
    setRecords((data as (Attendance & { student: Student })[]) ?? []);
    setLoading(false);
  }

  async function loadStudents() {
    const { data } = await supabase.from('students').select('*').eq('status', 'active').order('full_name');
    setStudents((data as Student[]) ?? []);
  }

  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const onLeave = records.filter(r => r.status === 'leave').length;
  const late = records.filter(r => r.status === 'late').length;

  async function markAttendance(studentId: string, status: Attendance['status']) {
    await supabase.from('attendance').upsert({
      student_id: studentId,
      date,
      type,
      status,
      marked_by: profile?.id,
    }, { onConflict: 'student_id,date,type' });
    loadAttendance();
  }

  const chartData = {
    labels: ['Present', 'Absent', 'On Leave', 'Late'],
    datasets: [{
      label: 'Count',
      data: [present, absent, onLeave, late],
      backgroundColor: ['#16b364', '#ef4444', '#f29b0c', '#1c80f5'],
      borderRadius: 8,
    }],
  };

  return (
    <div>
      <PageHeader title="Attendance" description="Track hostel, night, and mess attendance" icon={CalendarCheck} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Present" value={present} icon={CalendarCheck} color="success" />
        <StatCard title="Absent" value={absent} icon={CalendarCheck} color="error" />
        <StatCard title="On Leave" value={onLeave} icon={CalendarCheck} color="warning" />
        <StatCard title="Late" value={late} icon={CalendarCheck} color="primary" />
      </div>

      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div>
          <label className="label">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Type</label>
          <select value={type} onChange={e => setType(e.target.value as typeof type)} className="input">
            <option value="hostel">Hostel Attendance</option>
            <option value="night">Night Attendance</option>
            <option value="mess">Mess Attendance</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-6 lg:col-span-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Distribution</h3>
          <div className="h-48"><Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Mark Attendance</h3>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : students.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No students" description="No active students to mark attendance for." />
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
              {students.map(s => {
                const record = records.find(r => r.student_id === s.id);
                return (
                  <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">{s.full_name.charAt(0)}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.full_name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">{s.roll_number}</p>
                      </div>
                    </div>
                    {canMark ? (
                      <div className="flex gap-1">
                        {(['present', 'absent', 'leave', 'late'] as const).map(st => (
                          <button
                            key={st}
                            onClick={() => markAttendance(s.id, st)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              record?.status === st
                                ? st === 'present' ? 'bg-success-500 text-white' : st === 'absent' ? 'bg-error-500 text-white' : st === 'leave' ? 'bg-warning-500 text-white' : 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {st.charAt(0).toUpperCase()}
                          </button>
                        ))}
                      </div>
                    ) : (
                      record && <StatusBadge status={record.status} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
