'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getParentsWithChildCount, updateProfile } from '@/services/profile.service';
import { createUser, deleteUser } from '@/services/user.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Mail, Phone, Users, Pencil, Trash2, Link2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ParentsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [parents, setParents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [linkModal, setLinkModal] = useState<any>(null);
  const [childrenModal, setChildrenModal] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState('');
  const [saveError, setSaveError] = useState('');
  const [linkStudentId, setLinkStudentId] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', phone_number: '' });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        try {
          const [data, studentsRes] = await Promise.all([
            getParentsWithChildCount(profileData.school_id),
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

  if (!profile) return <LoadingPage />;


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

  const refreshParents = async () => {
    if (!profile?.school_id) return;
    const updated = await getParentsWithChildCount(profile.school_id);
    setParents(updated || []);
    // Also refresh children modal if open
    if (childrenModal) {
      const refreshed = (updated || []).find((p: any) => p.id === childrenModal.id);
      if (refreshed) setChildrenModal(refreshed);
    }
  };

  const handleSubmit = async () => {
    if (!profile.school_id || !form.full_name) return;
    setSaving(true);
    setSaveError('');
    try {
      if (editItem) {
        await updateProfile(editItem.id, { full_name: form.full_name, phone_number: form.phone_number });
      } else {
        if (!form.email) { setSaveError('Email is required.'); setSaving(false); return; }
        await createUser({ full_name: form.full_name, email: form.email, phone_number: form.phone_number, role: 'parent', school_id: profile.school_id });
      }
      await refreshParents();
      setShowModal(false);
      setForm({ full_name: '', email: '', phone_number: '' });
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to save. Check permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      // Unlink all children first
      await supabase.from('profiles').update({ managed_by: null }).eq('managed_by', deleteItem.id);
      await deleteUser(deleteItem.id);
      setParents((prev) => prev.filter((p: any) => p.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const handleLink = async () => {
    if (!linkModal || !linkStudentId || !profile?.school_id) return;
    setLinking(true);
    try {
      const { error } = await supabase.from('profiles').update({ managed_by: linkModal.id }).eq('id', linkStudentId);
      if (error) throw error;
      await refreshParents();
      setLinkModal(null);
      setLinkStudentId('');
    } catch (e) {
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (childId: string) => {
    setUnlinking(childId);
    try {
      await supabase.from('profiles').update({ managed_by: null }).eq('id', childId);
      await refreshParents();
    } catch (e) {
    } finally {
      setUnlinking('');
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
    {
      key: 'children', label: 'Children',
      render: (parent: any) => (
        parent.children && parent.children.length > 0 ? (
          <button
            onClick={(e) => { e.stopPropagation(); setChildrenModal(parent); }}
            className="flex flex-col gap-0.5 text-left hover:opacity-70 transition-opacity"
          >
            {parent.children.slice(0, 2).map((child: any) => (
              <span key={child.id} className="text-xs text-foreground">{child.full_name}</span>
            ))}
            {parent.children.length > 2 && (
              <span className="text-xs text-muted-foreground">+{parent.children.length - 2} more</span>
            )}
          </button>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      ),
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
        loading={loading}
        keyExtractor={(p) => p.id}
        emptyMessage="No parents found"
        emptyIcon={<Users size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['full_name', 'email', 'username']}
      />

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSaveError(''); }}
        title={editItem ? 'Edit Parent' : 'Add Parent'}
        description={editItem ? 'Update parent information' : 'Add a new parent or guardian'}
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowModal(false); setSaveError(''); }}>Cancel</Button>
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
          {saveError && <p className="text-xs text-destructive">{saveError}</p>}
        </div>
      </Modal>

      <Modal
        open={!!childrenModal}
        onClose={() => setChildrenModal(null)}
        title={`Children of ${childrenModal?.full_name}`}
        description="Linked students for this parent"
      >
        <div className="space-y-2">
          {childrenModal?.children?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No children linked yet.</p>
          ) : (
            childrenModal?.children?.map((child: any) => (
              <div key={child.id} className="flex items-center justify-between p-3 border border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-foreground">{child.full_name?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <span className="text-sm text-foreground">{child.full_name}</span>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleUnlink(child.id)}
                    disabled={unlinking === child.id}
                    className="p-1 hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-40"
                    title="Unlink child"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))
          )}
          {canManage && (
            <div className="pt-2 border-t border-border">
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setChildrenModal(null); setLinkModal(childrenModal); setLinkStudentId(''); }}>
                <Link2 size={13} className="mr-2" />
                Link another child
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!linkModal}
        onClose={() => setLinkModal(null)}
        title="Link Child to Parent"
        description={`Select a student to link to ${linkModal?.full_name}`}
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
          options={students.filter((s) => !linkModal?.children?.some((c: any) => c.id === s.id)).map((s) => ({ value: s.id, label: s.full_name }))}
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
