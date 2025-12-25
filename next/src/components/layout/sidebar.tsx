'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Building2,
  Bus,
  Home,
  Library,
  Package,
  Phone,
  Bell,
  ClipboardList,
  UserCheck,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  permission?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Students',
    icon: <GraduationCap className="h-5 w-5" />,
    permission: 'students.view',
    children: [
      { label: 'All Students', href: '/students', icon: <Users className="h-4 w-4" /> },
      { label: 'Admission', href: '/students/admission', icon: <UserCheck className="h-4 w-4" /> },
      { label: 'Categories', href: '/students/categories', icon: <ClipboardList className="h-4 w-4" /> },
      { label: 'Disabled Students', href: '/students/disabled', icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Parents',
    href: '/parents',
    icon: <Users className="h-5 w-5" />,
    permission: 'parents.view',
  },
  {
    label: 'Staff',
    icon: <Users className="h-5 w-5" />,
    permission: 'staff.view',
    children: [
      { label: 'All Staff', href: '/staff', icon: <Users className="h-4 w-4" /> },
      { label: 'Departments', href: '/staff/departments', icon: <Building2 className="h-4 w-4" /> },
      { label: 'Designations', href: '/staff/designations', icon: <ClipboardList className="h-4 w-4" /> },
      { label: 'Leave Management', href: '/staff/leave', icon: <Calendar className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Academics',
    icon: <BookOpen className="h-5 w-5" />,
    permission: 'academics.view',
    children: [
      { label: 'Classes', href: '/academics/classes', icon: <Building2 className="h-4 w-4" /> },
      { label: 'Sections', href: '/academics/sections', icon: <ClipboardList className="h-4 w-4" /> },
      { label: 'Subjects', href: '/academics/subjects', icon: <BookOpen className="h-4 w-4" /> },
      { label: 'Timetable', href: '/academics/timetable', icon: <Clock className="h-4 w-4" /> },
      { label: 'Syllabus', href: '/academics/syllabus', icon: <FileText className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Attendance',
    icon: <UserCheck className="h-5 w-5" />,
    permission: 'attendance.view',
    children: [
      { label: 'Student Attendance', href: '/attendance/students', icon: <GraduationCap className="h-4 w-4" /> },
      { label: 'Staff Attendance', href: '/attendance/staff', icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Examinations',
    icon: <FileText className="h-5 w-5" />,
    permission: 'exams.view',
    children: [
      { label: 'Exam List', href: '/exams', icon: <FileText className="h-4 w-4" /> },
      { label: 'Exam Schedule', href: '/exams/schedule', icon: <Calendar className="h-4 w-4" /> },
      { label: 'Grades', href: '/exams/grades', icon: <ClipboardList className="h-4 w-4" /> },
      { label: 'Results', href: '/exams/results', icon: <FileText className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Online Exams',
    icon: <FileText className="h-5 w-5" />,
    permission: 'online_exams.view',
    children: [
      { label: 'Exams', href: '/online-exams', icon: <FileText className="h-4 w-4" /> },
      { label: 'Question Bank', href: '/online-exams/questions', icon: <ClipboardList className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Homework',
    href: '/homework',
    icon: <BookOpen className="h-5 w-5" />,
    permission: 'homework.view',
  },
  {
    label: 'Fees',
    icon: <DollarSign className="h-5 w-5" />,
    permission: 'fees.view',
    children: [
      { label: 'Collect Fees', href: '/fees/collect', icon: <DollarSign className="h-4 w-4" /> },
      { label: 'Fee Types', href: '/fees/types', icon: <ClipboardList className="h-4 w-4" /> },
      { label: 'Fee Groups', href: '/fees/groups', icon: <ClipboardList className="h-4 w-4" /> },
      { label: 'Fee Master', href: '/fees/master', icon: <Settings className="h-4 w-4" /> },
      { label: 'Due Fees', href: '/fees/due', icon: <DollarSign className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Finance',
    icon: <DollarSign className="h-5 w-5" />,
    permission: 'finance.view',
    children: [
      { label: 'Income', href: '/finance/income', icon: <DollarSign className="h-4 w-4" /> },
      { label: 'Expense', href: '/finance/expense', icon: <DollarSign className="h-4 w-4" /> },
      { label: 'Payroll', href: '/finance/payroll', icon: <DollarSign className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Transport',
    icon: <Bus className="h-5 w-5" />,
    permission: 'transport.view',
    children: [
      { label: 'Routes', href: '/transport/routes', icon: <ClipboardList className="h-4 w-4" /> },
      { label: 'Vehicles', href: '/transport/vehicles', icon: <Bus className="h-4 w-4" /> },
      { label: 'Assign Students', href: '/transport/assign', icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Hostel',
    icon: <Home className="h-5 w-5" />,
    permission: 'hostel.view',
    children: [
      { label: 'Hostels', href: '/hostel', icon: <Home className="h-4 w-4" /> },
      { label: 'Room Types', href: '/hostel/room-types', icon: <ClipboardList className="h-4 w-4" /> },
      { label: 'Rooms', href: '/hostel/rooms', icon: <Home className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Library',
    icon: <Library className="h-5 w-5" />,
    permission: 'library.view',
    children: [
      { label: 'Books', href: '/library/books', icon: <BookOpen className="h-4 w-4" /> },
      { label: 'Issue/Return', href: '/library/issue', icon: <ClipboardList className="h-4 w-4" /> },
      { label: 'Members', href: '/library/members', icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Inventory',
    icon: <Package className="h-5 w-5" />,
    permission: 'inventory.view',
    children: [
      { label: 'Items', href: '/inventory/items', icon: <Package className="h-4 w-4" /> },
      { label: 'Categories', href: '/inventory/categories', icon: <ClipboardList className="h-4 w-4" /> },
      { label: 'Stores', href: '/inventory/stores', icon: <Building2 className="h-4 w-4" /> },
      { label: 'Suppliers', href: '/inventory/suppliers', icon: <Users className="h-4 w-4" /> },
      { label: 'Issue Items', href: '/inventory/issue', icon: <Package className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Front Office',
    icon: <Phone className="h-5 w-5" />,
    permission: 'front_office.view',
    children: [
      { label: 'Enquiries', href: '/front-office/enquiries', icon: <ClipboardList className="h-4 w-4" /> },
      { label: 'Visitors', href: '/front-office/visitors', icon: <Users className="h-4 w-4" /> },
      { label: 'Complaints', href: '/front-office/complaints', icon: <FileText className="h-4 w-4" /> },
      { label: 'Postal', href: '/front-office/postal', icon: <FileText className="h-4 w-4" /> },
      { label: 'Phone Calls', href: '/front-office/calls', icon: <Phone className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Events',
    icon: <Calendar className="h-5 w-5" />,
    permission: 'events.view',
    children: [
      { label: 'Events', href: '/events', icon: <Calendar className="h-4 w-4" /> },
      { label: 'Notices', href: '/events/notices', icon: <Bell className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Reports',
    icon: <FileText className="h-5 w-5" />,
    permission: 'reports.view',
    children: [
      { label: 'Student Reports', href: '/reports/students', icon: <GraduationCap className="h-4 w-4" /> },
      { label: 'Finance Reports', href: '/reports/finance', icon: <DollarSign className="h-4 w-4" /> },
      { label: 'Attendance Reports', href: '/reports/attendance', icon: <UserCheck className="h-4 w-4" /> },
      { label: 'Exam Reports', href: '/reports/exams', icon: <FileText className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    permission: 'settings.view',
    children: [
      { label: 'General', href: '/settings', icon: <Settings className="h-4 w-4" /> },
      { label: 'Sessions', href: '/settings/sessions', icon: <Calendar className="h-4 w-4" /> },
      { label: 'Roles & Permissions', href: '/settings/roles', icon: <Users className="h-4 w-4" /> },
      { label: 'Users', href: '/settings/users', icon: <Users className="h-4 w-4" /> },
      { label: 'Email Settings', href: '/settings/email', icon: <Bell className="h-4 w-4" /> },
      { label: 'SMS Settings', href: '/settings/sms', icon: <Phone className="h-4 w-4" /> },
      { label: 'Payment Settings', href: '/settings/payment', icon: <DollarSign className="h-4 w-4" /> },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const userPermissions = session?.user?.permissions || [];
  const userRole = session?.user?.role;

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (userRole === 'Super Admin' || userRole === 'Admin') return true;
    return userPermissions.includes(permission);
  };

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isParentActive = (children?: NavItem[]) => {
    if (!children) return false;
    return children.some((child) => isActive(child.href));
  };

  const filteredNavItems = navItems.filter((item) => hasPermission(item.permission));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 transform bg-card border-r transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-lg font-bold">School MS</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-4">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => (
              <li key={item.label}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isParentActive(item.children)
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        {item.label}
                      </span>
                      {expandedItems.includes(item.label) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expandedItems.includes(item.label) && (
                      <ul className="ml-4 mt-1 space-y-1 border-l pl-4">
                        {item.children
                          .filter((child) => hasPermission(child.permission))
                          .map((child) => (
                            <li key={child.label}>
                              <Link
                                href={child.href!}
                                onClick={onClose}
                                className={cn(
                                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                                  isActive(child.href)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                              >
                                {child.icon}
                                {child.label}
                              </Link>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
