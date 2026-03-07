'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useLevels() {
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('ref_levels').select('*').order('order_index');
      setLevels(data || []);
    } catch {
      setLevels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (data: { cycle_name: string; level_name: string; order_index?: number | null }) => {
    setSaving(true);
    try {
      await supabase.from('ref_levels').insert(data);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const update = async (id: string, data: { cycle_name?: string; level_name?: string; order_index?: number | null }) => {
    setSaving(true);
    try {
      await supabase.from('ref_levels').update(data).eq('id', id);
      setLevels((prev) => prev.map((l) => l.id === id ? { ...l, ...data } : l));
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
      await supabase.from('ref_levels').delete().eq('id', id);
      setLevels((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch {
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { levels, loading, saving, deleting, load, create, update, remove };
}
