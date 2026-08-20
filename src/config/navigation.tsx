import {
  LayoutDashboard,
  Users,
  DoorOpen,
  IndianRupee,
  UserCheck,
  MessageSquareWarning,
  CalendarCheck,
  LogOut,
  Package,
  UtensilsCrossed,
  Shirt,
  Bell,
  Wrench,
  FileText,
  ShieldCheck,
  Brain,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/app/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'hostel_admin', 'warden', 'security_guard', 'receptionist', 'student', 'parents'],
  },
  {
    label: 'Students',
    to: '/app/students',
    icon: Users,
    roles: ['super_admin', 'hostel_admin', 'warden', 'receptionist'],
  },
  {
    label: 'Rooms',
    to: '/app/rooms',
    icon: DoorOpen,
    roles: ['super_admin', 'hostel_admin', 'warden'],
  },
  {
    label: 'Fees',
    to: '/app/fees',
    icon: IndianRupee,
    roles: ['super_admin', 'hostel_admin', 'receptionist', 'student', 'parents'],
  },
  {
    label: 'Visitors',
    to: '/app/visitors',
    icon: UserCheck,
    roles: ['super_admin', 'hostel_admin', 'warden', 'security_guard', 'receptionist', 'student'],
  },
  {
    label: 'Complaints',
    to: '/app/complaints',
    icon: MessageSquareWarning,
    roles: ['super_admin', 'hostel_admin', 'warden', 'receptionist', 'student'],
  },
  {
    label: 'Attendance',
    to: '/app/attendance',
    icon: CalendarCheck,
    roles: ['super_admin', 'hostel_admin', 'warden', 'security_guard', 'student'],
  },
  {
    label: 'Leave',
    to: '/app/leaves',
    icon: LogOut,
    roles: ['super_admin', 'hostel_admin', 'warden', 'security_guard', 'student', 'parents'],
  },
  {
    label: 'Inventory',
    to: '/app/inventory',
    icon: Package,
    roles: ['super_admin', 'hostel_admin', 'warden'],
  },
  {
    label: 'Mess',
    to: '/app/mess',
    icon: UtensilsCrossed,
    roles: ['super_admin', 'hostel_admin', 'warden', 'student'],
  },
  {
    label: 'Laundry',
    to: '/app/laundry',
    icon: Shirt,
    roles: ['super_admin', 'hostel_admin', 'warden', 'receptionist', 'student'],
  },
  {
    label: 'Notices',
    to: '/app/notices',
    icon: Bell,
    roles: ['super_admin', 'hostel_admin', 'warden', 'receptionist', 'student', 'parents', 'security_guard'],
  },
  {
    label: 'Maintenance',
    to: '/app/maintenance',
    icon: Wrench,
    roles: ['super_admin', 'hostel_admin', 'warden'],
  },
  {
    label: 'Reports',
    to: '/app/reports',
    icon: FileText,
    roles: ['super_admin', 'hostel_admin', 'warden'],
  },
  {
    label: 'AI Insights',
    to: '/app/ai-insights',
    icon: Brain,
    roles: ['super_admin', 'hostel_admin', 'warden'],
  },
  {
    label: 'Audit Logs',
    to: '/app/audit-logs',
    icon: ShieldCheck,
    roles: ['super_admin', 'hostel_admin'],
  },
];
