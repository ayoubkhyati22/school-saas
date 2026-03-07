'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, BookOpen, Award, Users,
  GraduationCap, User, School, FileText, ClipboardList,
  FileCheck, Bus, Image, Wallet, Bell, Settings, CreditCard,
  ChevronDown, ChevronRight, Globe
} from 'lucide-react';
import { Profile } from '@/types/database';
import { cn } from '@/lib/utils';

interface SidebarProps {
  profile: Profile;
}

type MenuItem = {
  icon: React.ElementType;
  label: string;
  href: string;
};

const menuItems: Record<string, MenuItem[]> = {
  super_admin: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Building2, label: 'Schools', href: '/schools' },
    { icon: Globe, label: 'Global Subjects', href: '/global-subjects' },
    { icon: Award, label: 'Levels', href: '/levels' },
    { icon: FileText, label: 'Competencies', href: '/competencies' },
    { icon: Users, label: 'Users', href: '/users' },
    { icon: CreditCard, label: 'Subscriptions', href: '/subscriptions' },
    { icon: Settings, label: 'System Settings', href: '/system-settings' },
  ],
  school_admin: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: GraduationCap, label: 'Teachers', href: '/teachers' },
    { icon: Users, label: 'Students', href: '/students' },
    { icon: User, label: 'Parents', href: '/parents' },
    { icon: School, label: 'Classes', href: '/classes' },
    { icon: BookOpen, label: 'Subjects', href: '/subjects' },
    { icon: FileText, label: 'Courses', href: '/courses' },
    { icon: ClipboardList, label: 'Homework', href: '/homework' },
    { icon: FileCheck, label: 'Exams', href: '/exams' },
    { icon: Bus, label: 'Transport', href: '/transport' },
    { icon: Image, label: 'Gallery', href: '/gallery' },
    { icon: Wallet, label: 'Finance', href: '/finance' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
    { icon: Settings, label: 'School Settings', href: '/settings' },
  ],
  teacher: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: School, label: 'My Classes', href: '/my-classes' },
    { icon: FileText, label: 'Courses', href: '/courses' },
    { icon: ClipboardList, label: 'Homework', href: '/homework' },
    { icon: FileCheck, label: 'Exams', href: '/exams' },
    { icon: Award, label: 'Results', href: '/results' },
    { icon: Image, label: 'Gallery', href: '/gallery' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
  ],
  assistant: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: School, label: 'Classes', href: '/classes' },
    { icon: ClipboardList, label: 'Homework', href: '/homework' },
    { icon: FileCheck, label: 'Exams', href: '/exams' },
    { icon: FileText, label: 'Courses', href: '/courses' },
  ],
  parent: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Users, label: 'My Children', href: '/my-children' },
    { icon: FileText, label: 'Courses', href: '/courses' },
    { icon: ClipboardList, label: 'Homework', href: '/homework' },
    { icon: Award, label: 'Exam Results', href: '/exam-results' },
    { icon: Bus, label: 'Transport', href: '/transport' },
    { icon: Wallet, label: 'Invoices', href: '/invoices' },
    { icon: Image, label: 'Gallery', href: '/gallery' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
  ],
  student: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: FileText, label: 'My Courses', href: '/courses' },
    { icon: ClipboardList, label: 'Homework', href: '/homework' },
    { icon: FileCheck, label: 'Submit Homework', href: '/submit-homework' },
    { icon: Award, label: 'Exams', href: '/exams' },
    { icon: Bus, label: 'Transport', href: '/transport' },
    { icon: Image, label: 'Gallery', href: '/gallery' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
  ],
};

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  school_admin: 'School Admin',
  teacher: 'Teacher',
  assistant: 'Assistant',
  parent: 'Parent',
  student: 'Student',
};

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const items = menuItems[profile.role] || [];

  return (
    <aside className="w-60 bg-card border-r border-border h-screen fixed left-0 top-0 flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary flex items-center justify-center flex-shrink-0">
            <School size={14} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-sm text-foreground tracking-tight">EduManager</span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
        <div className="px-3 space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon size={16} className="flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-border p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted flex items-center justify-center flex-shrink-0 text-sm font-semibold text-foreground">
            {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{roleLabels[profile.role]}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
