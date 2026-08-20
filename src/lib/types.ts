export type UserRole =
  | 'super_admin'
  | 'hostel_admin'
  | 'warden'
  | 'security_guard'
  | 'student'
  | 'parents'
  | 'receptionist';

export type FeeStatus = 'paid' | 'partial' | 'pending' | 'overdue';
export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved';
export type SharingType = 'single' | 'double' | 'triple' | 'luxury';
export type ComplaintStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';
export type ComplaintCategory =
  | 'general'
  | 'electrical'
  | 'plumbing'
  | 'cleaning'
  | 'furniture'
  | 'wifi'
  | 'mess'
  | 'security'
  | 'other';
export type VisitorStatus = 'pending' | 'checked_in' | 'checked_out' | 'blacklisted';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type AttendanceType = 'hostel' | 'night' | 'mess';
export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'late';
export type MaintenanceStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type LaundryStatus =
  | 'booked'
  | 'picked_up'
  | 'in_wash'
  | 'ready'
  | 'delivered'
  | 'cancelled';
export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'suspended';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Block {
  id: string;
  name: string;
  code: string;
  total_floors: number;
  description: string | null;
  created_at: string;
}

export interface Floor {
  id: string;
  block_id: string;
  floor_number: number;
  name: string;
  created_at: string;
}

export interface Room {
  id: string;
  floor_id: string;
  room_number: string;
  sharing_type: SharingType;
  capacity: number;
  occupied_count: number;
  status: RoomStatus;
  monthly_rent: number;
  photo_url: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  profile_id: string | null;
  roll_number: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  qr_code: string | null;
  block_id: string | null;
  floor_id: string | null;
  room_id: string | null;
  course: string;
  department: string;
  year: number;
  blood_group: string | null;
  aadhaar_number: string | null;
  medical_history: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  mess_plan: 'standard' | 'premium' | 'none';
  fee_status: FeeStatus;
  status: StudentStatus;
  guardian_id: string | null;
  created_at: string;
}

export interface Guardian {
  id: string;
  student_id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  occupation: string | null;
  address: string | null;
  created_at: string;
}

export interface Fee {
  id: string;
  student_id: string;
  fee_type:
    | 'admission'
    | 'security_deposit'
    | 'mess'
    | 'electricity'
    | 'water'
    | 'laundry'
    | 'penalty'
    | 'late_fine';
  amount: number;
  paid_amount: number;
  status: FeeStatus;
  due_date: string | null;
  paid_date: string | null;
  description: string | null;
  created_at: string;
}

export interface Visitor {
  id: string;
  visitor_name: string;
  phone: string;
  photo_url: string | null;
  qr_code: string | null;
  otp_code: string | null;
  purpose: string | null;
  whom_to_meet: string | null;
  whom_to_meet_id: string | null;
  entry_time: string | null;
  exit_time: string | null;
  status: VisitorStatus;
  verified_by: string | null;
  created_at: string;
}

export interface Complaint {
  id: string;
  student_id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: ComplaintStatus;
  image_url: string | null;
  assigned_to: string | null;
  admin_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  date: string;
  type: AttendanceType;
  status: AttendanceStatus;
  marked_by: string | null;
  created_at: string;
}

export interface Leave {
  id: string;
  student_id: string;
  from_date: string;
  to_date: string;
  reason: string;
  destination: string | null;
  parent_status: LeaveStatus;
  parent_approved_by: string | null;
  warden_status: LeaveStatus;
  warden_approved_by: string | null;
  qr_exit_pass: string | null;
  qr_entry_pass: string | null;
  actual_exit: string | null;
  actual_return: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  total_quantity: number;
  available_quantity: number;
  condition_status: 'good' | 'fair' | 'damaged' | 'repairing';
  room_id: string | null;
  purchase_date: string | null;
  vendor: string | null;
  cost: number | null;
  created_at: string;
}

export interface MessMenuItem {
  id: string;
  day_of_week: number;
  meal_type: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
  menu_items: string;
  special_request: string | null;
  created_at: string;
}

export interface MealFeedback {
  id: string;
  student_id: string;
  meal_type: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
  rating: number;
  comment: string | null;
  date: string;
  created_at: string;
}

export interface Laundry {
  id: string;
  student_id: string;
  booking_date: string;
  clothes_count: number;
  status: LaundryStatus;
  pickup_time: string | null;
  delivery_time: string | null;
  charge: number;
  payment_status: 'paid' | 'pending';
  created_at: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'urgent' | 'event' | 'maintenance' | 'fee' | 'mess' | 'holiday' | 'other';
  is_pinned: boolean;
  image_url: string | null;
  pdf_url: string | null;
  posted_by: string | null;
  created_at: string;
}

export interface Maintenance {
  id: string;
  title: string;
  description: string | null;
  category: 'electrical' | 'plumbing' | 'carpenter' | 'cleaning' | 'lift' | 'water' | 'electricity' | 'other';
  room_id: string | null;
  status: MaintenanceStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_staff: string | null;
  cost: number;
  completed_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  hostel_admin: 'Hostel Admin',
  warden: 'Warden',
  security_guard: 'Security Guard',
  student: 'Student',
  parents: 'Parents',
  receptionist: 'Receptionist',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: 'Full system access and configuration',
  hostel_admin: 'Manage all hostel operations and staff',
  warden: 'Manage students, rooms, complaints, leaves',
  security_guard: 'Manage visitors and verify exits/entries',
  student: 'View own profile, fees, complaints, leave',
  parents: 'View child info and approve leave requests',
  receptionist: 'Manage visitors, fees, and student check-in',
};

export const STAFF_ROLES: UserRole[] = [
  'super_admin',
  'hostel_admin',
  'warden',
  'security_guard',
  'receptionist',
];

export function isStaff(role: UserRole | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role);
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'super_admin' || role === 'hostel_admin';
}
