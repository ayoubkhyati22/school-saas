'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getExams, createExam } from '@/services/exam.service';
import { getClasses } from '@/services/class.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Calendar, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ExamsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    exam_date: '',
    max_score: '20',
    coefficient: '1',
    term: '',
    class_id: '',
    subject_id: '',
  });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.school_id) {
        try {
          const [examsData, classesData, subjectsRes] = await Promise.all([
            getExams(profileData.school_id),
            getClasses(profileData.school_id),
            supabase
              .from('school_subjects')
              .select('id, custom_label, ref_subjects(label)')
              .eq('school_id', profileData.school_id),
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

  const handleSubmit = async () => {
    if (!profile.school_id || !form.title || !form.exam_date || !form.class_id) return;
    setSaving(true);
    try {
      await createExam({
        school_id: profile.school_id,
        teacher_id: profile.id,
        class_id: form.class_id,
        subject_id: form.subject_id,
        title: form.title,
        exam_date: form.exam_date,
        max_score: Number(form.max_score),
        coefficient: Number(form.coefficient),
        term: form.term,
      });
      const updated = await getExams(profile.school_id);
      setExams(updated || []);
      setShowModal(false);
      setForm({ title: '', exam_date: '', max_score: '20', coefficient: '1', term: '', class_id: '', subject_id: '' });
    } catch (e) {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const getSubjectLabel = (exam: any) => {
    if (exam.school_subjects?.custom_label) return exam.school_subjects.custom_label;
    if (exam.school_subjects?.ref_subjects?.label) return exam.school_subjects.ref_subjects.label;
    return 'No subject';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Exam',
      render: (exam: any) => (
        <div>
          <p className="font-medium text-foreground">{exam.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{getSubjectLabel(exam)}</p>
        </div>
      ),
    },
    {
      key: 'class',
      label: 'Class',
      render: (exam: any) => <span className="text-sm text-foreground">{exam.classes?.name || '—'}</span>,
    },
    {
      key: 'exam_date',
      label: 'Date',
      render: (exam: any) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={13} />
          <span className="text-sm">{formatDate(exam.exam_date)}</span>
        </div>
      ),
    },
    {
      key: 'max_score',
      label: 'Max Score',
      render: (exam: any) => <span className="text-sm text-foreground">/{exam.max_score}</span>,
    },
    {
      key: 'term',
      label: 'Term',
      render: (exam: any) => <span className="text-sm text-foreground">{exam.term || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (exam: any) => {
        const isPast = new Date(exam.exam_date) < new Date();
        return (
          <Badge variant={isPast ? 'success' : 'warning'}>
            {isPast ? 'Completed' : 'Upcoming'}
          </Badge>
        );
      },
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Exams"
        description="Manage exams and assessments"
        action={
          canCreate ? (
            <Button onClick={() => setShowModal(true)}>
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

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create Exam"
        description="Schedule a new exam for a class"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>Create Exam</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Exam Title</label>
            <input
              type="text"
              placeholder="e.g. Mid-term Math Exam"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Exam Date</label>
            <input
              type="datetime-local"
              value={form.exam_date}
              onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Max Score</label>
              <input
                type="number"
                min="1"
                value={form.max_score}
                onChange={(e) => setForm({ ...form, max_score: e.target.value })}
                className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Coefficient</label>
              <input
                type="number"
                min="1"
                value={form.coefficient}
                onChange={(e) => setForm({ ...form, coefficient: e.target.value })}
                className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <Select
            label="Term"
            placeholder="Select term..."
            value={form.term}
            onValueChange={(v) => setForm({ ...form, term: v })}
            options={[
              { value: 'T1', label: 'Term 1 (T1)' },
              { value: 'T2', label: 'Term 2 (T2)' },
              { value: 'T3', label: 'Term 3 (T3)' },
            ]}
          />
          <Select
            label="Class"
            placeholder="Select a class..."
            value={form.class_id}
            onValueChange={(v) => setForm({ ...form, class_id: v })}
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Select
            label="Subject"
            placeholder="Select a subject..."
            value={form.subject_id}
            onValueChange={(v) => setForm({ ...form, subject_id: v })}
            options={subjects.map((s: any) => ({
              value: s.id,
              label: s.custom_label || s.ref_subjects?.label || 'Unknown',
            }))}
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
