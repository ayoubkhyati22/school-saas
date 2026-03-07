'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getExamResults } from '@/services/exam.service';
import { getExams } from '@/services/exam.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Award } from 'lucide-react';

export default function ResultsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.school_id) {
        try {
          const examsData = await getExams(profileData.school_id, { teacherId: profileData.id });
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
    try {
      const data = await getExamResults(examId);
      setResults(data || []);
    } catch (e) {
      setResults([]);
    }
  };

  if (loading || !profile) return <LoadingPage />;

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
    if (grade === 'D') return 'danger';
    if (grade === 'F') return 'danger';
    return 'default';
  };

  const selectedExamData = exams.find((e) => e.id === selectedExam);

  const columns = [
    {
      key: 'student',
      label: 'Student',
      render: (result: any) => (
        <div className="flex items-center gap-3">
          {result.profiles?.avatar_url ? (
            <img src={result.profiles.avatar_url} alt="" className="w-8 h-8 object-cover" />
          ) : (
            <div className="w-8 h-8 bg-muted flex items-center justify-center">
              <span className="text-xs font-semibold text-foreground">
                {result.profiles?.full_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          )}
          <span className="font-medium text-foreground text-sm">{result.profiles?.full_name}</span>
        </div>
      ),
    },
    {
      key: 'score',
      label: 'Score',
      render: (result: any) => (
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {result.score_obtained ?? '—'} / {selectedExamData?.max_score ?? '—'}
        </span>
      ),
    },
    {
      key: 'percentage',
      label: 'Percentage',
      render: (result: any) => {
        const max = selectedExamData?.max_score || 1;
        const pct = result.score_obtained != null ? Math.round((result.score_obtained / max) * 100) : null;
        return (
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-muted overflow-hidden">
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
        if (result.score_obtained == null) return <span className="text-muted-foreground text-sm">—</span>;
        const grade = getGrade(result.score_obtained, selectedExamData?.max_score || 1);
        return <Badge variant={gradeVariant(grade)}>{grade}</Badge>;
      },
    },
    {
      key: 'teacher_comment',
      label: 'Comment',
      render: (result: any) => (
        <span className="text-sm text-muted-foreground">{result.teacher_comment || '—'}</span>
      ),
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Exam Results"
        description="View and analyze student performance"
      />

      <div className="mb-4 max-w-xs">
        <Select
          label="Select Exam"
          placeholder="Choose an exam to view results..."
          value={selectedExam}
          onValueChange={loadResults}
          options={exams.map((e) => ({
            value: e.id,
            label: `${e.title} — ${e.classes?.name || ''}`,
          }))}
        />
      </div>

      {selectedExam ? (
        <DataTable
          data={results}
          columns={columns}
          keyExtractor={(r) => r.id}
          emptyMessage="No results recorded for this exam"
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
