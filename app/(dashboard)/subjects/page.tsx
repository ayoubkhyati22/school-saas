'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function SubjectsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [refSubjects, setRefSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ ref_subject_id: '', custom_label: '', teacher_id: '', class_id: '' });

  const loadSubjects = async (schoolId: string) => {
    const { data } = await supabase
      .from('school_subjects')
      .select('*, ref_subjects (label), profiles:teacher_id (full_name), classes (name)')
      .eq('school_id', schoolId);
    setSubjects(data || []);
  };

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        try {
          const [refSubjectsRes, teachersRes, classesRes] = await Promise.all([
            supabase.from('ref_subjects').select('id, label').order('label'),
            supabase.from('profiles').select('id, full_name').eq('school_id', profileData.school_id).eq('role', 'teacher'),
            supabase.from('classes').select('id, name').eq('school_id', profileData.school_id),
          ]);
          await loadSubjects(profileData.school_id);
          setRefSubjects(refSubjectsRes.data || []);
          setTeachers(teachersRes.data || []);
          setClasses(classesRes.data || []);
        } catch (e) {
          setSubjects([]);
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
    setForm({ ref_subject_id: '', custom_label: '', teacher_id: '', class_id: '' });
    setShowModal(true);
  };

  const openEdit = (subject: any) => {
    setEditItem(subject);
    setForm({
      ref_subject_id: subject.ref_subject_id || '',
      custom_label: subject.custom_label || '',
      teacher_id: subject.teacher_id || '',
      class_id: subject.class_id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!profile.school_id || !form.ref_subject_id) return;
    setSaving(true);
    try {
      if (editItem) {
        await supabase.from('school_subjects').update({
          ref_subject_id: form.ref_subject_id,
          custom_label: form.custom_label || null,
          teacher_id: form.teacher_id || null,
          class_id: form.class_id || null,
        }).eq('id', editItem.id);
      } else {
        await supabase.from('school_subjects').insert({
          school_id: profile.school_id,
          ref_subject_id: form.ref_subject_id,
          custom_label: form.custom_label || null,
          teacher_id: form.teacher_id || null,
          class_id: form.class_id || null,
        });
      }
      await loadSubjects(profile.school_id);
      setShowModal(false);
      setForm({ ref_subject_id: '', custom_label: '', teacher_id: '', class_id: '' });
    } catch (e) {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem || !profile.school_id) return;
    setDeleting(true);
    try {
      await supabase.from('school_subjects').delete().eq('id', deleteItem.id);
      setSubjects((prev) => prev.filter((s) => s.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'label', label: 'Subject',
      render: (subject: any) => (
        <div>
          <p className="font-medium text-foreground">{subject.custom_label || subject.ref_subjects?.label || '—'}</p>
          {subject.custom_label && subject.ref_subjects?.label && (
            <p className="text-xs text-muted-foreground mt-0.5">{subject.ref_subjects.label}</p>
          )}
        </div>
      ),
    },
    { key: 'teacher', label: 'Teacher', render: (subject: any) => <span className="text-sm text-foreground">{subject.profiles?.full_name || '—'}</span> },
    { key: 'class', label: 'Class', render: (subject: any) => <span className="text-sm text-foreground">{subject.classes?.name || '—'}</span> },
    ...(canManage ? [{
      key: 'actions', label: '',
      render: (subject: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(subject); }}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteItem(subject); }}>
            <Trash2 size={13} className="text-red-500" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Subjects"
        description="Manage school subjects and assignments"
        action={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus size={15} className="mr-2" />
              Add Subject
            </Button>
          ) : undefined
        }
      />

      <DataTable
        data={subjects}
        columns={columns}
        loading={loading}
        keyExtractor={(s) => s.id}
        emptyMessage="No subjects configured"
        emptyIcon={<BookOpen size={32} className="text-muted-foreground/40" />}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Subject' : 'Add Subject'}
        description={editItem ? 'Update subject assignment' : 'Add a subject to your school'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editItem ? 'Save Changes' : 'Add Subject'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Reference Subject" placeholder="Select a subject..." value={form.ref_subject_id}
            onValueChange={(v) => setForm({ ...form, ref_subject_id: v })}
            options={refSubjects.map((s) => ({ value: s.id, label: s.label }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Custom Label (Optional)</label>
            <input type="text" placeholder="Override the default subject name" value={form.custom_label}
              onChange={(e) => setForm({ ...form, custom_label: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <Select label="Assign Teacher" placeholder="Select a teacher..." value={form.teacher_id}
            onValueChange={(v) => setForm({ ...form, teacher_id: v })}
            options={teachers.map((t) => ({ value: t.id, label: t.full_name }))} />
          <Select label="Assign Class" placeholder="Select a class..." value={form.class_id}
            onValueChange={(v) => setForm({ ...form, class_id: v })}
            options={classes.map((c) => ({ value: c.id, label: c.name }))} />
        </div>
      </Modal>

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Remove Subject"
        description={`Remove subject "${deleteItem?.custom_label || deleteItem?.ref_subjects?.label}"?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Remove</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">Associated homework and exams referencing this subject will be unlinked.</p>
      </Modal>
    </DashboardLayout>
  );
}
