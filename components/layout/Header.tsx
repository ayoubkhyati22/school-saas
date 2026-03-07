'use client';

import { Bell, Search, Moon, Sun, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { signOut } from '@/lib/auth';
import { Profile } from '@/types/database';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface HeaderProps {
  profile: Profile;
  title?: string;
}

export default function Header({ profile, title }: HeaderProps) {
  const [search, setSearch] = useState('');
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-14 border-b border-border bg-card fixed top-0 right-0 left-60 z-10">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-9 pr-3 text-sm bg-muted border border-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border focus:bg-background transition-colors"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 ml-4">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications */}
          <button className="w-8 h-8 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500" />
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-border mx-1" />

          {/* User dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted transition-colors text-sm">
                <div className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-foreground leading-none">{profile.full_name}</p>
                </div>
                <ChevronDown size={12} className="text-muted-foreground" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[180px] bg-popover border border-border shadow-lg py-1"
                align="end"
                sideOffset={4}
              >
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-foreground">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
                </div>
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 text-sm text-destructive cursor-pointer hover:bg-muted outline-none"
                  onSelect={handleSignOut}
                >
                  <LogOut size={14} />
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}
