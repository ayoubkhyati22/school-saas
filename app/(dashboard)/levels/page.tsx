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
import { Plus, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function LevelsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cycle_name: '',
    level_name: '',
    order_index: '',
  });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.role === 'super_admin') {
        try {
          const { data } = await supabase.from('ref_levels').select('*').order('order_index');
          setLevels(data || []);
        } catch (e) {
          setLevels([]);
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

  const handleSubmit = async () => {
    if (!form.cycle_name || !form.level_name) return;
    setSaving(true);
    try {
      await supabase.from('ref_levels').insert({
        cycle_name: form.cycle_name,
        level_name: form.level_name,
        order_index: form.order_index ? Number(form.order_index) : null,
      });
      const { data } = await supabase.from('ref_levels').select('*').order('order_index');
      setLevels(data || []);
      setShowModal(false);
      setForm({ cycle_name: '', level_name: '', order_index: '' });
    } catch (e) {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'cycle_name',
      label: 'Cycle',
      render: (level: any) => (
        <span className="font-medium text-foreground">{level.cycle_name}</span>
      ),
    },
    {
      key: 'level_name',
      label: 'Level Name',
      render: (level: any) => (
        <span className="text-sm text-foreground">{level.level_name}</span>
      ),
    },
    {
      key: 'order_index',
      label: 'Order',
      render: (level: any) => (
        <span className="text-sm text-muted-foreground tabular-nums">{level.order_index ?? '—'}</span>
      ),
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Levels"
        description="Manage academic cycles and levels"
        action={
          <Button onClick={() => setShowModal(true)}>
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
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Level"
        description="Create a new academic level"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>Add Level</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Cycle Name</label>
            <input
              type="text"
              placeholder="e.g. Primary, Middle, Secondary"
              value={form.cycle_name}
              onChange={(e) => setForm({ ...form, cycle_name: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Level Name</label>
            <input
              type="text"
              placeholder="e.g. Year 1, Grade 6, CP..."
              value={form.level_name}
              onChange={(e) => setForm({ ...form, level_name: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Order Index</label>
            <input
              type="number"
              placeholder="e.g. 1, 2, 3..."
              value={form.order_index}
              onChange={(e) => setForm({ ...form, order_index: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
