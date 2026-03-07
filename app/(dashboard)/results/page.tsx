'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getExamResults, getExams, recordExamResult } from '@/services/exam.service';
import { getClassStudents } from '@/services/class.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Award, Save } from 'lucide-react';

export default function ResultsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingResults, setSavingResults] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, { score: string; comment: string }>>({});

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        try {
          const examsData = await getExams(profileData.school_id,
            profileData.role === 'teacher' ? { teacherId: profileData.id } : undefined
          );
          setExams(examsData || []);
        } catch (e) {
          setExams([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const loadResults = async (examId: string) => {
    if (!examId) return;
    setSelectedExam(examId);
    setEditMode(false);
    const exam = exams.find((e) => e.id === examId);
    try {
      const [resultsData, studentsData] = await Promise.all([
        getExamResults(examId),
        exam?.class_id ? getClassStudents(exam.class_id) : Promise.resolve([]),
      ]);
      setResults(resultsData || []);
      const students = (studentsData || []).map((e: any) => e.profiles).filter(Boolean);
      setAllStudents(students);
      // Pre-fill edit values
      const map: Record<string, { score: string; comment: string }> = {};
      (resultsData || []).forEach((r: any) => {
        map[r.student_id] = { score: String(r.score_obtained ?? ''), comment: r.teacher_comment || '' };
      });
      students.forEach((s: any) => {
        if (!map[s.id]) map[s.id] = { score: '', comment: '' };
      });
      setEditValues(map);
    } catch (e) {
      setResults([]);
    }
  };

  const handleSaveResults = async () => {
    const exam = exams.find((e) => e.id === selectedExam);
    if (!exam) return;
    setSavingResults(true);
    try {
      const promises = Object.entries(editValues)
        .filter(([, val]) => val.score !== '')
        .map(([studentId, val]) =>
          recordExamResult({
            exam_id: selectedExam, student_id: studentId,
            score_obtained: Number(val.score), teacher_comment: val.comment || undefined,
          })
        );
      await Promise.all(promises);
      await loadResults(selectedExam);
      setEditMode(false);
    } catch (e) {
    } finally {
      setSavingResults(false);
    }
  };

  if (!profile) return <LoadingPage />;


  const selectedExamData = exams.find((e) => e.id === selectedExam);
  const canEdit = ['teacher', 'school_admin'].includes(profile.role);

  const getGrade = (score: number, maxScore: number): string => {
    const pct = (score / maxScore) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  };

  const gradeVariant = (grade: string): 'success' | 'info' | 'warning' | 'danger' | 'default' => {
    if (grade.startsWith('A')) return 'success';
    if (grade === 'B') return 'info';
    if (grade === 'C') return 'warning';
    if (grade === 'D' || grade === 'F') return 'danger';
    return 'default';
  };

  // In edit mode, show all students (with or without results)
  const tableData = editMode
    ? allStudents.map((student: any) => {
        const existing = results.find((r) => r.student_id === student.id);
        return { student_id: student.id, profiles: student, score_obtained: existing?.score_obtained ?? null, teacher_comment: existing?.teacher_comment ?? '' };
      })
    : results;

  const viewColumns = [
    {
      key: 'student', label: 'Student',
      render: (result: any) => (
        <div className="flex items-center gap-3">
          {result.profiles?.avatar_url ? (
            <img src={result.profiles.avatar_url} alt="" className="w-8 h-8 object-cover" />
          ) : (
            <div className="w-8 h-8 bg-muted flex items-center justify-center">
              <span className="text-xs font-semibold text-foreground">{result.profiles?.full_name?.charAt(0)?.toUpperCase()}</span>
            </div>
          )}
          <span className="font-medium text-foreground text-sm">{result.profiles?.full_name}</span>
        </div>
      ),
    },
    {
      key: 'score', label: 'Score',
      render: (result: any) => (
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {result.score_obtained ?? '—'} / {selectedExamData?.max_score ?? '—'}
        </span>
      ),
    },
    {
      key: 'percentage', label: 'Percentage',
      render: (result: any) => {
        const max = selectedExamData?.max_score || 1;
        const pct = result.score_obtained != null ? Math.round((result.score_obtained / max) * 100) : null;
        return (
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-muted overflow-hidden">
              <div className={`h-full ${pct != null && pct >= 70 ? 'bg-green-500' : pct != null && pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${pct ?? 0}%` }} />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{pct != null ? `${pct}%` : '—'}</span>
          </div>
        );
      },
    },
    {
      key: 'grade', label: 'Grade',
      render: (result: any) => {
        if (result.score_obtained == null) return <span className="text-muted-foreground text-sm">—</span>;
        const grade = getGrade(result.score_obtained, selectedExamData?.max_score || 1);
        return <Badge variant={gradeVariant(grade)}>{grade}</Badge>;
      },
    },
    { key: 'teacher_comment', label: 'Comment', render: (result: any) => <span className="text-sm text-muted-foreground">{result.teacher_comment || '—'}</span> },
  ];

  const editColumns = [
    {
      key: 'student', label: 'Student',
      render: (result: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted flex items-center justify-center">
            <span className="text-xs font-semibold text-foreground">{result.profiles?.full_name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <span className="font-medium text-foreground text-sm">{result.profiles?.full_name}</span>
        </div>
      ),
    },
    {
      key: 'score', label: `Score (/${selectedExamData?.max_score || 20})`,
      render: (result: any) => (
        <input
          type="number" min="0" max={selectedExamData?.max_score || 20}
          placeholder="—"
          value={editValues[result.student_id]?.score || ''}
          onChange={(e) => setEditValues((prev) => ({ ...prev, [result.student_id]: { ...prev[result.student_id], score: e.target.value } }))}
          className="w-24 h-8 border border-input bg-background px-2 text-sm text-foreground text-center focus:outline-none focus:ring-1 focus:ring-ring"
        />
      ),
    },
    {
      key: 'comment', label: 'Comment',
      render: (result: any) => (
        <input
          type="text" placeholder="Optional comment"
          value={editValues[result.student_id]?.comment || ''}
          onChange={(e) => setEditValues((prev) => ({ ...prev, [result.student_id]: { ...prev[result.student_id], comment: e.target.value } }))}
          className="w-full h-8 border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      ),
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Exam Results"
        description="View and manage student performance"
      />

      <div className="mb-4 flex items-end gap-3 flex-wrap">
        <div className="w-72">
          <Select
            label="Select Exam"
            placeholder="Choose an exam to view results..."
            value={selectedExam}
            onValueChange={loadResults}
            options={exams.map((e) => ({ value: e.id, label: `${e.title} — ${e.classes?.name || ''}` }))}
          />
        </div>
        {selectedExam && canEdit && (
          <div className="flex items-center gap-2 pb-0.5">
            {editMode ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveResults} loading={savingResults}>
                  <Save size={13} className="mr-1.5" />
                  Save Results
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                Enter / Edit Results
              </Button>
            )}
          </div>
        )}
      </div>

      {selectedExam ? (
        <DataTable
          data={tableData}
          columns={editMode ? editColumns : viewColumns}
          keyExtractor={(r) => r.student_id || r.id}
          emptyMessage={editMode ? 'No students enrolled in this class' : 'No results recorded for this exam'}
          emptyIcon={<Award size={32} className="text-muted-foreground/40" />}
        />
      ) : (
        <div className="bg-card border border-border p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Award size={40} className="text-muted-foreground/40" />
          <p className="text-sm">Select an exam to view results</p>
        </div>
      )}
    </DashboardLayout>
  );
}
