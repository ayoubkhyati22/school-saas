'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Users, ClipboardList, Award, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function MyChildrenPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.id) {
        try {
          // Fetch children (profiles where managed_by = current user id)
          const { data: childrenData } = await supabase
            .from('profiles')
            .select('*')
            .eq('managed_by', profileData.id);

          if (childrenData && childrenData.length > 0) {
            const enriched = await Promise.all(
              childrenData.map(async (child: any) => {
                // Get enrollment / class info
                const { data: enrollmentData } = await supabase
                  .from('enrollments')
                  .select('classes (id, name)')
                  .eq('student_id', child.id)
                  .single();

                // Get recent homework (3 most recent)
                let recentHomework: any[] = [];
                if (enrollmentData?.classes?.id) {
                  const { data: hwData } = await supabase
                    .from('homework')
                    .select('id, title, due_date')
                    .eq('class_id', enrollmentData.classes.id)
                    .order('due_date', { ascending: false })
                    .limit(3);
                  recentHomework = hwData || [];
                }

                // Get recent exam results
                const { data: resultsData } = await supabase
                  .from('exam_results')
                  .select('score_obtained, exams (title, max_score, exam_date)')
                  .eq('student_id', child.id)
                  .order('created_at', { ascending: false })
                  .limit(3);

                return {
                  ...child,
                  className: enrollmentData?.classes?.name || null,
                  recentHomework: recentHomework,
                  recentResults: resultsData || [],
                };
              })
            );
            setChildren(enriched);
          } else {
            setChildren([]);
          }
        } catch (e) {
          setChildren([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !profile) return <LoadingPage />;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    } catch { return dateStr; }
  };

  const getGrade = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 90) return { grade: 'A+', variant: 'success' as const };
    if (pct >= 80) return { grade: 'A', variant: 'success' as const };
    if (pct >= 70) return { grade: 'B', variant: 'info' as const };
    if (pct >= 60) return { grade: 'C', variant: 'warning' as const };
    return { grade: 'D', variant: 'danger' as const };
  };

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="My Children"
        description="Track your children's academic progress"
      />

      {children.length === 0 ? (
        <div className="bg-card border border-border p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Users size={40} className="text-muted-foreground/40" />
          <p className="text-sm">No children linked to your account</p>
          <p className="text-xs text-muted-foreground">Contact the school administrator to link your children.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {children.map((child: any) => (
            <div key={child.id} className="bg-card border border-border overflow-hidden">
              <div className="flex items-center gap-4 p-5 border-b border-border">
                {child.avatar_url ? (
                  <img src={child.avatar_url} alt={child.full_name} className="w-12 h-12 object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-foreground">
                      {child.full_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-foreground">{child.full_name}</h2>
                  {child.className && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      <BookOpen size={12} className="inline mr-1" />
                      Class: {child.className}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                <div className="p-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <ClipboardList size={13} />
                    Recent Homework
                  </h3>
                  {child.recentHomework.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No homework found</p>
                  ) : (
                    <div className="space-y-2">
                      {child.recentHomework.map((hw: any) => {
                        const isOverdue = new Date(hw.due_date) < new Date();
                        return (
                          <div key={hw.id} className="flex items-center justify-between gap-2">
                            <p className="text-sm text-foreground truncate">{hw.title}</p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">{formatDate(hw.due_date)}</span>
                              <Badge variant={isOverdue ? 'danger' : 'success'}>
                                {isOverdue ? 'Overdue' : 'Active'}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Award size={13} />
                    Recent Exam Results
                  </h3>
                  {child.recentResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No results yet</p>
                  ) : (
                    <div className="space-y-2">
                      {child.recentResults.map((result: any, i: number) => {
                        const gradeInfo = result.score_obtained != null && result.exams?.max_score
                          ? getGrade(result.score_obtained, result.exams.max_score)
                          : null;
                        return (
                          <div key={i} className="flex items-center justify-between gap-2">
                            <p className="text-sm text-foreground truncate">{result.exams?.title}</p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {result.score_obtained ?? '?'}/{result.exams?.max_score ?? '?'}
                              </span>
                              {gradeInfo && (
                                <Badge variant={gradeInfo.variant}>{gradeInfo.grade}</Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
