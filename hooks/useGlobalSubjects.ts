'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useGlobalSubjects() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('ref_subjects').select('*').order('label');
      setSubjects(data || []);
    } catch {
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (data: { label: string; description?: string | null }) => {
    setSaving(true);
    try {
      await supabase.from('ref_subjects').insert(data);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const update = async (id: string, data: { label?: string; description?: string | null }) => {
    setSaving(true);
    try {
      await supabase.from('ref_subjects').update(data).eq('id', id);
      setSubjects((prev) => prev.map((s) => s.id === id ? { ...s, ...data } : s));
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
      await supabase.from('ref_subjects').delete().eq('id', id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch {
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { subjects, loading, saving, deleting, load, create, update, remove };
}
