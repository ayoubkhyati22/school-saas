'use client';

import { useEffect, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useCompetencies } from '@/hooks/useCompetencies';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Target, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const inputClass = 'h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';

export default function CompetenciesPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { competencies, loading, saving, deleting, create, update, remove } = useCompetencies();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [form, setForm] = useState({ label: '', description: '', subject_id: '', level_id: '' });

  useEffect(() => {
    supabase.from('ref_subjects').select('id, label').order('label').then(({ data }) => setSubjects(data || []));
    supabase.from('ref_levels').select('id, label').order('label').then(({ data }) => setLevels(data || []));
  }, []);

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

  const openCreate = () => { setEditItem(null); setForm({ label: '', description: '', subject_id: '', level_id: '' }); setShowModal(true); };
  const openEdit = (comp: any) => {
    setEditItem(comp);
    setForm({ label: comp.label, description: comp.description || '', subject_id: comp.subject_id || '', level_id: comp.level_id || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.label) return;
    const payload = { label: form.label, description: form.description || null, subject_id: form.subject_id || null, level_id: form.level_id || null };
    const ok = editItem
      ? await update(editItem.id, payload)
      : await create(payload);
    if (ok) { setShowModal(false); setForm({ label: '', description: '', subject_id: '', level_id: '' }); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    const ok = await remove(deleteItem.id);
    if (ok) setDeleteItem(null);
  };

  const columns = [
    {
      key: 'label', label: 'Competency',
      render: (comp: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted flex items-center justify-center">
            <Target size={14} className="text-muted-foreground" />
          </div>
          <span className="font-medium text-foreground">{comp.label}</span>
        </div>
      ),
    },
    { key: 'description', label: 'Description', render: (comp: any) => <span className="text-sm text-muted-foreground">{comp.description || '—'}</span> },
    { key: 'subject', label: 'Subject', render: (comp: any) => <span className="text-sm text-foreground">{comp.ref_subjects?.label || '—'}</span> },
    { key: 'level', label: 'Level', render: (comp: any) => <span className="text-sm text-foreground">{comp.ref_levels?.label || '—'}</span> },
    {
      key: 'actions', label: '',
      render: (comp: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(comp); }}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteItem(comp); }}>
            <Trash2 size={13} className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Competencies"
        description="Manage global competency framework"
        action={
          <Button onClick={openCreate}>
            <Plus size={15} className="mr-2" />
            Add Competency
          </Button>
        }
      />

      <DataTable
        data={competencies}
        columns={columns}
        keyExtractor={(c) => c.id}
        emptyMessage="No competencies defined"
        emptyIcon={<Target size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['label', 'description']}
        loading={loading}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Competency' : 'Add Competency'}
        description={editItem ? 'Update this competency' : 'Define a new competency in the framework'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editItem ? 'Save Changes' : 'Add Competency'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Competency Label</label>
            <input type="text" placeholder="e.g. Critical Thinking, Problem Solving..." value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea rows={3} placeholder="Describe this competency..." value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>
          <Select label="Related Subject (Optional)" placeholder="Select a subject..." value={form.subject_id}
            onValueChange={(v) => setForm({ ...form, subject_id: v })}
            options={subjects.map((s) => ({ value: s.id, label: s.label }))} />
          <Select label="Related Level (Optional)" placeholder="Select a level..." value={form.level_id}
            onValueChange={(v) => setForm({ ...form, level_id: v })}
            options={levels.map((l) => ({ value: l.id, label: l.label }))} />
        </div>
      </Modal>

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Delete Competency"
        description={`Delete "${deleteItem?.label}"?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">This competency will be permanently removed from the framework.</p>
      </Modal>
    </DashboardLayout>
  );
}
