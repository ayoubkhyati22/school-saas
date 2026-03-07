'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { deleteProfile } from '@/services/profile.service';

export function useUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*, schools (name)')
        .order('created_at', { ascending: false });
      setUsers(data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = async (id: string, updates: {
    full_name?: string;
    role?: string;
    school_id?: string | null;
    phone_number?: string | null;
  }) => {
    setSaving(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select('*, schools (name)')
        .single();
      if (data) setUsers((prev) => prev.map((u) => u.id === id ? data : u));
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeleting(true);
    try {
      await deleteProfile(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return true;
    } catch {
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { users, loading, saving, deleting, load, update, remove };
}
