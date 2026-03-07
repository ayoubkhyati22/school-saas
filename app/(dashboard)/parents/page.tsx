'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getParents } from '@/services/profile.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Mail, Phone, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ParentsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
  });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.school_id) {
        try {
          const data = await getParents(profileData.school_id);
          setParents(data || []);
        } catch (e) {
          setParents([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !profile) return <LoadingPage />;

  const canCreate = profile.role === 'school_admin';

  const handleSubmit = async () => {
    if (!profile.school_id || !form.full_name || !form.email) return;
    setSaving(true);
    try {
      await supabase.from('profiles').insert({
        full_name: form.full_name,
        email: form.email,
        phone_number: form.phone_number,
        school_id: profile.school_id,
        role: 'parent',
        username: form.email.split('@')[0],
      });
      const updated = await getParents(profile.school_id);
      setParents(updated || []);
      setShowModal(false);
      setForm({ full_name: '', email: '', phone_number: '' });
    } catch (e) {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'full_name',
      label: 'Parent',
      render: (parent: any) => (
        <div className="flex items-center gap-3">
          {parent.avatar_url ? (
            <img src={parent.avatar_url} alt={parent.full_name} className="w-9 h-9 object-cover" />
          ) : (
            <div className="w-9 h-9 bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-foreground font-semibold text-sm">
                {parent.full_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{parent.full_name}</p>
            <p className="text-xs text-muted-foreground">@{parent.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (parent: any) =>
        parent.email ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail size={13} />
            <span className="text-sm text-foreground">{parent.email}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      key: 'phone_number',
      label: 'Phone',
      render: (parent: any) =>
        parent.phone_number ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone size={13} />
            <span className="text-sm text-foreground">{parent.phone_number}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: () => <Badge variant="success">Active</Badge>,
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Parents"
        description="Manage parents and guardians"
        action={
          canCreate ? (
            <Button onClick={() => setShowModal(true)}>
              <Plus size={15} className="mr-2" />
              Add Parent
            </Button>
          ) : undefined
        }
      />

      <DataTable
        data={parents}
        columns={columns}
        keyExtractor={(p) => p.id}
        emptyMessage="No parents found"
        emptyIcon={<Users size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['full_name', 'email', 'username']}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Parent"
        description="Add a new parent or guardian"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>Add Parent</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <input
              type="text"
              placeholder="Parent's full name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              placeholder="parent@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Phone Number</label>
            <input
              type="tel"
              placeholder="+1 234 567 8900"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
