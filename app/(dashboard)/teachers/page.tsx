'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getTeachers, updateProfile, deleteProfile } from '@/services/profile.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Mail, Phone, GraduationCap, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function TeachersPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone_number: '' });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        try {
          const data = await getTeachers(profileData.school_id);
          setTeachers(data || []);
        } catch (e) {
          setTeachers([]);
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

  const openEdit = (teacher: any) => {
    setEditItem(teacher);
    setForm({ full_name: teacher.full_name, email: teacher.email || '', phone_number: teacher.phone_number || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!profile.school_id || !form.full_name) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateProfile(editItem.id, { full_name: form.full_name, phone_number: form.phone_number });
        setTeachers((prev) => prev.map((t) => t.id === editItem.id ? { ...t, full_name: form.full_name, phone_number: form.phone_number } : t));
      } else {
        if (!form.email) return;
        await supabase.from('profiles').insert({
          full_name: form.full_name, email: form.email,
          phone_number: form.phone_number || null,
          school_id: profile.school_id, role: 'teacher',
          username: form.email.split('@')[0],
        });
        const updated = await getTeachers(profile.school_id);
        setTeachers(updated || []);
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
      setTeachers((prev) => prev.filter((t) => t.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'full_name',
      label: 'Teacher',
      render: (teacher: any) => (
        <div className="flex items-center gap-3">
          {teacher.avatar_url ? (
            <img src={teacher.avatar_url} alt={teacher.full_name} className="w-9 h-9 object-cover" />
          ) : (
            <div className="w-9 h-9 bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-foreground font-semibold text-sm">{teacher.full_name?.charAt(0)?.toUpperCase()}</span>
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{teacher.full_name}</p>
            <p className="text-xs text-muted-foreground">@{teacher.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email', label: 'Email',
      render: (teacher: any) =>
        teacher.email ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail size={13} />
            <span className="text-sm text-foreground">{teacher.email}</span>
          </div>
        ) : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: 'phone_number', label: 'Phone',
      render: (teacher: any) =>
        teacher.phone_number ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone size={13} />
            <span className="text-sm text-foreground">{teacher.phone_number}</span>
          </div>
        ) : <span className="text-muted-foreground text-sm">—</span>,
    },
    { key: 'status', label: 'Status', render: () => <Badge variant="success">Active</Badge> },
    ...(canManage ? [{
      key: 'actions', label: '',
      render: (teacher: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(teacher); }}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteItem(teacher); }}>
            <Trash2 size={13} className="text-red-500" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Teachers"
        description="Manage teachers at your school"
        action={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus size={15} className="mr-2" />
              Add Teacher
            </Button>
          ) : undefined
        }
      />

      <DataTable
        data={teachers}
        columns={columns}
        keyExtractor={(t) => t.id}
        emptyMessage="No teachers found"
        emptyIcon={<GraduationCap size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['full_name', 'email', 'username']}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Teacher' : 'Add Teacher'}
        description={editItem ? 'Update teacher information' : 'Add a new teacher to your school'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editItem ? 'Save Changes' : 'Add Teacher'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <input
              type="text"
              placeholder="Teacher's full name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          {!editItem && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                placeholder="teacher@school.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
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

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Remove Teacher"
        description={`Are you sure you want to remove "${deleteItem?.full_name}"?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Remove</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">Their homework, exams, and courses will remain but be unlinked.</p>
      </Modal>
    </DashboardLayout>
  );
}
