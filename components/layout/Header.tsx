'use client';

import { Bell, Search, Moon, Sun, LogOut, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { signOut } from '@/lib/auth';
import { Profile } from '@/types/database';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { getNotifications } from '@/services/notification.service';

interface HeaderProps {
  profile: Profile;
  title?: string;
  collapsed?: boolean;
}

export default function Header({ profile, title, collapsed = false }: HeaderProps) {
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!profile?.school_id) return;
    getNotifications(profile.school_id, profile.role)
      .then((data) => setNotifications(data || []))
      .catch(() => {});
  }, [profile?.school_id, profile?.role]);

  const unreadCount = Math.max(0, notifications.length - seenCount);

  const handleNotifOpen = (open: boolean) => {
    setNotifOpen(open);
    if (open) setSeenCount(notifications.length);
  };

  const formatNotifDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      className="h-14 border-b border-border bg-card fixed top-0 right-0 z-10 transition-[left] duration-200"
      style={{ left: collapsed ? '3.5rem' : '15rem' }}
    >
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
          <DropdownMenu.Root open={notifOpen} onOpenChange={handleNotifOpen}>
            <DropdownMenu.Trigger asChild>
              <button className="w-8 h-8 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative">
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 w-80 bg-popover border border-border shadow-lg"
                align="end"
                sideOffset={4}
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Notifications</span>
                  {notifications.length > 0 && (
                    <span className="text-xs text-muted-foreground">{notifications.length} total</span>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                      <Bell size={24} className="text-muted-foreground/40" />
                      <p className="text-xs">No notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <DropdownMenu.Item
                        key={notif.id}
                        className="px-4 py-3 border-b border-border last:border-0 cursor-default outline-none hover:bg-muted focus:bg-muted"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Bell size={13} className="text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{notif.content}</p>
                            <p className="text-[11px] text-muted-foreground/70 mt-1">{formatNotifDate(notif.created_at)}</p>
                          </div>
                        </div>
                      </DropdownMenu.Item>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="border-t border-border">
                    <DropdownMenu.Item
                      className="px-4 py-2.5 text-xs text-center text-primary font-medium cursor-pointer outline-none hover:bg-muted focus:bg-muted"
                      onSelect={() => router.push('/notifications')}
                    >
                      View all notifications
                    </DropdownMenu.Item>
                  </div>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

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
