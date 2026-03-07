'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Profile } from '@/types/database';

interface DashboardLayoutProps {
  children: ReactNode;
  profile: Profile;
}

export default function DashboardLayout({ children, profile }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar profile={profile} />
      <Header profile={profile} />
      <main className="ml-60 mt-14 min-h-[calc(100vh-56px)]">
        <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
