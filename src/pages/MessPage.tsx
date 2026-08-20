import { useEffect, useState } from 'react';
import { UtensilsCrossed, Star, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isStaff } from '@/lib/types';
import type { MessMenuItem, MealFeedback, Student } from '@/lib/types';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { PageSkeleton } from '@/components/ui/Loader';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;
const MEAL_ICONS: Record<string, string> = { breakfast: '☀️', lunch: '🍲', snacks: '🍵', dinner: '🌙' };

export default function MessPage() {
  const { profile } = useAuth();
  const canEdit = profile ? isStaff(profile.role) : false;

  const [menu, setMenu] = useState<MessMenuItem[]>([]);
  const [feedback, setFeedback] = useState<MealFeedback[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [showAddFeedback, setShowAddFeedback] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [menuRes, feedbackRes, studentsRes] = await Promise.all([
      supabase.from('mess_menu').select('*'),
      supabase.from('meal_feedback').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('students').select('*'),
    ]);
    setMenu((menuRes.data as MessMenuItem[]) ?? []);
    setFeedback((feedbackRes.data as MealFeedback[]) ?? []);
    setStudents((studentsRes.data as Student[]) ?? []);
    setLoading(false);
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Mess" description="Weekly menu, meal feedback, and nutrition" icon={UtensilsCrossed} />
        <PageSkeleton />
      </>
    );
  }

  const avgRating = feedback.length > 0 ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : '—';
  const dayMenu = menu.filter(m => m.day_of_week === selectedDay);
  const studentLookup = new Map(students.map(s => [s.id, s]));

  return (
    <div>
      <PageHeader
        title="Mess Management"
        description="Weekly menu, meal feedback, and ratings"
        icon={UtensilsCrossed}
        actions={<button onClick={() => setShowAddFeedback(true)} className="btn-primary"><Plus className="w-4 h-4" /> Rate Meal</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Avg Rating" value={`${avgRating} / 5`} icon={Star} color="accent" />
        <StatCard title="Total Feedback" value={feedback.length} icon={Star} color="primary" />
        <StatCard title="Menu Items" value={menu.length} icon={UtensilsCrossed} color="success" />
      </div>

      {/* Day selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {DAYS.map((day, i) => (
          <button
            key={day}
            onClick={() => setSelectedDay(i)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedDay === i
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Menu for selected day */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {MEAL_TYPES.map(mealType => {
          const item = dayMenu.find(m => m.meal_type === mealType);
          return (
            <div key={mealType} className="card p-5 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{MEAL_ICONS[mealType]}</span>
                <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{mealType}</h3>
              </div>
              {item ? (
                <p className="text-sm text-gray-600 dark:text-slate-300">{item.menu_items}</p>
              ) : (
                <p className="text-sm text-gray-400 dark:text-slate-500 italic">No menu set</p>
              )}
              {item?.special_request && (
                <p className="text-xs text-accent-600 dark:text-accent-400 mt-2">Special: {item.special_request}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent feedback */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Meal Feedback</h3>
        {feedback.length === 0 ? (
          <EmptyState icon={Star} title="No feedback yet" description="Student meal ratings will appear here." />
        ) : (
          <div className="space-y-3">
            {feedback.map(f => {
              const student = studentLookup.get(f.student_id);
              return (
                <div key={f.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < f.rating ? 'text-accent-400 fill-accent-400' : 'text-gray-300 dark:text-slate-700'}`} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{student?.full_name ?? 'Student'} · <span className="capitalize text-gray-500">{f.meal_type}</span></p>
                    {f.comment && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{f.comment}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddFeedback && (
        <AddFeedbackModal students={students} onClose={() => setShowAddFeedback(false)} onSaved={() => { setShowAddFeedback(false); loadData(); }} />
      )}
    </div>
  );
}

function AddFeedbackModal({ students, onClose, onSaved }: { students: Student[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ student_id: '', meal_type: 'breakfast' as 'breakfast' | 'lunch' | 'snacks' | 'dinner', rating: 4, comment: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error: err } = await supabase.from('meal_feedback').insert({
      student_id: form.student_id,
      meal_type: form.meal_type,
      rating: form.rating,
      comment: form.comment || null,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Rate a Meal</h2>
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
            <label className="label">Meal Type</label>
            <select value={form.meal_type} onChange={e => setForm({ ...form, meal_type: e.target.value as typeof form.meal_type })} className="input">
              {MEAL_TYPES.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} type="button" onClick={() => setForm({ ...form, rating: r })}>
                  <Star className={`w-8 h-8 ${r <= form.rating ? 'text-accent-400 fill-accent-400' : 'text-gray-300 dark:text-slate-700'}`} />
                </button>
              ))}
            </div>
          </div>
          <div><label className="label">Comment</label><textarea value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} className="input min-h-[80px]" placeholder="How was the meal?" /></div>
          {error && <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-300">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Submit Rating'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
