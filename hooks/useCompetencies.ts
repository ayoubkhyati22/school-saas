'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useCompetencies() {
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('ref_competencies')
        .select('*, ref_subjects (label), ref_levels (label)')
        .order('label');
      setCompetencies(data || []);
    } catch {
      setCompetencies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (data: { label: string; description?: string | null; subject_id?: string | null; level_id?: string | null }) => {
    setSaving(true);
    try {
      await supabase.from('ref_competencies').insert(data);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const update = async (id: string, data: { label?: string; description?: string | null; subject_id?: string | null; level_id?: string | null }) => {
    setSaving(true);
    try {
      await supabase.from('ref_competencies').update(data).eq('id', id);
      await load();
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
      await supabase.from('ref_competencies').delete().eq('id', id);
      setCompetencies((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch {
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { competencies, loading, saving, deleting, load, create, update, remove };
}
