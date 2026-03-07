'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getClasses, createClass } from '@/services/class.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Users, School } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ClassesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [levels, setLevels] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    academic_year: '',
    ref_level_id: '',
  });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.school_id) {
        try {
          const [classesData, levelsData] = await Promise.all([
            getClasses(profileData.school_id),
            supabase.from('ref_levels').select('*').order('order_index'),
          ]);
          setClasses(classesData || []);
          setLevels(levelsData.data || []);
        } catch (e) {
          setClasses([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !profile) return <LoadingPage />;

  const canCreate = profile.role === 'school_admin';

  const handleSubmit = async () => {
    if (!profile.school_id || !form.name || !form.academic_year || !form.ref_level_id) return;
    setSaving(true);
    try {
      await createClass({
        school_id: profile.school_id,
        name: form.name,
        academic_year: form.academic_year,
        ref_level_id: form.ref_level_id,
      });
      const updated = await getClasses(profile.school_id);
      setClasses(updated || []);
      setShowModal(false);
      setForm({ name: '', academic_year: '', ref_level_id: '' });
    } catch (e) {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Class Name',
      render: (cls: any) => (
        <div>
          <p className="font-medium text-foreground">{cls.name}</p>
          {cls.ref_levels && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {cls.ref_levels.cycle_name} — {cls.ref_levels.level_name}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'academic_year',
      label: 'Academic Year',
      render: (cls: any) => (
        <span className="text-sm text-foreground">{cls.academic_year || '—'}</span>
      ),
    },
    {
      key: 'students',
      label: 'Students',
      render: () => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users size={14} />
          <span className="text-sm">0</span>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Classes"
        description="Manage your school's classes and levels"
        action={
          canCreate ? (
            <Button onClick={() => setShowModal(true)}>
              <Plus size={15} className="mr-2" />
              Add Class
            </Button>
          ) : undefined
        }
      />

      <DataTable
        data={classes}
        columns={columns}
        keyExtractor={(cls) => cls.id}
        emptyMessage="No classes found"
        emptyIcon={<School size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['name', 'academic_year']}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Class"
        description="Create a new class for this academic year"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>Create Class</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Class Name</label>
            <input
              type="text"
              placeholder="e.g. 6A, CM2..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Academic Year</label>
            <input
              type="text"
              placeholder="e.g. 2024-2025"
              value={form.academic_year}
              onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <Select
            label="Level"
            placeholder="Select a level..."
            value={form.ref_level_id}
            onValueChange={(v) => setForm({ ...form, ref_level_id: v })}
            options={levels.map((l) => ({
              value: l.id,
              label: `${l.cycle_name} - ${l.level_name}`,
            }))}
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
