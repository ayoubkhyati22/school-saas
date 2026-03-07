'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function GlobalSubjectsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ label: '', description: '' });

  const loadSubjects = async () => {
    const { data } = await supabase.from('ref_subjects').select('*').order('label');
    setSubjects(data || []);
  };

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.role === 'super_admin') {
        try { await loadSubjects(); } catch (e) { setSubjects([]); }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !profile) return <LoadingPage />;

  if (profile.role !== 'super_admin') {
    return (
      <DashboardLayout profile={profile}>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>Access denied. Super admin only.</p>
        </div>
      </DashboardLayout>
    );
  }

  const openCreate = () => { setEditItem(null); setForm({ label: '', description: '' }); setShowModal(true); };
  const openEdit = (subject: any) => { setEditItem(subject); setForm({ label: subject.label, description: subject.description || '' }); setShowModal(true); };

  const handleSubmit = async () => {
    if (!form.label) return;
    setSaving(true);
    try {
      if (editItem) {
        await supabase.from('ref_subjects').update({ label: form.label, description: form.description || null }).eq('id', editItem.id);
      } else {
        await supabase.from('ref_subjects').insert({ label: form.label, description: form.description || null });
      }
      await loadSubjects();
      setShowModal(false);
      setForm({ label: '', description: '' });
    } catch (e) {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await supabase.from('ref_subjects').delete().eq('id', deleteItem.id);
      setSubjects((prev) => prev.filter((s) => s.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const inputClass = "h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  const columns = [
    {
      key: 'label', label: 'Subject Name',
      render: (subject: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted flex items-center justify-center">
            <BookOpen size={14} className="text-muted-foreground" />
          </div>
          <span className="font-medium text-foreground">{subject.label}</span>
        </div>
      ),
    },
    { key: 'description', label: 'Description', render: (subject: any) => <span className="text-sm text-muted-foreground">{subject.description || '—'}</span> },
    {
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
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Global Subjects"
        description="Manage the reference subject catalog"
        action={
          <Button onClick={openCreate}>
            <Plus size={15} className="mr-2" />
            Add Subject
          </Button>
        }
      />

      <DataTable
        data={subjects}
        columns={columns}
        keyExtractor={(s) => s.id}
        emptyMessage="No subjects in the catalog"
        emptyIcon={<BookOpen size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['label']}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Subject' : 'Add Subject'}
        description={editItem ? 'Update this reference subject' : 'Add a new subject to the global catalog'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editItem ? 'Save Changes' : 'Add Subject'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Subject Name</label>
            <input type="text" placeholder="e.g. Mathematics, French..." value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Description (Optional)</label>
            <textarea rows={3} placeholder="Brief description of the subject" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Delete Subject"
        description={`Delete "${deleteItem?.label}" from the catalog?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">Schools using this subject will lose the reference label.</p>
      </Modal>
    </DashboardLayout>
  );
}
