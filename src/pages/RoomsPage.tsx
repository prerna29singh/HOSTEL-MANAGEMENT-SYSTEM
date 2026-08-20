import { useEffect, useState } from 'react';
import { DoorOpen, Plus, Users, Building2, Layers, X, Wrench } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { isAdmin } from '@/lib/types';
import type { Block, Floor, Room, SharingType, RoomStatus } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { PageSkeleton } from '@/components/ui/Loader';

const SHARING_LABELS: Record<SharingType, string> = {
  single: 'Single Sharing',
  double: 'Double Sharing',
  triple: 'Triple Sharing',
  luxury: 'Luxury Room',
};

const STATUS_COLORS: Record<RoomStatus, string> = {
  available: 'border-success-300 bg-success-50 dark:bg-success-900/20 dark:border-success-800',
  occupied: 'border-primary-300 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-800',
  maintenance: 'border-error-300 bg-error-50 dark:bg-error-900/20 dark:border-error-800',
  cleaning: 'border-warning-300 bg-warning-50 dark:bg-warning-900/20 dark:border-warning-800',
  reserved: 'border-violet-300 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-800',
};

export default function RoomsPage() {
  const { profile } = useAuth();
  const canEdit = profile ? isAdmin(profile.role) : false;

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [showAddRoom, setShowAddRoom] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [blocksRes, floorsRes, roomsRes] = await Promise.all([
      supabase.from('blocks').select('*').order('name'),
      supabase.from('floors').select('*').order('floor_number'),
      supabase.from('rooms').select('*').order('room_number'),
    ]);
    setBlocks((blocksRes.data as Block[]) ?? []);
    setFloors((floorsRes.data as Floor[]) ?? []);
    setRooms((roomsRes.data as Room[]) ?? []);
    setLoading(false);
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Rooms" description="Manage blocks, floors, and room allocations" icon={DoorOpen} />
        <PageSkeleton />
      </>
    );
  }

  const filteredRooms = selectedBlock === 'all'
    ? rooms
    : rooms.filter(r => {
        const floor = floors.find(f => f.id === r.floor_id);
        return floor?.block_id === selectedBlock;
      });

  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const totalOccupied = rooms.reduce((sum, r) => sum + r.occupied_count, 0);
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  // Group rooms by floor
  const floorsWithRooms = floors
    .filter(f => selectedBlock === 'all' || f.block_id === selectedBlock)
    .map(floor => ({
      ...floor,
      block: blocks.find(b => b.id === floor.block_id),
      rooms: filteredRooms.filter(r => r.floor_id === floor.id),
    }))
    .filter(f => f.rooms.length > 0);

  return (
    <div>
      <PageHeader
        title="Rooms"
        description="Manage blocks, floors, and room allocations"
        icon={DoorOpen}
        actions={canEdit && <button onClick={() => setShowAddRoom(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Room</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Blocks" value={blocks.length} icon={Building2} color="primary" />
        <StatCard title="Total Rooms" value={rooms.length} icon={DoorOpen} color="accent" />
        <StatCard title="Available" value={availableRooms} icon={DoorOpen} color="success" subtitle={`${occupancyRate}% occupied`} />
        <StatCard title="Capacity" value={`${totalOccupied}/${totalCapacity}`} icon={Users} color="warning" subtitle="Beds occupied" />
      </div>

      {/* Block filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedBlock('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedBlock === 'all'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
          }`}
        >
          All Blocks
        </button>
        {blocks.map(b => (
          <button
            key={b.id}
            onClick={() => setSelectedBlock(b.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedBlock === b.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Floors with rooms */}
      {floorsWithRooms.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={DoorOpen}
            title="No rooms configured"
            description="Add blocks, floors, and rooms to start managing hostel allocations."
            action={canEdit && <button onClick={() => setShowAddRoom(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Room</button>}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {floorsWithRooms.map(floor => (
            <div key={floor.id} className="card p-5 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">{floor.name}</h3>
                <span className="text-sm text-gray-400 dark:text-slate-500">· {floor.block?.name}</span>
                <span className="ml-auto text-sm text-gray-500 dark:text-slate-400">
                  {floor.rooms.filter(r => r.status === 'available').length} available
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {floor.rooms.map(room => (
                  <div
                    key={room.id}
                    className={`rounded-xl border-2 p-3 transition-all hover:shadow-card-hover cursor-pointer ${STATUS_COLORS[room.status]}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{room.room_number}</span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">{SHARING_LABELS[room.sharing_type].split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-slate-300">
                        {room.occupied_count}/{room.capacity} beds
                      </span>
                      <StatusBadge status={room.status} />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {formatCurrency(room.monthly_rent)}/mo
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddRoom && (
        <AddRoomModal
          blocks={blocks}
          floors={floors}
          onClose={() => setShowAddRoom(false)}
          onSaved={() => { setShowAddRoom(false); loadData(); }}
        />
      )}
    </div>
  );
}

function AddRoomModal({
  blocks,
  floors,
  onClose,
  onSaved,
}: {
  blocks: Block[];
  floors: Floor[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    room_number: '',
    floor_id: '',
    sharing_type: 'double' as SharingType,
    capacity: 2,
    monthly_rent: 8000,
    status: 'available' as RoomStatus,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('rooms').insert({
      room_number: form.room_number,
      floor_id: form.floor_id,
      sharing_type: form.sharing_type,
      capacity: form.capacity,
      monthly_rent: form.monthly_rent,
      status: form.status,
      occupied_count: 0,
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Add Room</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Room Number *</label>
            <input required value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} className="input" placeholder="204" />
          </div>
          <div>
            <label className="label">Floor *</label>
            <select required value={form.floor_id} onChange={e => setForm({ ...form, floor_id: e.target.value })} className="input">
              <option value="">— Select Floor —</option>
              {floors.map(f => {
                const block = blocks.find(b => b.id === f.block_id);
                return <option key={f.id} value={f.id}>{block?.name} — {f.name}</option>;
              })}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Sharing Type</label>
              <select value={form.sharing_type} onChange={e => setForm({ ...form, sharing_type: e.target.value as SharingType, capacity: e.target.value === 'single' ? 1 : e.target.value === 'triple' ? 3 : e.target.value === 'luxury' ? 1 : 2 })} className="input">
                {Object.entries(SHARING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Capacity</label>
              <input type="number" min={1} max={6} value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Monthly Rent (₹)</label>
              <input type="number" min={0} value={form.monthly_rent} onChange={e => setForm({ ...form, monthly_rent: Number(e.target.value) })} className="input" />
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as RoomStatus })} className="input">
                {['available', 'occupied', 'maintenance', 'cleaning', 'reserved'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/30 dark:border-error-800 dark:text-error-300">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Room'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
