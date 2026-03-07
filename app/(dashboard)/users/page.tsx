'use client';

import { useEffect, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useUsers } from '@/hooks/useUsers';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const inputClass = 'h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';

export default function UsersPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { users, loading, saving, deleting, update, remove } = useUsers();

  const [schools, setSchools] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [form, setForm] = useState({ full_name: '', role: 'student', school_id: '', phone_number: '' });

  useEffect(() => {
    supabase.from('schools').select('id, name').order('name').then(({ data }) => setSchools(data || []));
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

  const openEdit = (user: any) => {
    setEditItem(user);
    setForm({ full_name: user.full_name, role: user.role, school_id: user.school_id || '', phone_number: user.phone_number || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!editItem || !form.full_name) return;
    const ok = await update(editItem.id, {
      full_name: form.full_name,
      role: form.role,
      school_id: form.school_id || null,
      phone_number: form.phone_number || null,
    });
    if (ok) { setShowModal(false); setEditItem(null); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    const ok = await remove(deleteItem.id);
    if (ok) setDeleteItem(null);
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
    { key: 'phone', label: 'Phone', render: (user: any) => <span className="text-sm text-muted-foreground">{user.phone_number || '—'}</span> },
    { key: 'created_at', label: 'Joined', render: (user: any) => <span className="text-sm text-muted-foreground">{formatDate(user.created_at)}</span> },
    {
      key: 'actions', label: '',
      render: (user: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(user); }}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm"
            onClick={(e) => { e.stopPropagation(); setDeleteItem(user); }}
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
      />

      <DataTable
        data={users}
        columns={columns}
        keyExtractor={(u) => u.id}
        emptyMessage="No users found"
        emptyIcon={<Users size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['full_name', 'email', 'role']}
        loading={loading}
      />

      {/* Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Edit User"
        description="Update user information and role"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <input type="text" placeholder="User's full name" value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Phone Number</label>
            <input type="tel" placeholder="+1 234 567 8900" value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className={inputClass} />
          </div>
          <Select label="Role" value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}
            options={[
              { value: 'super_admin', label: 'Super Admin' },
              { value: 'school_admin', label: 'School Admin' },
              { value: 'teacher', label: 'Teacher' },
              { value: 'student', label: 'Student' },
              { value: 'parent', label: 'Parent' },
              { value: 'assistant', label: 'Assistant' },
            ]} />
          <Select label="School" placeholder="No school (platform-level)" value={form.school_id}
            onValueChange={(v) => setForm({ ...form, school_id: v })}
            options={schools.map((s) => ({ value: s.id, label: s.name }))} />
        </div>
      </Modal>

      {/* Delete Modal */}
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
