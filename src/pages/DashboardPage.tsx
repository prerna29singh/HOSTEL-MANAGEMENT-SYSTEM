import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Users,
  DoorOpen,
  IndianRupee,
  MessageSquareWarning,
  UserCheck,
  CalendarCheck,
  TrendingUp,
  Zap,
  Droplets,
  ArrowUpRight,
  Bell,
  Activity,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isStaff } from '@/lib/types';
import type { Student, Room, Fee, Complaint, Visitor, Notice } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/types';
import { formatCurrency, timeAgo } from '@/lib/utils';
import '@/lib/chartSetup';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { PageSkeleton } from '@/components/ui/Loader';

interface DashboardData {
  students: Student[];
  rooms: Room[];
  fees: Fee[];
  complaints: Complaint[];
  visitors: Visitor[];
  notices: Notice[];
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [studentsRes, roomsRes, feesRes, complaintsRes, visitorsRes, noticesRes] =
        await Promise.all([
          supabase.from('students').select('*'),
          supabase.from('rooms').select('*'),
          supabase.from('fees').select('*'),
          supabase.from('complaints').select('*').order('created_at', { ascending: false }).limit(5),
          supabase.from('visitors').select('*').order('created_at', { ascending: false }).limit(5),
          supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5),
        ]);

      setData({
        students: (studentsRes.data as Student[]) ?? [],
        rooms: (roomsRes.data as Room[]) ?? [],
        fees: (feesRes.data as Fee[]) ?? [],
        complaints: (complaintsRes.data as Complaint[]) ?? [],
        visitors: (visitorsRes.data as Visitor[]) ?? [],
        notices: (noticesRes.data as Notice[]) ?? [],
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !data || !profile) {
    return (
      <>
        <PageHeader title="Dashboard" description="Loading overview..." />
        <PageSkeleton />
      </>
    );
  }

  const activeStudents = data.students.filter((s) => s.status === 'active').length;
  const availableRooms = data.rooms.filter((r) => r.status === 'available').length;
  const occupiedRooms = data.rooms.filter((r) => r.status === 'occupied').length;
  const pendingFees = data.fees.filter((f) => f.status === 'pending' || f.status === 'overdue');
  const pendingFeesTotal = pendingFees.reduce((sum, f) => sum + (f.amount - f.paid_amount), 0);
  const collectedFees = data.fees.filter((f) => f.status === 'paid').reduce((sum, f) => sum + f.paid_amount, 0);
  const openComplaints = data.complaints.filter((c) => c.status === 'open' || c.status === 'assigned').length;
  const activeVisitors = data.visitors.filter((v) => v.status === 'checked_in').length;

  const isStaffUser = isStaff(profile.role);

  // Charts data
  const monthlyAttendance = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Hostel Attendance %',
        data: [92, 95, 88, 91, 94, 90, 93],
        borderColor: '#1c80f5',
        backgroundColor: 'rgba(28, 128, 245, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: '#1c80f5',
        pointRadius: 4,
      },
      {
        label: 'Mess Attendance %',
        data: [85, 87, 82, 84, 88, 86, 89],
        borderColor: '#16b364',
        backgroundColor: 'rgba(22, 179, 100, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: '#16b364',
        pointRadius: 4,
      },
    ],
  };

  const roomOccupancy = {
    labels: ['Occupied', 'Available', 'Maintenance', 'Cleaning', 'Reserved'],
    datasets: [
      {
        data: [occupiedRooms, availableRooms, data.rooms.filter(r => r.status === 'maintenance').length, data.rooms.filter(r => r.status === 'cleaning').length, data.rooms.filter(r => r.status === 'reserved').length],
        backgroundColor: ['#1c80f5', '#16b364', '#ef4444', '#f29b0c', '#8b5cf6'],
        borderWidth: 0,
      },
    ],
  };

  const feeCollection = {
    labels: ['Admission', 'Mess', 'Electricity', 'Water', 'Laundry', 'Penalty'],
    datasets: [
      {
        label: 'Collected (₹)',
        data: [450000, 280000, 95000, 42000, 38000, 12000],
        backgroundColor: '#1c80f5',
        borderRadius: 8,
      },
      {
        label: 'Pending (₹)',
        data: [50000, 35000, 12000, 8000, 5000, 8000],
        backgroundColor: '#f29b0c',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
    },
  };

  const lineOptions = {
    ...chartOptions,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: { font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' as const, padding: 16 },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' as const, padding: 12 },
      },
    },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${profile.full_name.split(' ')[0]}`}
        description={`You're signed in as ${ROLE_LABELS[profile.role]}. Here's what's happening today.`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={activeStudents.toLocaleString()}
          icon={Users}
          color="primary"
          trend={{ value: '+8.2%', up: true }}
          subtitle="Active residents"
        />
        <StatCard
          title="Available Rooms"
          value={availableRooms}
          icon={DoorOpen}
          color="success"
          trend={{ value: '+3.1%', up: true }}
          subtitle={`${occupiedRooms} currently occupied`}
        />
        <StatCard
          title="Pending Fees"
          value={formatCurrency(pendingFeesTotal)}
          icon={IndianRupee}
          color="warning"
          trend={{ value: '-12.4%', up: false }}
          subtitle={`${pendingFees.length} pending payments`}
        />
        <StatCard
          title="Open Complaints"
          value={openComplaints}
          icon={MessageSquareWarning}
          color="error"
          trend={{ value: '+2', up: false }}
          subtitle="Needs attention"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Collected Fees', value: formatCurrency(collectedFees), icon: IndianRupee, color: 'text-success-600' },
          { label: 'Active Visitors', value: activeVisitors, icon: UserCheck, color: 'text-primary-600' },
          { label: 'Present Today', value: '1,124', icon: CalendarCheck, color: 'text-success-600' },
          { label: 'Notices Posted', value: data.notices.length, icon: Bell, color: 'text-accent-600' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 flex items-center gap-3 animate-fade-in-up">
            <div className={`w-10 h-10 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{stat.label}</p>
              <p className="text-lg font-display font-bold text-gray-900 dark:text-white truncate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Attendance Trends</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">Monthly hostel & mess attendance rate</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-success-600 dark:text-success-400">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">+3.2%</span>
            </div>
          </div>
          <div className="h-72">
            <Line data={monthlyAttendance} options={lineOptions} />
          </div>
        </div>

        <div className="card p-6 animate-fade-in-up">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Room Occupancy</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Current room status distribution</p>
          <div className="h-72">
            <Doughnut data={roomOccupancy} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Fee collection + utility usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Fee Collection Breakdown</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">Collected vs pending by fee type</p>
            </div>
          </div>
          <div className="h-72">
            <Bar data={feeCollection} options={chartOptions} />
          </div>
        </div>

        <div className="card p-6 animate-fade-in-up">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Utility Usage</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">This month's consumption</p>
          <div className="space-y-5">
            <UtilityBar icon={Zap} label="Electricity" value={12450} unit="kWh" max={15000} color="bg-accent-500" />
            <UtilityBar icon={Droplets} label="Water" value={8900} unit="L" max={12000} color="bg-primary-500" />
            <UtilityBar icon={Activity} label="Gas" value={320} unit="cylinders" max={400} color="bg-success-500" />
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent complaints */}
        <div className="card p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Complaints</h3>
            {isStaffUser && (
              <button
                onClick={() => navigate('/app/complaints')}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="space-y-3">
            {data.complaints.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500 py-6 text-center">No recent complaints</p>
            ) : (
              data.complaints.map((c) => (
                <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 flex items-center justify-center flex-shrink-0">
                    <MessageSquareWarning className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{c.category} · {timeAgo(c.created_at)}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent visitors */}
        <div className="card p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Visitors</h3>
            {isStaffUser && (
              <button
                onClick={() => navigate('/app/visitors')}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="space-y-3">
            {data.visitors.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500 py-6 text-center">No recent visitors</p>
            ) : (
              data.visitors.map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                    {v.visitor_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{v.visitor_name}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                      To meet: {v.whom_to_meet ?? '—'} · {timeAgo(v.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent notices */}
      <div className="card p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Notices</h3>
        </div>
        <div className="space-y-3">
          {data.notices.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 py-6 text-center">No notices posted yet</p>
          ) : (
            data.notices.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  n.is_pinned ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1">{n.content}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{timeAgo(n.created_at)}</p>
                </div>
                {n.is_pinned && <span className="badge-accent">Pinned</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function UtilityBar({
  icon: Icon,
  label,
  value,
  unit,
  max,
  color,
}: {
  icon: typeof Zap;
  label: string;
  value: number;
  unit: string;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400 dark:text-slate-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</span>
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {value.toLocaleString()} <span className="text-xs text-gray-400">{unit}</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
