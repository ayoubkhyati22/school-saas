'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, BookOpen, Award, Users,
  GraduationCap, User, School, FileText, ClipboardList,
  FileCheck, Bus, Image, Wallet, Bell, Settings, CreditCard,
  Globe, PanelLeft, PanelLeftClose
} from 'lucide-react';
import { Profile } from '@/types/database';
import { cn } from '@/lib/utils';

interface SidebarProps {
  profile: Profile;
  collapsed: boolean;
  onToggle: () => void;
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

export default function Sidebar({ profile, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const items = menuItems[profile.role] || [];

  return (
    <aside
      className="bg-card border-r border-border h-screen fixed left-0 top-0 flex flex-col overflow-hidden transition-[width] duration-200 z-20"
      style={{ width: collapsed ? '3.5rem' : '15rem' }}
    >
      {/* Logo / Toggle */}
      <div className="h-14 flex items-center border-b border-border flex-shrink-0 px-3">
        {collapsed ? (
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center mx-auto hover:bg-muted transition-colors"
            title="Expand sidebar"
          >
            <PanelLeft size={16} className="text-muted-foreground" />
          </button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary flex items-center justify-center flex-shrink-0">
                <School size={14} className="text-primary-foreground" />
              </div>
              <span className="font-bold text-sm text-foreground tracking-tight">EduManager</span>
            </div>
            <button
              onClick={onToggle}
              className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={15} className="text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
        <div className={cn('space-y-0.5', collapsed ? 'px-2' : 'px-3')}>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 py-2 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-2' : 'px-3',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon size={16} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className={cn('border-t border-border flex-shrink-0', collapsed ? 'p-2' : 'p-4')}>
        {collapsed ? (
          <div
            className="w-8 h-8 bg-muted flex items-center justify-center mx-auto text-sm font-semibold text-foreground"
            title={profile.full_name || 'User'}
          >
            {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted flex items-center justify-center flex-shrink-0 text-sm font-semibold text-foreground">
              {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{roleLabels[profile.role]}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
