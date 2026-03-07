'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile, signOut } from '@/lib/auth';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import {
  Users,
  GraduationCap,
  ClipboardList,
  Award,
  BookOpen,
  Bell,
  TrendingUp,
  Calendar,
  School,
  DollarSign,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabase/client';
import { useSuperAdminStats } from '@/hooks/useSuperAdminStats';

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const superAdminStats = useSuperAdminStats();

  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    revenue: 0,
    notifications: 0,
    parents: 0,
    // school-wide
    homework: 0,
    exams: 0,
    // teacher-specific
    myClasses: 0,
    myHomework: 0,
    myExams: 0,
    // parent-specific
    children: 0,
    pendingInvoices: 0,
    // student-specific
    averageScore: null as number | null,
  });

  const [scoreData, setScoreData] = useState<{ subject: string; avg: number }[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<{ name: string; students: number }[]>([]);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (!profileData) { setLoading(false); return; }

      const schoolId = profileData.school_id;
      if (!schoolId) { setLoading(false); return; }

      try {
        const role = profileData.role;

        // Base stats shared across roles
        const [studentsRes, teachersRes, classesRes, notifRes, parentsRes, invoicesRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact' }).eq('school_id', schoolId).eq('role', 'student'),
          supabase.from('profiles').select('id', { count: 'exact' }).eq('school_id', schoolId).eq('role', 'teacher'),
          supabase.from('classes').select('id', { count: 'exact' }).eq('school_id', schoolId),
          supabase.from('notifications').select('id', { count: 'exact' }).eq('school_id', schoolId),
          supabase.from('profiles').select('id', { count: 'exact' }).eq('school_id', schoolId).eq('role', 'parent'),
          supabase.from('invoices').select('amount').eq('school_id', schoolId).eq('status', 'paid'),
        ]);

        const revenue = (invoicesRes.data || []).reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);

        // Recent notifications (all roles)
        const { data: notifsData } = await supabase
          .from('notifications')
          .select('id, title, content, created_at, target_role')
          .eq('school_id', schoolId)
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentNotifs(notifsData || []);

        // Upcoming exams (all roles)
        const today = new Date().toISOString().split('T')[0];
        const { data: examsUpcoming } = await supabase
          .from('exams')
          .select('id, title, exam_date, classes(name), school_subjects(ref_subjects(label))')
          .eq('school_id', schoolId)
          .gte('exam_date', today)
          .order('exam_date')
          .limit(5);
        setUpcomingExams(examsUpcoming || []);

        const newStats: any = {
          students: studentsRes.count || 0,
          teachers: teachersRes.count || 0,
          classes: classesRes.count || 0,
          revenue,
          notifications: notifRes.count || 0,
          parents: parentsRes.count || 0,
          homework: 0,
          exams: 0,
          myClasses: 0,
          myHomework: 0,
          myExams: 0,
          children: 0,
          pendingInvoices: 0,
          averageScore: null,
        };

        if (role === 'school_admin' || role === 'assistant') {
          const [hwRes, examsRes, allExamsData, enrollmentsData, classesData] = await Promise.all([
            supabase.from('homework').select('id', { count: 'exact' }).eq('school_id', schoolId),
            supabase.from('exams').select('id', { count: 'exact' }).eq('school_id', schoolId),
            supabase.from('exams').select('id, max_score, school_subjects(ref_subjects(label))').eq('school_id', schoolId),
            supabase.from('enrollments').select('class_id').eq('school_id', schoolId),
            supabase.from('classes').select('id, name').eq('school_id', schoolId),
          ]);

          newStats.homework = hwRes.count || 0;
          newStats.exams = examsRes.count || 0;

          // Average scores per subject from real exam results
          const examIds = (allExamsData.data || []).map((e: any) => e.id);
          if (examIds.length > 0) {
            const { data: resultsData } = await supabase
              .from('exam_results')
              .select('exam_id, score_obtained')
              .in('exam_id', examIds);

            const subjectMap: Record<string, { sum: number; count: number }> = {};
            (resultsData || []).forEach((r: any) => {
              const exam = (allExamsData.data || []).find((e: any) => e.id === r.exam_id);
              const label = exam?.school_subjects?.ref_subjects?.label;
              if (!label || r.score_obtained == null || !exam?.max_score) return;
              if (!subjectMap[label]) subjectMap[label] = { sum: 0, count: 0 };
              subjectMap[label].sum += (r.score_obtained / exam.max_score) * 100;
              subjectMap[label].count++;
            });
            setScoreData(
              Object.entries(subjectMap)
                .filter(([, v]) => v.count > 0)
                .map(([subject, v]) => ({ subject, avg: Math.round(v.sum / v.count) }))
            );
          }

          // Students per class
          const classMap: Record<string, { name: string; students: number }> = {};
          (classesData.data || []).forEach((c: any) => { classMap[c.id] = { name: c.name, students: 0 }; });
          (enrollmentsData.data || []).forEach((e: any) => { if (classMap[e.class_id]) classMap[e.class_id].students++; });
          setEnrollmentData(Object.values(classMap).filter((c) => c.students > 0).slice(0, 8));

        } else if (role === 'teacher') {
          const [myHwRes, myExamsRes, myHwClasses] = await Promise.all([
            supabase.from('homework').select('id', { count: 'exact' }).eq('teacher_id', profileData.id).eq('school_id', schoolId),
            supabase.from('exams').select('id', { count: 'exact' }).eq('teacher_id', profileData.id).eq('school_id', schoolId),
            supabase.from('homework').select('class_id').eq('teacher_id', profileData.id).eq('school_id', schoolId),
          ]);

          newStats.myHomework = myHwRes.count || 0;
          newStats.myExams = myExamsRes.count || 0;
          newStats.myClasses = new Set((myHwClasses.data || []).map((r: any) => r.class_id)).size;

          // Average scores for teacher's exams
          const { data: myExamsFull } = await supabase
            .from('exams')
            .select('id, max_score, school_subjects(ref_subjects(label))')
            .eq('teacher_id', profileData.id)
            .eq('school_id', schoolId);

          if ((myExamsFull || []).length > 0) {
            const ids = (myExamsFull || []).map((e: any) => e.id);
            const { data: resultsData } = await supabase
              .from('exam_results').select('exam_id, score_obtained').in('exam_id', ids);

            const subjectMap: Record<string, { sum: number; count: number }> = {};
            (resultsData || []).forEach((r: any) => {
              const exam = (myExamsFull || []).find((e: any) => e.id === r.exam_id);
              const label = exam?.school_subjects?.ref_subjects?.label;
              if (!label || r.score_obtained == null || !exam?.max_score) return;
              if (!subjectMap[label]) subjectMap[label] = { sum: 0, count: 0 };
              subjectMap[label].sum += (r.score_obtained / exam.max_score) * 100;
              subjectMap[label].count++;
            });
            setScoreData(
              Object.entries(subjectMap)
                .filter(([, v]) => v.count > 0)
                .map(([subject, v]) => ({ subject, avg: Math.round(v.sum / v.count) }))
            );
          }

        } else if (role === 'student') {
          const [hwRes, examsRes, myResultsRes] = await Promise.all([
            supabase.from('homework').select('id', { count: 'exact' }).eq('school_id', schoolId),
            supabase.from('exams').select('id', { count: 'exact' }).eq('school_id', schoolId),
            supabase.from('exam_results').select('score_obtained, exams(max_score)').eq('student_id', profileData.id),
          ]);

          newStats.homework = hwRes.count || 0;
          newStats.exams = examsRes.count || 0;

          const scored = (myResultsRes.data || []).filter((r: any) => r.score_obtained != null && (r.exams as any)?.max_score);
          if (scored.length > 0) {
            newStats.averageScore = Math.round(
              scored.reduce((sum: number, r: any) => sum + (r.score_obtained / (r.exams as any).max_score) * 100, 0) / scored.length
            );
          }

        } else if (role === 'parent') {
          const { data: childrenData } = await supabase.from('profiles').select('id').eq('managed_by', profileData.id);
          const childIds = (childrenData || []).map((c: any) => c.id);
          newStats.children = childIds.length;

          const [hwRes, examsRes] = await Promise.all([
            supabase.from('homework').select('id', { count: 'exact' }).eq('school_id', schoolId),
            supabase.from('exams').select('id', { count: 'exact' }).eq('school_id', schoolId),
          ]);
          newStats.homework = hwRes.count || 0;
          newStats.exams = examsRes.count || 0;

          if (childIds.length > 0) {
            const { count: pendingCount } = await supabase
              .from('invoices').select('id', { count: 'exact' })
              .in('student_id', childIds).eq('status', 'pending');
            newStats.pendingInvoices = pendingCount || 0;
          }
        }

        setStats(newStats);
      } catch {
        // silently fail
      }

      setLoading(false);
    }
    load();
  }, []);

  if (!profile && loading) return <LoadingPage />;

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border p-8 text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 dark:text-red-400 text-xl">!</span>
          </div>
          <h2 className="text-base font-semibold text-foreground mb-2">Profile not found</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Your account exists but has no profile record, or a database policy error occurred.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 h-9 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={async () => { await signOut(); window.location.href = '/login'; }}
              className="flex-1 h-9 border border-border text-sm text-foreground hover:bg-muted transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = profile.role === 'school_admin';
  const isSuperAdmin = profile.role === 'super_admin';
  const isTeacher = profile.role === 'teacher';
  const isStudent = profile.role === 'student';
  const isParent = profile.role === 'parent';
  const isAssistant = profile.role === 'assistant';

  const getStatCards = () => {
    if (isAdmin || isAssistant) {
      return [
        <StatCard key="students" title="Total Students" value={stats.students} icon={Users} color="blue" />,
        <StatCard key="teachers" title="Teachers" value={stats.teachers} icon={GraduationCap} color="green" />,
        <StatCard key="classes" title="Classes" value={stats.classes} icon={School} color="purple" />,
        <StatCard key="revenue" title="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={DollarSign} color="amber" />,
      ];
    }
    if (isSuperAdmin) {
      const sa = superAdminStats.stats;
      return [
        <StatCard key="schools" title="Total Schools" value={sa?.totalSchools ?? '…'} icon={School} color="blue" />,
        <StatCard key="users" title="Total Users" value={sa?.totalUsers ?? '…'} icon={Users} color="green" />,
        <StatCard key="revenue" title="Monthly Revenue" value={sa ? `$${sa.monthlyRevenue.toLocaleString()}` : '…'} icon={DollarSign} color="amber" />,
        <StatCard key="subs" title="Paid Subscriptions" value={sa?.activePaidSubscriptions ?? '…'} icon={TrendingUp} color="purple" />,
      ];
    }
    if (isTeacher) {
      return [
        <StatCard key="classes" title="My Classes" value={stats.myClasses} icon={BookOpen} color="blue" />,
        <StatCard key="homework" title="Homework Assigned" value={stats.myHomework} icon={ClipboardList} color="amber" />,
        <StatCard key="exams" title="Exams Created" value={stats.myExams} icon={Award} color="green" />,
        <StatCard key="students" title="Total Students" value={stats.students} icon={Users} color="purple" />,
      ];
    }
    if (isStudent) {
      return [
        <StatCard key="hw" title="Active Homework" value={stats.homework} icon={ClipboardList} color="blue" />,
        <StatCard key="exams" title="Upcoming Exams" value={stats.exams} icon={Award} color="amber" />,
        <StatCard key="notif" title="Notifications" value={stats.notifications} icon={Bell} color="green" />,
        <StatCard key="avg" title="Average Score" value={stats.averageScore !== null ? `${stats.averageScore}%` : '—'} icon={TrendingUp} color="purple" />,
      ];
    }
    if (isParent) {
      return [
        <StatCard key="children" title="My Children" value={stats.children} icon={Users} color="blue" />,
        <StatCard key="hw" title="Pending Homework" value={stats.homework} icon={ClipboardList} color="amber" />,
        <StatCard key="exams" title="Upcoming Exams" value={stats.exams} icon={Award} color="green" />,
        <StatCard key="invoices" title="Pending Invoices" value={stats.pendingInvoices} icon={DollarSign} color="red" />,
      ];
    }
    return [
      <StatCard key="students" title="Total Students" value={stats.students} icon={Users} color="blue" />,
      <StatCard key="classes" title="Classes" value={stats.classes} icon={School} color="green" />,
      <StatCard key="homework" title="Homework" value={stats.homework} icon={ClipboardList} color="amber" />,
      <StatCard key="exams" title="Exams" value={stats.exams} icon={Award} color="purple" />,
    ];
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return days === 1 ? 'Yesterday' : `${days} days ago`;
    } catch { return ''; }
  };

  const formatExamDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const roleVariant = (role: string | null): 'info' | 'success' | 'warning' | 'default' => {
    if (!role) return 'default';
    if (role === 'student') return 'info';
    if (role === 'teacher') return 'success';
    if (role === 'parent') return 'warning';
    return 'default';
  };

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${profile.full_name}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {getStatCards()}
      </div>

      {isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Plan distribution */}
          <div className="bg-card border border-border p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Plan Distribution</h2>
            {superAdminStats.stats && (() => {
              const { planCounts } = superAdminStats.stats;
              const pieData = [
                { name: 'Free', value: planCounts.free, color: '#94a3b8' },
                { name: 'Basic', value: planCounts.basic, color: '#3b82f6' },
                { name: 'Pro', value: planCounts.pro, color: '#22c55e' },
                { name: 'Enterprise', value: planCounts.enterprise, color: '#f59e0b' },
              ].filter((d) => d.value > 0);
              if (pieData.length === 0) return <p className="text-sm text-muted-foreground">No data yet</p>;
              return (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={60} strokeWidth={1}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 0 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2" style={{ backgroundColor: d.color }} />
                          <span className="text-muted-foreground">{d.name}</span>
                        </div>
                        <span className="font-medium text-foreground">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Recent schools */}
          <div className="bg-card border border-border p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Recent Schools</h2>
            <div className="space-y-3">
              {superAdminStats.recentSchools.length === 0 ? (
                <p className="text-sm text-muted-foreground">No schools yet</p>
              ) : superAdminStats.recentSchools.map((school: any) => (
                <div key={school.id} className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{school.name}</p>
                  <span className="text-xs text-muted-foreground flex-shrink-0 capitalize">{school.subscription_plan}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Users breakdown */}
          <div className="bg-card border border-border p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Users Breakdown</h2>
            {superAdminStats.stats && (() => {
              const s = superAdminStats.stats;
              const rows = [
                { label: 'Students', value: s.totalStudents, color: '#3b82f6' },
                { label: 'Teachers', value: s.totalTeachers, color: '#22c55e' },
                { label: 'Parents', value: s.totalParents, color: '#f59e0b' },
                { label: 'School Admins', value: s.totalSchoolAdmins, color: '#8b5cf6' },
              ];
              const max = Math.max(...rows.map((r) => r.value), 1);
              return (
                <div className="space-y-3">
                  {rows.map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{row.label}</span>
                        <span className="text-xs font-semibold text-foreground tabular-nums">{row.value}</span>
                      </div>
                      <div className="h-1.5 bg-muted overflow-hidden">
                        <div className="h-full transition-all" style={{ width: `${(row.value / max) * 100}%`, backgroundColor: row.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {(isAdmin || isAssistant || isTeacher) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Students per class */}
          <div className="bg-card border border-border p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Students per Class</h2>
            {enrollmentData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No enrollment data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 0 }} />
                  <Bar dataKey="students" fill="#3b82f6" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Average scores by subject */}
          <div className="bg-card border border-border p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Average Scores by Subject</h2>
            {scoreData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No exam results yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 0 }}
                    formatter={(v: any) => [`${v}%`, 'Average']}
                  />
                  <Bar dataKey="avg" fill="#8b5cf6" name="Average" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent notifications */}
        <div className="bg-card border border-border p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Recent Notifications</h2>
          {recentNotifs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              <div className="text-center">
                <Bell size={24} className="text-muted-foreground/40 mx-auto mb-2" />
                <p>No notifications yet</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentNotifs.map((notif, i) => (
                <div key={notif.id} className={`flex items-start gap-3 ${i < recentNotifs.length - 1 ? 'pb-4 border-b border-border' : ''}`}>
                  <div className="w-2 h-2 mt-2 flex-shrink-0 bg-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                      {notif.target_role && (
                        <Badge variant={roleVariant(notif.target_role)}>{notif.target_role}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notif.content}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{formatRelativeTime(notif.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming exams */}
        <div className="bg-card border border-border p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Upcoming Exams</h2>
          {upcomingExams.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              <div className="text-center">
                <Calendar size={24} className="text-muted-foreground/40 mx-auto mb-2" />
                <p>No upcoming exams</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingExams.map((exam, i) => (
                <div key={exam.id} className={`flex items-start justify-between gap-3 ${i < upcomingExams.length - 1 ? 'pb-4 border-b border-border' : ''}`}>
                  <div className="flex items-start gap-3">
                    <Calendar size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{exam.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(exam.school_subjects as any)?.ref_subjects?.label && (
                          <span>{(exam.school_subjects as any).ref_subjects.label} · </span>
                        )}
                        {(exam.classes as any)?.name}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{formatExamDate(exam.exam_date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
