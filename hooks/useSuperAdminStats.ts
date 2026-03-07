'use client';

import { useState, useEffect } from 'react';
import { getPlatformStats, getRecentSchools, getRecentUsers } from '@/services/super-admin.service';

export function useSuperAdminStats() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getPlatformStats>> | null>(null);
  const [recentSchools, setRecentSchools] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [statsData, schoolsData, usersData] = await Promise.all([
          getPlatformStats(),
          getRecentSchools(5),
          getRecentUsers(5),
        ]);
        setStats(statsData);
        setRecentSchools(schoolsData || []);
        setRecentUsers(usersData || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { stats, recentSchools, recentUsers, loading };
}
