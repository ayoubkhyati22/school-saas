'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { updateProfile, deleteProfile } from '@/services/profile.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function UsersPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'student', school_id: '', phone_number: '' });

  const loadUsers = async () => {
    const { data } = await supabase.from('profiles').select('*, schools (name)').order('created_at', { ascending: false });
    setUsers(data || []);
  };

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.role === 'super_admin') {
        try {
          const [, schoolsRes] = await Promise.all([
            loadUsers(),
            supabase.from('schools').select('id, name').order('name'),
          ]);
          setSchools(schoolsRes.data || []);
        } catch (e) {
          setUsers([]);
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

  const openCreate = () => {
    setEditItem(null);
    setForm({ full_name: '', email: '', role: 'student', school_id: '', phone_number: '' });
    setShowModal(true);
  };

  const openEdit = (user: any) => {
    setEditItem(user);
    setForm({ full_name: user.full_name, email: user.email || '', role: user.role, school_id: user.school_id || '', phone_number: user.phone_number || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.full_name) return;
    setSaving(true);
    try {
      if (editItem) {
        await supabase.from('profiles').update({
          full_name: form.full_name, role: form.role,
          school_id: form.school_id || null, phone_number: form.phone_number || null,
        }).eq('id', editItem.id);
      } else {
        if (!form.email) return;
        await supabase.from('profiles').insert({
          full_name: form.full_name, email: form.email, role: form.role,
          school_id: form.school_id || null, phone_number: form.phone_number || null,
          username: form.email.split('@')[0],
        });
      }
      await loadUsers();
      setShowModal(false);
      setForm({ full_name: '', email: '', role: 'student', school_id: '', phone_number: '' });
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
      setUsers((prev) => prev.filter((u) => u.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const roleVariant = (role: string): 'default' | 'info' | 'success' | 'warning' | 'danger' => {
    const map: any = { super_admin: 'danger', school_admin: 'warning', teacher: 'info', student: 'success', parent: 'default', assistant: 'default' };
    return map[role] || 'default';
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return dateStr; }
  };

  const columns = [
    {
      key: 'full_name', label: 'User',
      render: (user: any) => (
        <div className="flex items-center gap-3">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} className="w-9 h-9 object-cover" />
          ) : (
            <div className="w-9 h-9 bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-foreground font-semibold text-sm">{user.full_name?.charAt(0)?.toUpperCase()}</span>
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{user.full_name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: (user: any) => <Badge variant={roleVariant(user.role)}>{user.role.replace('_', ' ')}</Badge> },
    { key: 'school', label: 'School', render: (user: any) => <span className="text-sm text-muted-foreground">{user.schools?.name || '—'}</span> },
    { key: 'created_at', label: 'Joined', render: (user: any) => <span className="text-sm text-muted-foreground">{formatDate(user.created_at)}</span> },
    {
      key: 'actions', label: '',
      render: (user: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(user); }}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteItem(user); }}
            disabled={user.id === profile?.id}>
            <Trash2 size={13} className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Users"
        description="Manage all platform users"
        action={
          <Button onClick={openCreate}>
            <Plus size={15} className="mr-2" />
            Add User
          </Button>
        }
      />

      <DataTable
        data={users}
        columns={columns}
        keyExtractor={(u) => u.id}
        emptyMessage="No users found"
        emptyIcon={<Users size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['full_name', 'email', 'role']}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit User' : 'Add User'}
        description={editItem ? 'Update user information and role' : 'Create a new platform user'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editItem ? 'Save Changes' : 'Add User'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <input type="text" placeholder="User's full name" value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          {!editItem && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input type="email" placeholder="user@email.com" value={form.email}
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
          <Select label="Role" value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}
            options={[
              { value: 'school_admin', label: 'School Admin' },
              { value: 'teacher', label: 'Teacher' },
              { value: 'student', label: 'Student' },
              { value: 'parent', label: 'Parent' },
              { value: 'assistant', label: 'Assistant' },
            ]} />
          <Select label="School" placeholder="Select a school..." value={form.school_id}
            onValueChange={(v) => setForm({ ...form, school_id: v })}
            options={schools.map((s) => ({ value: s.id, label: s.name }))} />
        </div>
      </Modal>

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Delete User"
        description={`Delete user "${deleteItem?.full_name}"? This action cannot be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">All data associated with this user will be permanently removed.</p>
      </Modal>
    </DashboardLayout>
  );
}
