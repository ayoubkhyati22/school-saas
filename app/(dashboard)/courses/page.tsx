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
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import FileUploader from '@/components/ui/FileUploader';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Download, BookOpen, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function CoursesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: '', class_id: '', subject_id: '', is_published: false });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        try {
          const [coursesData, classesData, subjectsRes] = await Promise.all([
            getCourses(profileData.school_id),
            getClasses(profileData.school_id),
            supabase.from('school_subjects').select('id, custom_label, ref_subjects(label)').eq('school_id', profileData.school_id),
          ]);
          setCourses(coursesData || []);
          setClasses(classesData || []);
          setSubjects(subjectsRes.data || []);
        } catch (e) {
          setCourses([]);
        }
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
    try {
      const filePath = `courses/${profile.school_id}/${Date.now()}_${selectedFile.name}`;
      await uploadCourseFile(selectedFile, filePath);
      await createCourse({
        school_id: profile.school_id, teacher_id: profile.id,
        subject_id: form.subject_id, class_id: form.class_id,
        title: form.title, file_path: filePath, is_published: form.is_published,
      });
      const updated = await getCourses(profile.school_id);
      setCourses(updated || []);
      setShowModal(false);
      setForm({ title: '', class_id: '', subject_id: '', is_published: false });
      setSelectedFile(null);
    } catch (e) {
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
    if (course.school_subjects?.custom_label) return course.school_subjects.custom_label;
    if (course.school_subjects?.ref_subjects?.label) return course.school_subjects.ref_subjects.label;
    return 'No subject';
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
            onClick={(e) => { e.stopPropagation(); if (course.file_path) { const url = supabase.storage.from('school-content').getPublicUrl(course.file_path).data?.publicUrl; if (url) window.open(url, '_blank'); } }}>
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
        onClose={() => setShowModal(false)}
        title="Add Course"
        description="Upload a PDF course for your students"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
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
          <Select label="Subject" placeholder="Select a subject..." value={form.subject_id}
            onValueChange={(v) => setForm({ ...form, subject_id: v })}
            options={subjects.map((s: any) => ({ value: s.id, label: s.custom_label || s.ref_subjects?.label || 'Unknown' }))} />
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
