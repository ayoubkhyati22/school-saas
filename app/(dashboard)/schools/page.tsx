'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, School } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function SchoolsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    massar_id: '',
    subscription_plan: 'free',
  });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.role === 'super_admin') {
        try {
          const { data } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
          setSchools(data || []);
        } catch (e) {
          setSchools([]);
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
    if (!form.name) return;
    setSaving(true);
    try {
      await supabase.from('schools').insert({
        name: form.name,
        address: form.address || null,
        massar_id: form.massar_id || null,
        subscription_plan: form.subscription_plan,
      });
      const { data } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
      setSchools(data || []);
      setShowModal(false);
      setForm({ name: '', address: '', massar_id: '', subscription_plan: 'free' });
    } catch (e) {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const planVariant = (plan: string): 'default' | 'info' | 'success' | 'warning' => {
    if (plan === 'free') return 'default';
    if (plan === 'basic') return 'info';
    if (plan === 'pro') return 'success';
    return 'warning';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'School Name',
      render: (school: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-muted flex items-center justify-center flex-shrink-0">
            <School size={16} className="text-muted-foreground" />
          </div>
          <span className="font-medium text-foreground">{school.name}</span>
        </div>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      render: (school: any) => (
        <span className="text-sm text-muted-foreground">{school.address || '—'}</span>
      ),
    },
    {
      key: 'massar_id',
      label: 'Massar ID',
      render: (school: any) => (
        <span className="text-sm text-foreground font-mono">{school.massar_id || '—'}</span>
      ),
    },
    {
      key: 'subscription_plan',
      label: 'Plan',
      render: (school: any) => (
        <Badge variant={planVariant(school.subscription_plan)}>
          {school.subscription_plan?.charAt(0).toUpperCase() + school.subscription_plan?.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (school: any) => (
        <span className="text-sm text-muted-foreground">{formatDate(school.created_at)}</span>
      ),
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Schools"
        description="Manage all schools on the platform"
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={15} className="mr-2" />
            Add School
          </Button>
        }
      />

      <DataTable
        data={schools}
        columns={columns}
        keyExtractor={(s) => s.id}
        emptyMessage="No schools found"
        emptyIcon={<School size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['name', 'massar_id']}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add School"
        description="Register a new school on the platform"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>Add School</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">School Name</label>
            <input
              type="text"
              placeholder="School name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Address</label>
            <input
              type="text"
              placeholder="School address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Massar ID</label>
            <input
              type="text"
              placeholder="Official Massar identifier"
              value={form.massar_id}
              onChange={(e) => setForm({ ...form, massar_id: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <Select
            label="Subscription Plan"
            value={form.subscription_plan}
            onValueChange={(v) => setForm({ ...form, subscription_plan: v })}
            options={[
              { value: 'free', label: 'Free' },
              { value: 'basic', label: 'Basic ($29/mo)' },
              { value: 'pro', label: 'Pro ($99/mo)' },
              { value: 'enterprise', label: 'Enterprise ($299/mo)' },
            ]}
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
