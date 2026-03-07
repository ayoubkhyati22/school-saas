'use client';

import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useGlobalSubjects } from '@/hooks/useGlobalSubjects';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, BookOpen, Pencil, Trash2 } from 'lucide-react';

const inputClass = 'h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';

export default function GlobalSubjectsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { subjects, loading, saving, deleting, create, update, remove } = useGlobalSubjects();

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [form, setForm] = useState({ label: '', description: '' });

  if (profileLoading) return <LoadingPage />;
  if (!profile) return null;
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
  const openEdit = (subject: any) => {
    setEditItem(subject);
    setForm({ label: subject.label, description: subject.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.label) return;
    const payload = { label: form.label, description: form.description || null };
    const ok = editItem
      ? await update(editItem.id, payload)
      : await create(payload);
    if (ok) { setShowModal(false); setForm({ label: '', description: '' }); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    const ok = await remove(deleteItem.id);
    if (ok) setDeleteItem(null);
  };

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
        searchKeys={['label', 'description']}
        loading={loading}
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
