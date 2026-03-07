'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getParents, updateProfile, deleteProfile } from '@/services/profile.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Mail, Phone, Users, Pencil, Trash2, Link2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ParentsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [parents, setParents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [linkModal, setLinkModal] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkStudentId, setLinkStudentId] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', phone_number: '' });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        try {
          const [data, studentsRes] = await Promise.all([
            getParents(profileData.school_id),
            supabase.from('profiles').select('id, full_name').eq('school_id', profileData.school_id).eq('role', 'student').order('full_name'),
          ]);
          setParents(data || []);
          setStudents(studentsRes.data || []);
        } catch (e) {
          setParents([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !profile) return <LoadingPage />;

  const canManage = profile.role === 'school_admin';

  const openCreate = () => {
    setEditItem(null);
    setForm({ full_name: '', email: '', phone_number: '' });
    setShowModal(true);
  };

  const openEdit = (parent: any) => {
    setEditItem(parent);
    setForm({ full_name: parent.full_name, email: parent.email || '', phone_number: parent.phone_number || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!profile.school_id || !form.full_name) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateProfile(editItem.id, { full_name: form.full_name, phone_number: form.phone_number });
        setParents((prev) => prev.map((p) => p.id === editItem.id ? { ...p, full_name: form.full_name, phone_number: form.phone_number } : p));
      } else {
        if (!form.email) return;
        await supabase.from('profiles').insert({
          full_name: form.full_name, email: form.email,
          phone_number: form.phone_number || null,
          school_id: profile.school_id, role: 'parent',
          username: form.email.split('@')[0],
        });
        const updated = await getParents(profile.school_id);
        setParents(updated || []);
      }
      setShowModal(false);
      setForm({ full_name: '', email: '', phone_number: '' });
    } catch (e) {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteProfile(deleteItem.id);
      setParents((prev) => prev.filter((p) => p.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const handleLink = async () => {
    if (!linkModal || !linkStudentId) return;
    setLinking(true);
    try {
      await supabase.from('profiles').update({ managed_by: linkModal.id }).eq('id', linkStudentId);
      setLinkModal(null);
      setLinkStudentId('');
    } catch (e) {
    } finally {
      setLinking(false);
    }
  };

  const columns = [
    {
      key: 'full_name', label: 'Parent',
      render: (parent: any) => (
        <div className="flex items-center gap-3">
          {parent.avatar_url ? (
            <img src={parent.avatar_url} alt={parent.full_name} className="w-9 h-9 object-cover" />
          ) : (
            <div className="w-9 h-9 bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-foreground font-semibold text-sm">{parent.full_name?.charAt(0)?.toUpperCase()}</span>
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
      key: 'email', label: 'Email',
      render: (parent: any) =>
        parent.email ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail size={13} />
            <span className="text-sm text-foreground">{parent.email}</span>
          </div>
        ) : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: 'phone_number', label: 'Phone',
      render: (parent: any) =>
        parent.phone_number ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone size={13} />
            <span className="text-sm text-foreground">{parent.phone_number}</span>
          </div>
        ) : <span className="text-muted-foreground text-sm">—</span>,
    },
    { key: 'status', label: 'Status', render: () => <Badge variant="success">Active</Badge> },
    ...(canManage ? [{
      key: 'actions', label: '',
      render: (parent: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" title="Link child" onClick={(e) => { e.stopPropagation(); setLinkModal(parent); setLinkStudentId(''); }}>
            <Link2 size={13} className="text-blue-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(parent); }}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteItem(parent); }}>
            <Trash2 size={13} className="text-red-500" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Parents"
        description="Manage parents and guardians"
        action={
          canManage ? (
            <Button onClick={openCreate}>
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
        title={editItem ? 'Edit Parent' : 'Add Parent'}
        description={editItem ? 'Update parent information' : 'Add a new parent or guardian'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editItem ? 'Save Changes' : 'Add Parent'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <input type="text" placeholder="Parent's full name" value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          {!editItem && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input type="email" placeholder="parent@email.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Phone Number</label>
            <input type="tel" placeholder="+1 234 567 8900" value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!linkModal}
        onClose={() => setLinkModal(null)}
        title="Link Child to Parent"
        description={`Link a student to ${linkModal?.full_name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setLinkModal(null)}>Cancel</Button>
            <Button onClick={handleLink} loading={linking} disabled={!linkStudentId}>Link Student</Button>
          </>
        }
      >
        <Select
          label="Select Student"
          placeholder="Choose a student..."
          value={linkStudentId}
          onValueChange={setLinkStudentId}
          options={students.map((s) => ({ value: s.id, label: s.full_name }))}
        />
      </Modal>

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Remove Parent"
        description={`Are you sure you want to remove "${deleteItem?.full_name}"?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Remove</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">Their linked children will be unlinked from this parent account.</p>
      </Modal>
    </DashboardLayout>
  );
}
