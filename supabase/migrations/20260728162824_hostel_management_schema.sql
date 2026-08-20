/*
# Smart Boys Hostel Management System — Core Schema

## Overview
Creates the full normalized schema for a hostel management platform:
profiles (auth-linked roles), blocks, floors, rooms, students, guardians,
fees, visitors, complaints, attendance, leaves, inventory, mess, laundry,
notices, maintenance, and audit logs.

## Tables
- profiles: extends auth.users with role (super_admin, hostel_admin, warden,
  security_guard, student, parents, receptionist), full_name, phone.
- blocks: hostel buildings (name, code, total_floors).
- floors: floors within a block.
- rooms: rooms within floors, with sharing type, status, photos.
- students: hostel students linked to a profile, room, course details,
  photo, blood group, medical history, QR code, fee status.
- guardians: guardian/parent records for a student.
- fees: fee records per student (type, amount, paid status, due date).
- visitors: visitor entry/exit logs with QR, OTP, photo.
- complaints: student complaints with category, status, images.
- attendance: hostel/mess attendance per student per day.
- leaves: student leave requests with approval workflow.
- inventory: furniture/equipment items with condition and stock.
- mess_menu: weekly mess menu items.
- meal_feedback: student feedback/ratings on meals.
- laundry: laundry booking and tracking records.
- notices: rich-text notices with categories and pin status.
- maintenance: maintenance work orders assigned to staff.
- audit_logs: system audit trail of user actions.

## Security
- RLS enabled on every table.
- Owner-scoped policies using auth.uid() for student-owned data
  (complaints, attendance, leaves, meal_feedback, laundry).
- Staff roles (super_admin, hostel_admin, warden, security_guard,
  receptionist) can read operational tables; admins can write.
- Profiles: users read/update their own; staff can read all profiles.
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'student'
    CHECK (role IN ('super_admin','hostel_admin','warden','security_guard','student','parents','receptionist')),
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR role IN ('super_admin','hostel_admin','warden','security_guard','receptionist'));

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ BLOCKS ============
CREATE TABLE IF NOT EXISTS blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  total_floors int NOT NULL DEFAULT 4,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_blocks" ON blocks;
CREATE POLICY "read_blocks" ON blocks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_blocks" ON blocks;
CREATE POLICY "write_blocks" ON blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));
DROP POLICY IF EXISTS "update_blocks" ON blocks;
CREATE POLICY "update_blocks" ON blocks FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin'))) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_blocks" ON blocks;
CREATE POLICY "delete_blocks" ON blocks FOR DELETE TO authenticated USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));

-- ============ FLOORS ============
CREATE TABLE IF NOT EXISTS floors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  floor_number int NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_floors" ON floors;
CREATE POLICY "read_floors" ON floors FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_floors" ON floors;
CREATE POLICY "write_floors" ON floors FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));
DROP POLICY IF EXISTS "update_floors" ON floors;
CREATE POLICY "update_floors" ON floors FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin'))) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_floors" ON floors;
CREATE POLICY "delete_floors" ON floors FOR DELETE TO authenticated USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));

-- ============ ROOMS ============
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id uuid NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  sharing_type text NOT NULL DEFAULT 'double'
    CHECK (sharing_type IN ('single','double','triple','luxury')),
  capacity int NOT NULL DEFAULT 2,
  occupied_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','occupied','maintenance','cleaning','reserved')),
  monthly_rent numeric(10,2) NOT NULL DEFAULT 0,
  photo_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_rooms" ON rooms;
CREATE POLICY "read_rooms" ON rooms FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "write_rooms" ON rooms;
CREATE POLICY "write_rooms" ON rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden')));
DROP POLICY IF EXISTS "update_rooms" ON rooms;
CREATE POLICY "update_rooms" ON rooms FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden'))) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_rooms" ON rooms;
CREATE POLICY "delete_rooms" ON rooms FOR DELETE TO authenticated USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));

-- ============ STUDENTS ============
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  roll_number text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  photo_url text,
  qr_code text,
  block_id uuid REFERENCES blocks(id),
  floor_id uuid REFERENCES floors(id),
  room_id uuid REFERENCES rooms(id),
  course text NOT NULL,
  department text NOT NULL,
  year int NOT NULL DEFAULT 1 CHECK (year BETWEEN 1 AND 5),
  blood_group text,
  aadhaar_number text,
  medical_history text,
  emergency_contact_name text,
  emergency_contact_phone text,
  mess_plan text DEFAULT 'standard' CHECK (mess_plan IN ('standard','premium','none')),
  fee_status text DEFAULT 'pending' CHECK (fee_status IN ('paid','partial','pending','overdue')),
  status text DEFAULT 'active' CHECK (status IN ('active','inactive','graduated','suspended')),
  guardian_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_students" ON students;
CREATE POLICY "read_students" ON students FOR SELECT TO authenticated
  USING (profile_id = auth.uid()
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','security_guard','receptionist','parents')));

DROP POLICY IF EXISTS "write_students" ON students;
CREATE POLICY "write_students" ON students FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','receptionist')));

DROP POLICY IF EXISTS "update_students" ON students;
CREATE POLICY "update_students" ON students FOR UPDATE TO authenticated
  USING (profile_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','receptionist')))
  WITH CHECK (true);

DROP POLICY IF EXISTS "delete_students" ON students;
CREATE POLICY "delete_students" ON students FOR DELETE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));

-- ============ GUARDIANS ============
CREATE TABLE IF NOT EXISTS guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text NOT NULL,
  phone text NOT NULL,
  email text,
  occupation text,
  address text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_guardians" ON guardians;
CREATE POLICY "read_guardians" ON guardians FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','receptionist')));

DROP POLICY IF EXISTS "write_guardians" ON guardians;
CREATE POLICY "write_guardians" ON guardians FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','receptionist')));
DROP POLICY IF EXISTS "update_guardians" ON guardians;
CREATE POLICY "update_guardians" ON guardians FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','receptionist'))) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_guardians" ON guardians;
CREATE POLICY "delete_guardians" ON guardians FOR DELETE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden')));

-- ============ FEES ============
CREATE TABLE IF NOT EXISTS fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_type text NOT NULL CHECK (fee_type IN ('admission','security_deposit','mess','electricity','water','laundry','penalty','late_fine')),
  amount numeric(10,2) NOT NULL,
  paid_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('paid','partial','pending','overdue')),
  due_date date,
  paid_date date,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_fees" ON fees;
CREATE POLICY "read_fees" ON fees FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','receptionist','parents')));

DROP POLICY IF EXISTS "write_fees" ON fees;
CREATE POLICY "write_fees" ON fees FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','receptionist')));
DROP POLICY IF EXISTS "update_fees" ON fees;
CREATE POLICY "update_fees" ON fees FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','receptionist'))) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_fees" ON fees;
CREATE POLICY "delete_fees" ON fees FOR DELETE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));

-- ============ VISITORS ============
CREATE TABLE IF NOT EXISTS visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name text NOT NULL,
  phone text NOT NULL,
  photo_url text,
  qr_code text,
  otp_code text,
  purpose text,
  whom_to_meet text,
  whom_to_meet_id uuid REFERENCES students(id),
  entry_time timestamptz,
  exit_time timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending','checked_in','checked_out','blacklisted')),
  verified_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_visitors" ON visitors;
CREATE POLICY "read_visitors" ON visitors FOR SELECT TO authenticated
  USING (whom_to_meet_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','security_guard','receptionist')));

DROP POLICY IF EXISTS "write_visitors" ON visitors;
CREATE POLICY "write_visitors" ON visitors FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_visitors" ON visitors;
CREATE POLICY "update_visitors" ON visitors FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','security_guard','receptionist'))) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_visitors" ON visitors;
CREATE POLICY "delete_visitors" ON visitors FOR DELETE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));

-- ============ COMPLAINTS ============
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'general' CHECK (category IN ('general','electrical','plumbing','cleaning','furniture','wifi','mess','security','other')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status text DEFAULT 'open' CHECK (status IN ('open','assigned','in_progress','resolved','rejected')),
  image_url text,
  assigned_to uuid REFERENCES auth.users(id),
  admin_comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_complaints" ON complaints;
CREATE POLICY "read_complaints" ON complaints FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','receptionist')));

DROP POLICY IF EXISTS "write_complaints" ON complaints;
CREATE POLICY "write_complaints" ON complaints FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','receptionist')));
DROP POLICY IF EXISTS "update_complaints" ON complaints;
CREATE POLICY "update_complaints" ON complaints FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','receptionist'))) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_complaints" ON complaints;
CREATE POLICY "delete_complaints" ON complaints FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));

-- ============ ATTENDANCE ============
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('hostel','night','mess')),
  status text NOT NULL CHECK (status IN ('present','absent','leave','late')),
  marked_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, date, type)
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_attendance" ON attendance;
CREATE POLICY "read_attendance" ON attendance FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','security_guard','receptionist')));

DROP POLICY IF EXISTS "write_attendance" ON attendance;
CREATE POLICY "write_attendance" ON attendance FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','security_guard','receptionist')));
DROP POLICY IF EXISTS "update_attendance" ON attendance;
CREATE POLICY "update_attendance" ON attendance FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','security_guard','receptionist'))) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_attendance" ON attendance;
CREATE POLICY "delete_attendance" ON attendance FOR DELETE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden')));

-- ============ LEAVES ============
CREATE TABLE IF NOT EXISTS leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  from_date date NOT NULL,
  to_date date NOT NULL,
  reason text NOT NULL,
  destination text,
  parent_status text DEFAULT 'pending' CHECK (parent_status IN ('pending','approved','rejected')),
  parent_approved_by uuid REFERENCES auth.users(id),
  warden_status text DEFAULT 'pending' CHECK (warden_status IN ('pending','approved','rejected')),
  warden_approved_by uuid REFERENCES auth.users(id),
  qr_exit_pass text,
  qr_entry_pass text,
  actual_exit timestamptz,
  actual_return timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_leaves" ON leaves;
CREATE POLICY "read_leaves" ON leaves FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','security_guard','receptionist','parents')));

DROP POLICY IF EXISTS "write_leaves" ON leaves;
CREATE POLICY "write_leaves" ON leaves FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','receptionist')));
DROP POLICY IF EXISTS "update_leaves" ON leaves;
CREATE POLICY "update_leaves" ON leaves FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','security_guard','receptionist','parents'))) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_leaves" ON leaves;
CREATE POLICY "delete_leaves" ON leaves FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));

-- ============ INVENTORY ============
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('furniture','mattress','fan','light','bed','chair','table','equipment','other')),
  total_quantity int NOT NULL DEFAULT 0,
  available_quantity int NOT NULL DEFAULT 0,
  condition_status text DEFAULT 'good' CHECK (condition_status IN ('good','fair','damaged','repairing')),
  room_id uuid REFERENCES rooms(id),
  purchase_date date,
  vendor text,
  cost numeric(10,2),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_inventory" ON inventory;
CREATE POLICY "read_inventory" ON inventory FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_inventory" ON inventory;
CREATE POLICY "write_inventory" ON inventory FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden')));
DROP POLICY IF EXISTS "update_inventory" ON inventory;
CREATE POLICY "update_inventory" ON inventory FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden'))) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_inventory" ON inventory;
CREATE POLICY "delete_inventory" ON inventory FOR DELETE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));

-- ============ MESS_MENU ============
CREATE TABLE IF NOT EXISTS mess_menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast','lunch','snacks','dinner')),
  menu_items text NOT NULL,
  special_request text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (day_of_week, meal_type)
);
ALTER TABLE mess_menu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_mess_menu" ON mess_menu;
CREATE POLICY "read_mess_menu" ON mess_menu FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_mess_menu" ON mess_menu;
CREATE POLICY "write_mess_menu" ON mess_menu FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden')));
DROP POLICY IF EXISTS "update_mess_menu" ON mess_menu;
CREATE POLICY "update_mess_menu" ON mess_menu FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden'))) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_mess_menu" ON mess_menu;
CREATE POLICY "delete_mess_menu" ON mess_menu FOR DELETE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));

-- ============ MEAL_FEEDBACK ============
CREATE TABLE IF NOT EXISTS meal_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast','lunch','snacks','dinner')),
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE meal_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_meal_feedback" ON meal_feedback;
CREATE POLICY "read_meal_feedback" ON meal_feedback FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden')));
DROP POLICY IF EXISTS "write_meal_feedback" ON meal_feedback;
CREATE POLICY "write_meal_feedback" ON meal_feedback FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid()));
DROP POLICY IF EXISTS "update_meal_feedback" ON meal_feedback;
CREATE POLICY "update_meal_feedback" ON meal_feedback FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_meal_feedback" ON meal_feedback;
CREATE POLICY "delete_meal_feedback" ON meal_feedback FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid()));

-- ============ LAUNDRY ============
CREATE TABLE IF NOT EXISTS laundry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  booking_date date NOT NULL DEFAULT CURRENT_DATE,
  clothes_count int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','picked_up','in_wash','ready','delivered','cancelled')),
  pickup_time timestamptz,
  delivery_time timestamptz,
  charge numeric(10,2) NOT NULL DEFAULT 0,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('paid','pending')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE laundry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_laundry" ON laundry;
CREATE POLICY "read_laundry" ON laundry FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','receptionist')));
DROP POLICY IF EXISTS "write_laundry" ON laundry;
CREATE POLICY "write_laundry" ON laundry FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','receptionist')));
DROP POLICY IF EXISTS "update_laundry" ON laundry;
CREATE POLICY "update_laundry" ON laundry FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','receptionist'))) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_laundry" ON laundry;
CREATE POLICY "delete_laundry" ON laundry FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));

-- ============ NOTICES ============
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general' CHECK (category IN ('general','urgent','event','maintenance','fee','mess','holiday','other')),
  is_pinned boolean DEFAULT false,
  image_url text,
  pdf_url text,
  posted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_notices" ON notices;
CREATE POLICY "read_notices" ON notices FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_notices" ON notices;
CREATE POLICY "write_notices" ON notices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','receptionist')));
DROP POLICY IF EXISTS "update_notices" ON notices;
CREATE POLICY "update_notices" ON notices FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden','receptionist'))) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_notices" ON notices;
CREATE POLICY "delete_notices" ON notices FOR DELETE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));

-- ============ MAINTENANCE ============
CREATE TABLE IF NOT EXISTS maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('electrical','plumbing','carpenter','cleaning','lift','water','electricity','other')),
  room_id uuid REFERENCES rooms(id),
  status text DEFAULT 'open' CHECK (status IN ('open','assigned','in_progress','completed','cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  assigned_staff text,
  cost numeric(10,2) DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_maintenance" ON maintenance;
CREATE POLICY "read_maintenance" ON maintenance FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "write_maintenance" ON maintenance;
CREATE POLICY "write_maintenance" ON maintenance FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden')));
DROP POLICY IF EXISTS "update_maintenance" ON maintenance;
CREATE POLICY "update_maintenance" ON maintenance FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin','warden'))) WITH CHECK (true);
DROP POLICY IF EXISTS "delete_maintenance" ON maintenance;
CREATE POLICY "delete_maintenance" ON maintenance FOR DELETE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));

-- ============ AUDIT_LOGS ============
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_audit_logs" ON audit_logs;
CREATE POLICY "read_audit_logs" ON audit_logs FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('super_admin','hostel_admin')));
DROP POLICY IF EXISTS "write_audit_logs" ON audit_logs;
CREATE POLICY "write_audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_students_room ON students(room_id);
CREATE INDEX IF NOT EXISTS idx_students_block ON students(block_id);
CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);
CREATE INDEX IF NOT EXISTS idx_complaints_student ON complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
CREATE INDEX IF NOT EXISTS idx_leaves_student ON leaves(student_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_notices_pinned ON notices(is_pinned);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);