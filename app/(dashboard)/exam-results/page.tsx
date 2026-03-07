'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getStudentExamResults } from '@/services/exam.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Award } from 'lucide-react';

export default function ExamResultsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.id) {
        try {
          const data = await getStudentExamResults(profileData.id);
          setResults(data || []);
        } catch (e) {
          setResults([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (!profile) return <LoadingPage />;


  const getGrade = (score: number, max: number): string => {
    const pct = (score / max) * 100;
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
    return 'danger';
  };

  const getSubjectLabel = (result: any) => {
    const exam = result.exams;
    if (!exam) return '—';
    if (exam.school_subjects?.custom_label) return exam.school_subjects.custom_label;
    if (exam.school_subjects?.ref_subjects?.label) return exam.school_subjects.ref_subjects.label;
    return '—';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const columns = [
    {
      key: 'subject',
      label: 'Subject',
      render: (result: any) => (
        <span className="text-sm font-medium text-foreground">{getSubjectLabel(result)}</span>
      ),
    },
    {
      key: 'exam',
      label: 'Exam',
      render: (result: any) => (
        <div>
          <p className="text-sm text-foreground">{result.exams?.title || '—'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{result.exams?.classes?.name}</p>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (result: any) => (
        <span className="text-sm text-muted-foreground">{result.exams?.exam_date ? formatDate(result.exams.exam_date) : '—'}</span>
      ),
    },
    {
      key: 'score',
      label: 'Score',
      render: (result: any) => (
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {result.score_obtained ?? '—'} / {result.exams?.max_score ?? '—'}
        </span>
      ),
    },
    {
      key: 'percentage',
      label: 'Percentage',
      render: (result: any) => {
        const max = result.exams?.max_score || 1;
        const pct = result.score_obtained != null ? Math.round((result.score_obtained / max) * 100) : null;
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-muted overflow-hidden">
              <div
                className={`h-full ${pct != null && pct >= 70 ? 'bg-green-500' : pct != null && pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${pct ?? 0}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{pct != null ? `${pct}%` : '—'}</span>
          </div>
        );
      },
    },
    {
      key: 'grade',
      label: 'Grade',
      render: (result: any) => {
        if (result.score_obtained == null || !result.exams?.max_score) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        const grade = getGrade(result.score_obtained, result.exams.max_score);
        return <Badge variant={gradeVariant(grade)}>{grade}</Badge>;
      },
    },
    {
      key: 'term',
      label: 'Term',
      render: (result: any) => (
        <span className="text-sm text-muted-foreground">{result.exams?.term || '—'}</span>
      ),
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Exam Results"
        description="Your academic performance and grades"
      />

      <DataTable
        data={results}
        columns={columns}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyMessage="No exam results found"
        emptyIcon={<Award size={32} className="text-muted-foreground/40" />}
      />
    </DashboardLayout>
  );
}
