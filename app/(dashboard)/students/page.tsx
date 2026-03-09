'use client';

import { useEffect, useRef, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getStudentsWithClass, updateProfile } from '@/services/profile.service';
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
import {
  Plus, Mail, Phone, Users, Pencil, Trash2, Eye,
  BookOpen, FileText, CreditCard, Calendar, Camera,
  GraduationCap, XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function StudentsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', phone_number: '', class_id: '' });

  // Avatar upload in edit
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Delete modal
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [classFilter, setClassFilter] = useState('');

  // 360° view modal
  const [viewItem, setViewItem] = useState<any>(null);
  const [viewData, setViewData] = useState<{ exams: any[]; homework: any[]; invoices: any[] }>({ exams: [], homework: [], invoices: [] });
  const [viewLoading, setViewLoading] = useState(false);
  const [viewTab, setViewTab] = useState<'overview' | 'exams' | 'homework' | 'finance'>('overview');

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
        } catch {
          setStudents([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (!profile) return <LoadingPage />;

  const canManage = profile.role === 'school_admin';

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalStudents = students.length;
  const enrolledStudents = students.filter((s) => s.classId).length;
  const unassignedStudents = students.filter((s) => !s.classId).length;

  // ── Filtered data ──────────────────────────────────────────────────────────
  const filteredStudents = classFilter
    ? students.filter((s) => s.classId === classFilter)
    : students;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditItem(null);
    setForm({ full_name: '', email: '', phone_number: '', class_id: '' });
    setEditAvatarPreview(null);
    setShowModal(true);
  };

  const openEdit = (student: any) => {
    setEditItem(student);
    setForm({
      full_name: student.full_name,
      email: student.email || '',
      phone_number: student.phone_number || '',
      class_id: student.classId || '',
    });
    setEditAvatarPreview(student.avatar_url || null);
    setShowModal(true);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editItem) return;
    setUploadingAvatar(true);
    try {
      const path = `avatars/${editItem.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('school-saas').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('school-saas').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', editItem.id);
      setEditAvatarPreview(urlData.publicUrl);
      setStudents((prev) =>
        prev.map((s) => (s.id === editItem.id ? { ...s, avatar_url: urlData.publicUrl } : s))
      );
    } catch {
      // silent – keep existing avatar
    } finally {
      setUploadingAvatar(false);
    }
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
    } catch {
    } finally {
      setDeleting(false);
    }
  };

  const openView = async (student: any) => {
    setViewItem(student);
    setViewTab('overview');
    setViewLoading(true);
    try {
      const [examsRes, hwRes, invoicesRes] = await Promise.all([
        supabase
          .from('exam_results')
          .select('*, exams(title, exam_date, max_score, term)')
          .eq('student_id', student.id)
          .order('exams(exam_date)', { ascending: false }),
        supabase
          .from('homework_submissions')
          .select('*, homework(title, due_date)')
          .eq('student_id', student.id)
          .order('submitted_at', { ascending: false }),
        supabase
          .from('invoices')
          .select('*')
          .eq('student_id', student.id)
          .order('due_date', { ascending: false }),
      ]);
      setViewData({
        exams: examsRes.data || [],
        homework: hwRes.data || [],
        invoices: invoicesRes.data || [],
      });
    } finally {
      setViewLoading(false);
    }
  };

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'full_name',
      label: 'Student',
      render: (student: any) => (
        <div className="flex items-center gap-3">
          {student.avatar_url ? (
            <img src={student.avatar_url} alt={student.full_name} className="w-9 h-9 object-cover flex-shrink-0" />
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
          <div className="flex items-center gap-2">
            <Mail size={13} className="text-muted-foreground" />
            <span className="text-sm text-foreground">{student.email}</span>
          </div>
        ) : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: 'phone_number',
      label: 'Phone',
      render: (student: any) =>
        student.phone_number ? (
          <div className="flex items-center gap-2">
            <Phone size={13} className="text-muted-foreground" />
            <span className="text-sm text-foreground">{student.phone_number}</span>
          </div>
        ) : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: 'class',
      label: 'Class',
      render: (student: any) =>
        student.className ? (
          <Badge variant="default">{student.className}</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">Unassigned</span>
        ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (student: any) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar size={12} />
          <span>{student.created_at ? new Date(student.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: () => <Badge variant="success">Active</Badge>,
    },
    {
      key: 'actions',
      label: '',
      render: (student: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); openView(student); }}
            title="View profile"
          >
            <Eye size={13} />
          </Button>
          {canManage && (
            <>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(student); }}>
                <Pencil size={13} />
              </Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteItem(student); }}>
                <Trash2 size={13} className="text-red-500" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // ── 360° view helpers ──────────────────────────────────────────────────────
  const avgScore =
    viewData.exams.length > 0
      ? (
          viewData.exams.reduce((sum: number, r: any) => sum + (r.score_obtained ?? 0), 0) /
          viewData.exams.filter((r: any) => r.score_obtained != null).length
        ).toFixed(1)
      : null;

  const paidInvoices = viewData.invoices.filter((i: any) => i.status === 'paid');
  const totalInvoiced = viewData.invoices.reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const totalPaid = paidInvoices.reduce((s: number, i: any) => s + (i.amount || 0), 0);

  const VIEW_TABS: { id: typeof viewTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: GraduationCap },
    { id: 'exams', label: `Exams (${viewData.exams.length})`, icon: BookOpen },
    { id: 'homework', label: `Homework (${viewData.homework.length})`, icon: FileText },
    { id: 'finance', label: `Finance (${viewData.invoices.length})`, icon: CreditCard },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Students"
        description="Manage and view students enrolled in your school"
        action={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus size={15} className="mr-2" />
              Add Student
            </Button>
          ) : undefined
        }
      />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-blue-500' },
          { label: 'Enrolled in Class', value: enrolledStudents, icon: GraduationCap, color: 'text-green-500' },
          { label: 'Not Assigned', value: unassignedStudents, icon: XCircle, color: 'text-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border p-4 flex items-center gap-4">
            <div className={`${color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Class filter ── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Filter by class:</span>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-9 border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring pr-8"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {classFilter && (
          <button
            onClick={() => setClassFilter('')}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filter
          </button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
        </span>
      </div>

      <DataTable
        data={filteredStudents}
        columns={columns}
        loading={loading}
        keyExtractor={(s) => s.id}
        emptyMessage="No students found"
        emptyIcon={<Users size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['full_name', 'email', 'username', 'phone_number']}
        pageSize={10}
      />

      {/* ── Create / Edit Modal ── */}
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
          {/* Avatar section (edit only) */}
          {editItem && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Profile Photo</label>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  {editAvatarPreview ? (
                    <img src={editAvatarPreview} alt="Avatar" className="w-16 h-16 object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-muted flex items-center justify-center">
                      <span className="text-2xl font-bold text-foreground">
                        {editItem.full_name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 w-6 h-6 bg-primary flex items-center justify-center text-primary-foreground hover:opacity-80 transition-opacity"
                  >
                    {uploadingAvatar ? (
                      <div className="w-3 h-3 border border-primary-foreground border-t-transparent animate-spin" />
                    ) : (
                      <Camera size={12} />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Click the camera icon to upload a photo.</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG — max 2 MB</p>
                </div>
              </div>
            </div>
          )}

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

      {/* ── Delete Modal ── */}
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

      {/* ── 360° View Modal ── */}
      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title="Student Profile"
        description="Complete student overview"
      >
        {viewItem && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 bg-muted/30 border border-border">
              {viewItem.avatar_url ? (
                <img src={viewItem.avatar_url} alt={viewItem.full_name} className="w-14 h-14 object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-foreground">{viewItem.full_name?.charAt(0)?.toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-base">{viewItem.full_name}</p>
                <p className="text-xs text-muted-foreground">@{viewItem.username}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {viewItem.email && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail size={11} /> {viewItem.email}
                    </span>
                  )}
                  {viewItem.phone_number && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone size={11} /> {viewItem.phone_number}
                    </span>
                  )}
                  {viewItem.className && (
                    <Badge variant="default">{viewItem.className}</Badge>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar size={11} />
                    Joined {viewItem.created_at ? new Date(viewItem.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-border -mb-1">
              {VIEW_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setViewTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    viewTab === id
                      ? 'text-foreground border-b-2 border-primary -mb-px'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>

            {viewLoading ? (
              <div className="py-8 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="min-h-[200px]">
                {/* Overview tab */}
                {viewTab === 'overview' && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Exams Taken', value: viewData.exams.filter((e) => e.score_obtained != null).length, icon: BookOpen },
                      { label: 'Average Score', value: avgScore ? `${avgScore}` : '—', icon: GraduationCap },
                      { label: 'HW Submitted', value: viewData.homework.length, icon: FileText },
                      { label: 'Amount Paid', value: `${totalPaid.toLocaleString()} / ${totalInvoiced.toLocaleString()}`, icon: CreditCard },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="bg-muted/30 border border-border p-3 flex items-center gap-3">
                        <Icon size={16} className="text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-base font-bold text-foreground">{value}</p>
                          <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Exams tab */}
                {viewTab === 'exams' && (
                  <div className="space-y-2">
                    {viewData.exams.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No exam results yet.</p>
                    ) : (
                      viewData.exams.map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between p-3 border border-border bg-muted/20">
                          <div>
                            <p className="text-sm font-medium text-foreground">{r.exams?.title || 'Exam'}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.exams?.exam_date ? new Date(r.exams.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                              {r.exams?.term ? ` · ${r.exams.term}` : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            {r.score_obtained != null ? (
                              <p className="text-sm font-bold text-foreground">
                                {r.score_obtained} <span className="text-muted-foreground font-normal text-xs">/ {r.exams?.max_score}</span>
                              </p>
                            ) : (
                              <Badge variant="default">{r.attendance_status || 'absent'}</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Homework tab */}
                {viewTab === 'homework' && (
                  <div className="space-y-2">
                    {viewData.homework.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No homework submissions yet.</p>
                    ) : (
                      viewData.homework.map((sub: any) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 border border-border bg-muted/20">
                          <div>
                            <p className="text-sm font-medium text-foreground">{sub.homework?.title || 'Homework'}</p>
                            <p className="text-xs text-muted-foreground">
                              Submitted {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {sub.grade != null && (
                              <span className="text-sm font-bold text-foreground">{sub.grade}</span>
                            )}
                            <Badge variant={sub.status === 'graded' ? 'success' : 'default'}>
                              {sub.status || 'submitted'}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Finance tab */}
                {viewTab === 'finance' && (
                  <div className="space-y-2">
                    {viewData.invoices.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No invoices found.</p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-3 bg-muted/30 border border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          <span>Total invoiced: <span className="text-foreground font-bold text-sm">{totalInvoiced.toLocaleString()}</span></span>
                          <span>Paid: <span className="text-green-600 font-bold text-sm">{totalPaid.toLocaleString()}</span></span>
                        </div>
                        {viewData.invoices.map((inv: any) => (
                          <div key={inv.id} className="flex items-center justify-between p-3 border border-border bg-muted/20">
                            <div>
                              <p className="text-sm font-medium text-foreground">{inv.title}</p>
                              <p className="text-xs text-muted-foreground">
                                Due {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-foreground">{(inv.amount || 0).toLocaleString()}</span>
                              <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'default'}>
                                {inv.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
