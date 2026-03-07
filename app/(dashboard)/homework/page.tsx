'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getHomework, createHomework, updateHomework, deleteHomework } from '@/services/homework.service';
import { getClasses } from '@/services/class.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Calendar, ClipboardList, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function HomeworkPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [homework, setHomework] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', class_id: '', subject_id: '' });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        try {
          const [hwData, classesData, subjectsRes] = await Promise.all([
            getHomework(profileData.school_id),
            getClasses(profileData.school_id),
            supabase.from('school_subjects').select('id, custom_label, ref_subjects(label)').eq('school_id', profileData.school_id),
          ]);
          setHomework(hwData || []);
          setClasses(classesData || []);
          setSubjects(subjectsRes.data || []);
        } catch (e) {
          setHomework([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (!profile) return <LoadingPage />;


  const canCreate = ['teacher', 'school_admin'].includes(profile.role);

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', description: '', due_date: '', class_id: '', subject_id: '' });
    setShowModal(true);
  };

  const openEdit = (hw: any) => {
    setEditItem(hw);
    setForm({
      title: hw.title, description: hw.description || '',
      due_date: hw.due_date?.slice(0, 10) || '',
      class_id: hw.class_id || '', subject_id: hw.subject_id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!profile.school_id || !form.title || !form.due_date || !form.class_id) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateHomework(editItem.id, { title: form.title, description: form.description, due_date: form.due_date, class_id: form.class_id, subject_id: form.subject_id });
      } else {
        await createHomework({
          school_id: profile.school_id, teacher_id: profile.id,
          subject_id: form.subject_id, class_id: form.class_id,
          title: form.title, description: form.description, due_date: form.due_date,
        });
      }
      const updated = await getHomework(profile.school_id);
      setHomework(updated || []);
      setShowModal(false);
      setForm({ title: '', description: '', due_date: '', class_id: '', subject_id: '' });
    } catch (e) {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteHomework(deleteItem.id);
      setHomework((prev) => prev.filter((h) => h.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const getSubjectLabel = (hw: any) => {
    if (hw.school_subjects?.custom_label) return hw.school_subjects.custom_label;
    if (hw.school_subjects?.ref_subjects?.label) return hw.school_subjects.ref_subjects.label;
    return 'No subject';
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return dateStr; }
  };

  const columns = [
    {
      key: 'title', label: 'Homework',
      render: (hw: any) => (
        <div>
          <p className="font-medium text-foreground">{hw.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{getSubjectLabel(hw)}</p>
        </div>
      ),
    },
    { key: 'class', label: 'Class', render: (hw: any) => <span className="text-sm text-foreground">{hw.classes?.name || '—'}</span> },
    { key: 'teacher', label: 'Teacher', render: (hw: any) => <span className="text-sm text-foreground">{hw.profiles?.full_name || '—'}</span> },
    {
      key: 'due_date', label: 'Due Date',
      render: (hw: any) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={13} />
          <span className="text-sm">{formatDate(hw.due_date)}</span>
        </div>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (hw: any) => {
        const isOverdue = new Date(hw.due_date) < new Date();
        return <Badge variant={isOverdue ? 'danger' : 'success'}>{isOverdue ? 'Overdue' : 'Active'}</Badge>;
      },
    },
    ...(canCreate ? [{
      key: 'actions', label: '',
      render: (hw: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(hw); }}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteItem(hw); }}>
            <Trash2 size={13} className="text-red-500" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Homework"
        description="Manage and track homework assignments"
        action={
          canCreate ? (
            <Button onClick={openCreate}>
              <Plus size={15} className="mr-2" />
              Create Homework
            </Button>
          ) : undefined
        }
      />

      <DataTable
        data={homework}
        columns={columns}
        loading={loading}
        keyExtractor={(hw) => hw.id}
        emptyMessage="No homework found"
        emptyIcon={<ClipboardList size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['title']}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Homework' : 'Create Homework'}
        description={editItem ? 'Update homework assignment' : 'Assign homework to a class'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editItem ? 'Save Changes' : 'Create Homework'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Title</label>
            <input type="text" placeholder="Homework title..." value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea rows={3} placeholder="Instructions for students..." value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Due Date</label>
            <input type="date" value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <Select label="Class" placeholder="Select a class..." value={form.class_id}
            onValueChange={(v) => setForm({ ...form, class_id: v })}
            options={classes.map((c) => ({ value: c.id, label: c.name }))} />
          <Select label="Subject" placeholder="Select a subject..." value={form.subject_id}
            onValueChange={(v) => setForm({ ...form, subject_id: v })}
            options={subjects.map((s: any) => ({ value: s.id, label: s.custom_label || s.ref_subjects?.label || 'Unknown' }))} />
        </div>
      </Modal>

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Delete Homework"
        description={`Delete "${deleteItem?.title}"? This cannot be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">All student submissions for this homework will also be deleted.</p>
      </Modal>
    </DashboardLayout>
  );
}
