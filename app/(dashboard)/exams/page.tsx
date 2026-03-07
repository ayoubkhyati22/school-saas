'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getExams, createExam, updateExam, deleteExam, getExamResults, recordExamResult } from '@/services/exam.service';
import { getClasses, getClassStudents } from '@/services/class.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Calendar, Award, Pencil, Trash2, ClipboardEdit } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ExamsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [resultsExam, setResultsExam] = useState<any>(null);
  const [examStudents, setExamStudents] = useState<any[]>([]);
  const [examResults, setExamResults] = useState<Record<string, { score: string; comment: string }>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [form, setForm] = useState({ title: '', exam_date: '', max_score: '20', coefficient: '1', term: '', class_id: '', subject_id: '' });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        try {
          const [examsData, classesData, subjectsRes] = await Promise.all([
            getExams(profileData.school_id),
            getClasses(profileData.school_id),
            supabase.from('school_subjects').select('id, custom_label, ref_subjects(label)').eq('school_id', profileData.school_id),
          ]);
          setExams(examsData || []);
          setClasses(classesData || []);
          setSubjects(subjectsRes.data || []);
        } catch (e) {
          setExams([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !profile) return <LoadingPage />;

  const canCreate = ['teacher', 'school_admin'].includes(profile.role);

  const resetForm = () => setForm({ title: '', exam_date: '', max_score: '20', coefficient: '1', term: '', class_id: '', subject_id: '' });

  const openCreate = () => { setEditItem(null); resetForm(); setShowModal(true); };

  const openEdit = (exam: any) => {
    setEditItem(exam);
    setForm({
      title: exam.title, exam_date: exam.exam_date?.slice(0, 16) || '',
      max_score: String(exam.max_score || 20), coefficient: String(exam.coefficient || 1),
      term: exam.term || '', class_id: exam.class_id || '', subject_id: exam.subject_id || '',
    });
    setShowModal(true);
  };

  const openResults = async (exam: any) => {
    setResultsExam(exam);
    try {
      const [studentsData, resultsData] = await Promise.all([
        getClassStudents(exam.class_id),
        getExamResults(exam.id),
      ]);
      const students = (studentsData || []).map((e: any) => e.profiles).filter(Boolean);
      setExamStudents(students);
      const map: Record<string, { score: string; comment: string }> = {};
      (resultsData || []).forEach((r: any) => {
        map[r.student_id] = { score: String(r.score_obtained ?? ''), comment: r.teacher_comment || '' };
      });
      students.forEach((s: any) => {
        if (!map[s.id]) map[s.id] = { score: '', comment: '' };
      });
      setExamResults(map);
    } catch (e) {
      setExamStudents([]);
      setExamResults({});
    }
  };

  const handleSubmit = async () => {
    if (!profile.school_id || !form.title || !form.exam_date || !form.class_id) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateExam(editItem.id, {
          title: form.title, exam_date: form.exam_date,
          max_score: Number(form.max_score), coefficient: Number(form.coefficient),
          term: form.term, class_id: form.class_id, subject_id: form.subject_id,
        });
      } else {
        await createExam({
          school_id: profile.school_id, teacher_id: profile.id,
          class_id: form.class_id, subject_id: form.subject_id, title: form.title,
          exam_date: form.exam_date, max_score: Number(form.max_score),
          coefficient: Number(form.coefficient), term: form.term,
        });
      }
      const updated = await getExams(profile.school_id);
      setExams(updated || []);
      setShowModal(false);
      resetForm();
    } catch (e) {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteExam(deleteItem.id);
      setExams((prev) => prev.filter((e) => e.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveResults = async () => {
    if (!resultsExam) return;
    setSavingResults(true);
    try {
      const promises = Object.entries(examResults)
        .filter(([, val]) => val.score !== '')
        .map(([studentId, val]) =>
          recordExamResult({
            exam_id: resultsExam.id, student_id: studentId,
            score_obtained: Number(val.score), teacher_comment: val.comment || undefined,
          })
        );
      await Promise.all(promises);
      setResultsExam(null);
    } catch (e) {
    } finally {
      setSavingResults(false);
    }
  };

  const getSubjectLabel = (exam: any) => {
    if (exam.school_subjects?.custom_label) return exam.school_subjects.custom_label;
    if (exam.school_subjects?.ref_subjects?.label) return exam.school_subjects.ref_subjects.label;
    return 'No subject';
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return dateStr; }
  };

  const columns = [
    {
      key: 'title', label: 'Exam',
      render: (exam: any) => (
        <div>
          <p className="font-medium text-foreground">{exam.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{getSubjectLabel(exam)}</p>
        </div>
      ),
    },
    { key: 'class', label: 'Class', render: (exam: any) => <span className="text-sm text-foreground">{exam.classes?.name || '—'}</span> },
    {
      key: 'exam_date', label: 'Date',
      render: (exam: any) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={13} />
          <span className="text-sm">{formatDate(exam.exam_date)}</span>
        </div>
      ),
    },
    { key: 'max_score', label: 'Max Score', render: (exam: any) => <span className="text-sm text-foreground">/{exam.max_score}</span> },
    { key: 'term', label: 'Term', render: (exam: any) => <span className="text-sm text-foreground">{exam.term || '—'}</span> },
    {
      key: 'status', label: 'Status',
      render: (exam: any) => {
        const isPast = new Date(exam.exam_date) < new Date();
        return <Badge variant={isPast ? 'success' : 'warning'}>{isPast ? 'Completed' : 'Upcoming'}</Badge>;
      },
    },
    ...(canCreate ? [{
      key: 'actions', label: '',
      render: (exam: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" title="Enter Results" onClick={(e) => { e.stopPropagation(); openResults(exam); }}>
            <ClipboardEdit size={13} className="text-blue-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(exam); }}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteItem(exam); }}>
            <Trash2 size={13} className="text-red-500" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Exams"
        description="Manage exams and assessments"
        action={
          canCreate ? (
            <Button onClick={openCreate}>
              <Plus size={15} className="mr-2" />
              Create Exam
            </Button>
          ) : undefined
        }
      />

      <DataTable
        data={exams}
        columns={columns}
        keyExtractor={(exam) => exam.id}
        emptyMessage="No exams found"
        emptyIcon={<Award size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['title']}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Exam' : 'Create Exam'}
        description={editItem ? 'Update exam details' : 'Schedule a new exam for a class'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editItem ? 'Save Changes' : 'Create Exam'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Exam Title</label>
            <input type="text" placeholder="e.g. Mid-term Math Exam" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Exam Date</label>
            <input type="datetime-local" value={form.exam_date}
              onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Max Score</label>
              <input type="number" min="1" value={form.max_score}
                onChange={(e) => setForm({ ...form, max_score: e.target.value })}
                className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Coefficient</label>
              <input type="number" min="1" value={form.coefficient}
                onChange={(e) => setForm({ ...form, coefficient: e.target.value })}
                className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>
          <Select label="Term" placeholder="Select term..." value={form.term}
            onValueChange={(v) => setForm({ ...form, term: v })}
            options={[{ value: 'T1', label: 'Term 1 (T1)' }, { value: 'T2', label: 'Term 2 (T2)' }, { value: 'T3', label: 'Term 3 (T3)' }]} />
          <Select label="Class" placeholder="Select a class..." value={form.class_id}
            onValueChange={(v) => setForm({ ...form, class_id: v })}
            options={classes.map((c) => ({ value: c.id, label: c.name }))} />
          <Select label="Subject" placeholder="Select a subject..." value={form.subject_id}
            onValueChange={(v) => setForm({ ...form, subject_id: v })}
            options={subjects.map((s: any) => ({ value: s.id, label: s.custom_label || s.ref_subjects?.label || 'Unknown' }))} />
        </div>
      </Modal>

      {/* Enter Results Modal */}
      <Modal
        open={!!resultsExam}
        onClose={() => setResultsExam(null)}
        title={`Enter Results: ${resultsExam?.title || ''}`}
        description={`Class: ${resultsExam?.classes?.name || ''} — Max score: ${resultsExam?.max_score || ''}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setResultsExam(null)}>Cancel</Button>
            <Button onClick={handleSaveResults} loading={savingResults}>Save Results</Button>
          </>
        }
      >
        {examStudents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No students enrolled in this class.</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {examStudents.map((student: any) => (
              <div key={student.id} className="flex items-center gap-3 p-3 border border-border bg-muted/30">
                <div className="w-8 h-8 bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-foreground">{student.full_name?.charAt(0)?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{student.full_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max={resultsExam?.max_score || 20}
                    placeholder="Score"
                    value={examResults[student.id]?.score || ''}
                    onChange={(e) => setExamResults((prev) => ({ ...prev, [student.id]: { ...prev[student.id], score: e.target.value } }))}
                    className="w-20 h-8 border border-input bg-background px-2 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <input
                    type="text" placeholder="Comment"
                    value={examResults[student.id]?.comment || ''}
                    onChange={(e) => setExamResults((prev) => ({ ...prev, [student.id]: { ...prev[student.id], comment: e.target.value } }))}
                    className="w-32 h-8 border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Delete Exam"
        description={`Are you sure you want to delete "${deleteItem?.title}"?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">All recorded results for this exam will also be deleted.</p>
      </Modal>
    </DashboardLayout>
  );
}
