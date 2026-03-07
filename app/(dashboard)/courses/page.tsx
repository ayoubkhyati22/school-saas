'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getCourses, createCourse, uploadCourseFile, toggleCoursePublish, deleteCourse } from '@/services/course.service';
import { getClasses } from '@/services/class.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import FileUploader from '@/components/ui/FileUploader';
import Select from '@/components/ui/select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Download, BookOpen, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function CoursesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [refSubjects, setRefSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: '', class_id: '', ref_subject_id: '', is_published: false });

  const loadCourses = async (profileData: any, filters: any) => {
    try {
      const data = await getCourses(profileData.school_id, filters);
      setCourses(data || []);
    } catch (e: any) {
      // If FK-named join fails, retry with simpler select
      const { data } = await supabase
        .from('courses_pdf')
        .select('*, profiles:teacher_id (full_name), classes (name)')
        .eq('school_id', profileData.school_id)
        .order('created_at', { ascending: false });
      setCourses(data || []);
    }
  };

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        const isViewer = ['student', 'parent'].includes(profileData.role);
        const courseFilters: any = isViewer ? { publishedOnly: true } : {};
        if (profileData.role === 'teacher') courseFilters.teacherId = profileData.id;

        if (profileData.role === 'student') {
          const { data: enrollment } = await supabase
            .from('enrollments')
            .select('class_id')
            .eq('student_id', profileData.id)
            .single();
          if (enrollment?.class_id) courseFilters.classId = enrollment.class_id;
        }

        const [classesData, refSubjectsRes] = await Promise.all([
          getClasses(profileData.school_id),
          supabase.from('ref_subjects').select('id, label').order('label'),
        ]);
        setClasses(classesData || []);
        setRefSubjects(refSubjectsRes.data || []);
        await loadCourses(profileData, courseFilters);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (!profile) return <LoadingPage />;


  const canCreate = ['teacher', 'school_admin'].includes(profile.role);

  const handleSubmit = async () => {
    if (!profile.school_id || !form.title || !form.class_id || !selectedFile) return;
    setSaving(true);
    setSaveError('');
    try {
      // Sanitize filename: remove spaces and special chars
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `courses/${profile.school_id}/${Date.now()}_${safeName}`;
      await uploadCourseFile(selectedFile, filePath);

      // Find or create school_subjects record for selected ref_subject
      let subjectId: string | null = null;
      if (form.ref_subject_id) {
        const { data: existing } = await supabase
          .from('school_subjects')
          .select('id')
          .eq('school_id', profile.school_id)
          .eq('ref_subject_id', form.ref_subject_id)
          .single();
        if (existing) {
          subjectId = existing.id;
        } else {
          const { data: created } = await supabase
            .from('school_subjects')
            .insert({ school_id: profile.school_id, ref_subject_id: form.ref_subject_id, coefficient: 1 })
            .select('id')
            .single();
          subjectId = created?.id || null;
        }
      }

      await createCourse({
        school_id: profile.school_id, teacher_id: profile.id,
        subject_id: subjectId, class_id: form.class_id,
        title: form.title, file_path: filePath, is_published: form.is_published,
      });
      await loadCourses(profile, {});
      setShowModal(false);
      setForm({ title: '', class_id: '', ref_subject_id: '', is_published: false });
      setSelectedFile(null);
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to upload course. Check storage permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (course: any) => {
    try {
      await toggleCoursePublish(course.id, !course.is_published);
      setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, is_published: !c.is_published } : c));
    } catch (e) {}
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteCourse(deleteItem.id);
      setCourses((prev) => prev.filter((c) => c.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const getSubjectLabel = (course: any) => {
    // Handle both FK-named join key and direct key
    const sub = course['school_subjects!courses_pdf_subject_id_fkey'] || course.school_subjects;
    if (sub?.custom_label) return sub.custom_label;
    if (sub?.ref_subjects?.label) return sub.ref_subjects.label;
    return '—';
  };

  const columns = [
    {
      key: 'title', label: 'Course',
      render: (course: any) => (
        <div>
          <p className="font-medium text-foreground">{course.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{getSubjectLabel(course)}</p>
        </div>
      ),
    },
    { key: 'class', label: 'Class', render: (course: any) => <span className="text-sm text-foreground">{course.classes?.name || '—'}</span> },
    { key: 'teacher', label: 'Teacher', render: (course: any) => <span className="text-sm text-foreground">{course.profiles?.full_name || '—'}</span> },
    {
      key: 'is_published', label: 'Status',
      render: (course: any) => <Badge variant={course.is_published ? 'success' : 'warning'}>{course.is_published ? 'Published' : 'Draft'}</Badge>,
    },
    {
      key: 'actions', label: '',
      render: (course: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" title="Download"
            onClick={(e) => { e.stopPropagation(); if (course.file_path) { const url = supabase.storage.from('school-saas').getPublicUrl(course.file_path).data?.publicUrl; if (url) window.open(url, '_blank'); } }}>
            <Download size={14} />
          </Button>
          {canCreate && (
            <>
              <Button variant="ghost" size="sm" title={course.is_published ? 'Unpublish' : 'Publish'}
                onClick={(e) => { e.stopPropagation(); handleTogglePublish(course); }}>
                {course.is_published ? <EyeOff size={13} className="text-amber-500" /> : <Eye size={13} className="text-green-500" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteItem(course); }}>
                <Trash2 size={13} className="text-red-500" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Courses"
        description="Manage and share course materials"
        action={
          canCreate ? (
            <Button onClick={() => setShowModal(true)}>
              <Plus size={15} className="mr-2" />
              Add Course
            </Button>
          ) : undefined
        }
      />

      <DataTable
        data={courses}
        columns={columns}
        loading={loading}
        keyExtractor={(c) => c.id}
        emptyMessage="No courses found"
        emptyIcon={<BookOpen size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['title']}
      />

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSaveError(''); }}
        title="Add Course"
        description="Upload a PDF course for your students"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setShowModal(false); setSaveError(''); }}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving} disabled={!form.title || !form.class_id || !selectedFile}>Upload Course</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Course Title</label>
            <input type="text" placeholder="Enter course title..." value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <FileUploader onFileSelect={(file) => setSelectedFile(file)} accept="application/pdf"
            label="Course PDF" description="Upload a PDF file for this course" maxSizeMB={20} />
          <Select label="Class" placeholder="Select a class..." value={form.class_id}
            onValueChange={(v) => setForm({ ...form, class_id: v })}
            options={classes.map((c) => ({ value: c.id, label: c.name }))} />
          <Select label="Subject (Optional)" placeholder="Select a subject..." value={form.ref_subject_id}
            onValueChange={(v) => setForm({ ...form, ref_subject_id: v })}
            options={refSubjects.map((s: any) => ({ value: s.id, label: s.label }))} />
          {saveError && <p className="text-xs text-destructive">{saveError}</p>}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              className="w-4 h-4 border border-input" />
            <span className="text-sm text-foreground">Publish immediately</span>
          </label>
        </div>
      </Modal>

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Delete Course"
        description={`Delete "${deleteItem?.title}"? This cannot be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">The PDF file and course record will be permanently removed.</p>
      </Modal>
    </DashboardLayout>
  );
}
