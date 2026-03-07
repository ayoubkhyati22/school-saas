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
import { Plus, Target, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function CompetenciesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', subject_id: '' });

  const loadCompetencies = async () => {
    const { data } = await supabase.from('ref_competencies').select('*, ref_subjects (label)').order('name');
    setCompetencies(data || []);
  };

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.role === 'super_admin') {
        try {
          const subjectsRes = await supabase.from('ref_subjects').select('id, label').order('label');
          setSubjects(subjectsRes.data || []);
          await loadCompetencies();
        } catch (e) {
          setCompetencies([]);
        }
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

  const openCreate = () => { setEditItem(null); setForm({ name: '', description: '', subject_id: '' }); setShowModal(true); };
  const openEdit = (comp: any) => {
    setEditItem(comp);
    setForm({ name: comp.name, description: comp.description || '', subject_id: comp.subject_id || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = { name: form.name, description: form.description || null, subject_id: form.subject_id || null };
      if (editItem) {
        await supabase.from('ref_competencies').update(payload).eq('id', editItem.id);
      } else {
        await supabase.from('ref_competencies').insert(payload);
      }
      await loadCompetencies();
      setShowModal(false);
      setForm({ name: '', description: '', subject_id: '' });
    } catch (e) {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await supabase.from('ref_competencies').delete().eq('id', deleteItem.id);
      setCompetencies((prev) => prev.filter((c) => c.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const inputClass = "h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  const columns = [
    {
      key: 'name', label: 'Competency',
      render: (comp: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted flex items-center justify-center">
            <Target size={14} className="text-muted-foreground" />
          </div>
          <span className="font-medium text-foreground">{comp.name}</span>
        </div>
      ),
    },
    { key: 'description', label: 'Description', render: (comp: any) => <span className="text-sm text-muted-foreground">{comp.description || '—'}</span> },
    { key: 'subject', label: 'Subject', render: (comp: any) => <span className="text-sm text-foreground">{comp.ref_subjects?.label || '—'}</span> },
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
        searchKeys={['name']}
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
            <label className="text-sm font-medium text-foreground">Competency Name</label>
            <input type="text" placeholder="e.g. Critical Thinking, Problem Solving..." value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
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
        </div>
      </Modal>

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Delete Competency"
        description={`Delete "${deleteItem?.name}"?`}
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
