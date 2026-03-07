'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getStudentsWithClass, updateProfile } from '@/services/profile.service';
import { createUser, deleteUser } from '@/services/user.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Mail, Phone, Users, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function StudentsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', phone_number: '', class_id: '' });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        try {
          const [studentsData, classesRes] = await Promise.all([
            getStudentsWithClass(profileData.school_id),
            supabase.from('classes').select('id, name, academic_year').eq('school_id', profileData.school_id).order('name'),
          ]);
          setStudents(studentsData || []);
          setClasses(classesRes.data || []);
        } catch (e) {
          setStudents([]);
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
    setForm({ full_name: '', email: '', phone_number: '', class_id: '' });
    setShowModal(true);
  };

  const openEdit = (student: any) => {
    setEditItem(student);
    setForm({ full_name: student.full_name, email: student.email || '', phone_number: student.phone_number || '', class_id: student.className ? (classes.find((c) => c.name === student.className)?.id || '') : '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!profile.school_id || !form.full_name) return;
    setSaving(true);
    setSaveError('');
    try {
      if (editItem) {
        await updateProfile(editItem.id, { full_name: form.full_name, phone_number: form.phone_number });
        if (form.class_id) {
          const selectedClass = classes.find((c) => c.id === form.class_id);
          await supabase.from('enrollments').delete().eq('student_id', editItem.id);
          await supabase.from('enrollments').insert({
            student_id: editItem.id,
            class_id: form.class_id,
            school_id: profile.school_id,
            academic_year: selectedClass?.academic_year || String(new Date().getFullYear()),
          });
        }
        const updated = await getStudentsWithClass(profile.school_id);
        setStudents(updated || []);
      } else {
        if (!form.email) { setSaveError('Email is required.'); setSaving(false); return; }
        const newProfile = await createUser({ full_name: form.full_name, email: form.email, phone_number: form.phone_number, role: 'student', school_id: profile.school_id });
        if (newProfile && form.class_id) {
          const selectedClass = classes.find((c) => c.id === form.class_id);
          await supabase.from('enrollments').insert({
            student_id: newProfile.id,
            class_id: form.class_id,
            school_id: profile.school_id,
            academic_year: selectedClass?.academic_year || String(new Date().getFullYear()),
          });
        }
        const updated = await getStudentsWithClass(profile.school_id);
        setStudents(updated || []);
      }
      setShowModal(false);
      setSaveError('');
      setForm({ full_name: '', email: '', phone_number: '', class_id: '' });
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to save student.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteUser(deleteItem.id);
      setStudents((prev) => prev.filter((s) => s.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'full_name',
      label: 'Student',
      render: (student: any) => (
        <div className="flex items-center gap-3">
          {student.avatar_url ? (
            <img src={student.avatar_url} alt={student.full_name} className="w-9 h-9 object-cover" />
          ) : (
            <div className="w-9 h-9 bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-foreground font-semibold text-sm">{student.full_name?.charAt(0)?.toUpperCase()}</span>
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{student.full_name}</p>
            <p className="text-xs text-muted-foreground">@{student.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (student: any) =>
        student.email ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail size={13} />
            <span className="text-sm text-foreground">{student.email}</span>
          </div>
        ) : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: 'phone_number',
      label: 'Phone',
      render: (student: any) =>
        student.phone_number ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone size={13} />
            <span className="text-sm text-foreground">{student.phone_number}</span>
          </div>
        ) : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: 'class', label: 'Class',
      render: (student: any) => <span className="text-sm text-foreground">{student.className || '—'}</span>,
    },
    { key: 'status', label: 'Status', render: () => <Badge variant="success">Active</Badge> },
    ...(canManage ? [{
      key: 'actions', label: '',
      render: (student: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(student); }}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteItem(student); }}>
            <Trash2 size={13} className="text-red-500" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Students"
        description="Manage students enrolled in your school"
        action={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus size={15} className="mr-2" />
              Add Student
            </Button>
          ) : undefined
        }
      />

      <DataTable
        data={students}
        columns={columns}
        loading={loading}
        keyExtractor={(s) => s.id}
        emptyMessage="No students found"
        emptyIcon={<Users size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['full_name', 'email', 'username']}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Student' : 'Add Student'}
        description={editItem ? 'Update student information' : 'Add a new student to your school'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editItem ? 'Save Changes' : 'Add Student'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <input
              type="text"
              placeholder="Student's full name"
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
                placeholder="student@school.com"
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
          {classes.length > 0 && (
            <Select
              label={editItem ? 'Change Class' : 'Enroll in Class (Optional)'}
              placeholder="Select a class..."
              value={form.class_id}
              onValueChange={(v) => setForm({ ...form, class_id: v })}
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
            />
          )}
          {saveError && <p className="text-xs text-destructive">{saveError}</p>}
        </div>
      </Modal>

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Remove Student"
        description={`Are you sure you want to remove "${deleteItem?.full_name}"? This action cannot be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Remove</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">The student's submissions and results will also be affected.</p>
      </Modal>
    </DashboardLayout>
  );
}
