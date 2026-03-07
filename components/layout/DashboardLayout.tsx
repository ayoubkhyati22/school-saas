'use client';

import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Profile } from '@/types/database';

interface DashboardLayoutProps {
  children: ReactNode;
  profile: Profile;
}

export default function DashboardLayout({ children, profile }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar_collapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar profile={profile} collapsed={collapsed} onToggle={toggleSidebar} />
      <Header profile={profile} collapsed={collapsed} />
      <main
        className="mt-14 min-h-[calc(100vh-56px)] transition-[margin] duration-200"
        style={{ marginLeft: collapsed ? '3.5rem' : '15rem' }}
      >
        <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
