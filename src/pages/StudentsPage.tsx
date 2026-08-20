import { useEffect, useState } from 'react';
import { Search, Plus, Filter, Download, QrCode, Eye, Edit3, Trash2, Users, Phone, Mail, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isAdmin } from '@/lib/types';
import type { Student, Block, Floor, Room } from '@/lib/types';
import { formatDate, getInitials } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Loader';

const COURSES = ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'B.Com', 'B.A', 'PhD'];
const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'BME'];
const YEARS = [1, 2, 3, 4, 5];

export default function StudentsPage() {
  const { profile } = useAuth();
  const canEdit = profile ? isAdmin(profile.role) : false;

  const [students, setStudents] = useState<Student[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    loadBlocks();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [search, statusFilter, yearFilter, deptFilter, page]);

  async function loadBlocks() {
    const { data } = await supabase.from('blocks').select('*');
    setBlocks((data as Block[]) ?? []);
    const { data: roomsData } = await supabase.from('rooms').select('*');
    setRooms((roomsData as Room[]) ?? []);
  }

  async function loadStudents() {
    setLoading(true);
    let query = supabase
      .from('students')
      .select('*', { count: 'exact' })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,roll_number.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (yearFilter !== 'all') query = query.eq('year', Number(yearFilter));
    if (deptFilter !== 'all') query = query.eq('department', deptFilter);

    const { data, count } = await query;
    setStudents((data as Student[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Students"
        description="Manage hostel residents, profiles, and room assignments"
        icon={Users}
        actions={
          canEdit && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          )
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total" value={total} icon={Users} color="primary" />
        <StatCard title="Active" value={students.filter(s => s.status === 'active').length} icon={Users} color="success" />
        <StatCard title="Pending Fees" value={students.filter(s => s.fee_status === 'pending').length} icon={Users} color="warning" />
        <StatCard title="Suspended" value={students.filter(s => s.status === 'suspended').length} icon={Users} color="error" />
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, roll number, or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="input pl-9"
            />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }} className="input lg:w-40">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
            <option value="suspended">Suspended</option>
          </select>
          <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(0); }} className="input lg:w-32">
            <option value="all">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
          </select>
          <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(0); }} className="input lg:w-32">
            <option value="all">All Depts</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : students.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No students found"
            description="Try adjusting your filters or add a new student to get started."
            action={canEdit && <button onClick={() => setShowAddModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Student</button>}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Roll No</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">Course</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">Fee Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-primary text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {s.photo_url ? <img src={s.photo_url} alt={s.full_name} className="w-full h-full rounded-full object-cover" /> : getInitials(s.full_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.full_name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{s.email ?? s.phone ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm font-mono text-gray-600 dark:text-slate-300">{s.roll_number}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-sm text-gray-700 dark:text-slate-200">{s.course}</div>
                      <div className="text-xs text-gray-400 dark:text-slate-500">{s.department} · Year {s.year}</div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <StatusBadge status={s.fee_status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedStudent(s)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-slate-700 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button onClick={() => setSelectedStudent(s)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-slate-700 transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-800">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          blocks={blocks}
          rooms={rooms}
          canEdit={canEdit}
          onClose={() => setSelectedStudent(null)}
          onUpdate={loadStudents}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddStudentModal
          blocks={blocks}
          rooms={rooms}
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); loadStudents(); }}
        />
      )}
    </div>
  );
}

function StudentDetailModal({
  student,
  blocks,
  rooms,
  canEdit,
  onClose,
  onUpdate,
}: {
  student: Student;
  blocks: Block[];
  rooms: Room[];
  canEdit: boolean;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const block = blocks.find(b => b.id === student.block_id);
  const room = rooms.find(r => r.id === student.room_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Student Details</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-primary text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {student.photo_url ? <img src={student.photo_url} alt={student.full_name} className="w-full h-full rounded-2xl object-cover" /> : getInitials(student.full_name)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{student.full_name}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-mono">{student.roll_number}</p>
              <div className="flex gap-2 mt-2">
                <StatusBadge status={student.status} />
                <StatusBadge status={student.fee_status} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label="Email" value={student.email ?? '—'} icon={Mail} />
            <DetailField label="Phone" value={student.phone ?? '—'} icon={Phone} />
            <DetailField label="Course" value={`${student.course} · ${student.department}`} />
            <DetailField label="Year" value={`Year ${student.year}`} />
            <DetailField label="Block" value={block?.name ?? 'Not assigned'} />
            <DetailField label="Room" value={room?.room_number ?? 'Not assigned'} />
            <DetailField label="Blood Group" value={student.blood_group ?? '—'} />
            <DetailField label="Mess Plan" value={student.mess_plan} />
            <DetailField label="Emergency Contact" value={student.emergency_contact_name ?? '—'} />
            <DetailField label="Emergency Phone" value={student.emergency_contact_phone ?? '—'} />
            <DetailField label="Joined" value={formatDate(student.created_at)} />
            <DetailField label="Medical History" value={student.medical_history ?? 'None'} />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary">Close</button>
            {canEdit && (
              <button onClick={() => { onUpdate(); onClose(); }} className="btn-primary">
                <Edit3 className="w-4 h-4" /> Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Mail }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{value}</p>
      </div>
    </div>
  );
}

function AddStudentModal({
  blocks,
  rooms,
  onClose,
  onSaved,
}: {
  blocks: Block[];
  rooms: Room[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    full_name: '',
    roll_number: '',
    email: '',
    phone: '',
    course: COURSES[0],
    department: DEPARTMENTS[0],
    year: 1,
    blood_group: 'O+',
    mess_plan: 'standard',
    block_id: '',
    room_id: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('students').insert({
      full_name: form.full_name,
      roll_number: form.roll_number,
      email: form.email || null,
      phone: form.phone || null,
      course: form.course,
      department: form.department,
      year: form.year,
      blood_group: form.blood_group,
      mess_plan: form.mess_plan,
      block_id: form.block_id || null,
      room_id: form.room_id || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-thin animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Add New Student</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="input" placeholder="John Doe" />
            </div>
            <div>
              <label className="label">Roll Number *</label>
              <input required value={form.roll_number} onChange={e => setForm({ ...form, roll_number: e.target.value })} className="input font-mono" placeholder="BTECH001" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" placeholder="john@edu.in" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="label">Course</label>
              <select value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} className="input">
                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="input">
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <select value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} className="input">
                {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Blood Group</label>
              <select value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })} className="input">
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Block</label>
              <select value={form.block_id} onChange={e => setForm({ ...form, block_id: e.target.value })} className="input">
                <option value="">— Select Block —</option>
                {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Room</label>
              <select value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })} className="input">
                <option value="">— Select Room —</option>
                {rooms.filter(r => r.status === 'available' || r.id === form.room_id).map(r => <option key={r.id} value={r.id}>{r.room_number} ({r.sharing_type})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Emergency Contact Name</label>
              <input value={form.emergency_contact_name} onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })} className="input" placeholder="Parent/Guardian" />
            </div>
            <div>
              <label className="label">Emergency Contact Phone</label>
              <input value={form.emergency_contact_phone} onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })} className="input" placeholder="+91 ..." />
            </div>
          </div>

          {error && <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-300">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Student'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
