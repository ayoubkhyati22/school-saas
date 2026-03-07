'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSchools,
  createSchool,
  updateSchool,
  deleteSchool,
  updateSchoolPlan,
} from '@/services/school.service';

export function useSchools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSchools();
      setSchools(data || []);
    } catch {
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (data: Parameters<typeof createSchool>[0]) => {
    setSaving(true);
    try {
      await createSchool(data);
      await load();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const update = async (id: string, data: Parameters<typeof updateSchool>[1]) => {
    setSaving(true);
    try {
      const updated = await updateSchool(id, data);
      setSchools((prev) => prev.map((s) => s.id === id ? { ...s, ...updated } : s));
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changePlan = async (id: string, plan: string) => {
    setSaving(true);
    try {
      await updateSchoolPlan(id, plan);
      setSchools((prev) => prev.map((s) => s.id === id ? { ...s, subscription_plan: plan } : s));
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
      await deleteSchool(id);
      setSchools((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch {
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { schools, loading, saving, deleting, load, create, update, changePlan, remove };
}
