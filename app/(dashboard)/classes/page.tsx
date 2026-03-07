'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getClassesWithCounts, createClass, updateClass, deleteClass } from '@/services/class.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Users, School, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ClassesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [levels, setLevels] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', academic_year: '', ref_level_id: '' });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        try {
          const [classesData, levelsData] = await Promise.all([
            getClassesWithCounts(profileData.school_id),
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

  if (!profile) return <LoadingPage />;


  const canManage = profile.role === 'school_admin';

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', academic_year: '', ref_level_id: '' });
    setShowModal(true);
  };

  const openEdit = (cls: any) => {
    setEditItem(cls);
    setForm({ name: cls.name, academic_year: cls.academic_year || '', ref_level_id: cls.ref_level_id || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!profile.school_id || !form.name || !form.academic_year || !form.ref_level_id) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateClass(editItem.id, { name: form.name, academic_year: form.academic_year, ref_level_id: form.ref_level_id });
      } else {
        await createClass({ school_id: profile.school_id, name: form.name, academic_year: form.academic_year, ref_level_id: form.ref_level_id });
      }
      const updated = await getClassesWithCounts(profile.school_id);
      setClasses(updated || []);
      setShowModal(false);
      setForm({ name: '', academic_year: '', ref_level_id: '' });
    } catch (e) {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteClass(deleteItem.id);
      setClasses((prev) => prev.filter((c) => c.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
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
      render: (cls: any) => <span className="text-sm text-foreground">{cls.academic_year || '—'}</span>,
    },
    {
      key: 'students',
      label: 'Students',
      render: (cls: any) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users size={14} />
          <span className="text-sm">{cls.studentCount ?? 0}</span>
        </div>
      ),
    },
    ...(canManage ? [{
      key: 'actions',
      label: '',
      render: (cls: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(cls); }}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteItem(cls); }}>
            <Trash2 size={13} className="text-red-500" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Classes"
        description="Manage your school's classes and levels"
        action={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus size={15} className="mr-2" />
              Add Class
            </Button>
          ) : undefined
        }
      />

      <DataTable
        data={classes}
        columns={columns}
        loading={loading}
        keyExtractor={(cls) => cls.id}
        emptyMessage="No classes found"
        emptyIcon={<School size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['name', 'academic_year']}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Class' : 'Add Class'}
        description={editItem ? 'Update class information' : 'Create a new class for this academic year'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editItem ? 'Save Changes' : 'Create Class'}</Button>
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
            options={levels.map((l) => ({ value: l.id, label: `${l.cycle_name} - ${l.level_name}` }))}
          />
        </div>
      </Modal>

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Delete Class"
        description={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">All associated data (enrollments, homework, exams) may be affected.</p>
      </Modal>
    </DashboardLayout>
  );
}
