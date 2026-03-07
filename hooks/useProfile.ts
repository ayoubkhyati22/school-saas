'use client';

import { useState, useEffect } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { Profile } from '@/types/database';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getCurrentProfile();
        if (mounted) {
          setProfile(data);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return { profile, loading, error };
}
