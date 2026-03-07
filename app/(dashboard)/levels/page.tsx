'use client';

import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useLevels } from '@/hooks/useLevels';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Layers, Pencil, Trash2 } from 'lucide-react';

const inputClass = 'h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';

export default function LevelsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { levels, loading, saving, deleting, create, update, remove } = useLevels();

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [form, setForm] = useState({ cycle_name: '', level_name: '', order_index: '' });

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

  const openCreate = () => { setEditItem(null); setForm({ cycle_name: '', level_name: '', order_index: '' }); setShowModal(true); };
  const openEdit = (level: any) => {
    setEditItem(level);
    setForm({ cycle_name: level.cycle_name, level_name: level.level_name, order_index: String(level.order_index ?? '') });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.cycle_name || !form.level_name) return;
    const payload = { cycle_name: form.cycle_name, level_name: form.level_name, order_index: form.order_index ? Number(form.order_index) : null };
    const ok = editItem
      ? await update(editItem.id, payload)
      : await create(payload);
    if (ok) { setShowModal(false); setForm({ cycle_name: '', level_name: '', order_index: '' }); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    const ok = await remove(deleteItem.id);
    if (ok) setDeleteItem(null);
  };

  const columns = [
    { key: 'cycle_name', label: 'Cycle', render: (level: any) => <span className="font-medium text-foreground">{level.cycle_name}</span> },
    { key: 'level_name', label: 'Level Name', render: (level: any) => <span className="text-sm text-foreground">{level.level_name}</span> },
    { key: 'order_index', label: 'Order', render: (level: any) => <span className="text-sm text-muted-foreground tabular-nums">{level.order_index ?? '—'}</span> },
    {
      key: 'actions', label: '',
      render: (level: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(level); }}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteItem(level); }}>
            <Trash2 size={13} className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Levels"
        description="Manage academic cycles and levels"
        action={
          <Button onClick={openCreate}>
            <Plus size={15} className="mr-2" />
            Add Level
          </Button>
        }
      />

      <DataTable
        data={levels}
        columns={columns}
        keyExtractor={(l) => l.id}
        emptyMessage="No levels defined"
        emptyIcon={<Layers size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['cycle_name', 'level_name']}
        loading={loading}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Level' : 'Add Level'}
        description={editItem ? 'Update this academic level' : 'Create a new academic level'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editItem ? 'Save Changes' : 'Add Level'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Cycle Name</label>
            <input type="text" placeholder="e.g. Primary, Middle, Secondary" value={form.cycle_name}
              onChange={(e) => setForm({ ...form, cycle_name: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Level Name</label>
            <input type="text" placeholder="e.g. Year 1, Grade 6, CP..." value={form.level_name}
              onChange={(e) => setForm({ ...form, level_name: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Order Index</label>
            <input type="number" placeholder="e.g. 1, 2, 3..." value={form.order_index}
              onChange={(e) => setForm({ ...form, order_index: e.target.value })} className={inputClass} />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Delete Level"
        description={`Delete "${deleteItem?.cycle_name} - ${deleteItem?.level_name}"?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">Classes using this level will lose their level reference.</p>
      </Modal>
    </DashboardLayout>
  );
}
