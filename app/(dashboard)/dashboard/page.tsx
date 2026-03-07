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
  AreaChart,
  Area,
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

const attendanceData = [
  { month: 'Sep', students: 220, attendance: 95 },
  { month: 'Oct', students: 230, attendance: 92 },
  { month: 'Nov', students: 228, attendance: 88 },
  { month: 'Dec', students: 215, attendance: 90 },
  { month: 'Jan', students: 235, attendance: 93 },
  { month: 'Feb', students: 240, attendance: 91 },
  { month: 'Mar', students: 245, attendance: 94 },
];

const gradeData = [
  { subject: 'Math', avg: 72 },
  { subject: 'French', avg: 68 },
  { subject: 'Science', avg: 75 },
  { subject: 'History', avg: 80 },
  { subject: 'English', avg: 65 },
  { subject: 'Art', avg: 85 },
];

const recentActivities = [
  { color: 'bg-green-500', title: 'New homework published', subtitle: 'Mathematics - Class 6A', time: '2 hours ago' },
  { color: 'bg-blue-500', title: 'Exam results available', subtitle: 'French - Class 5B', time: '5 hours ago' },
  { color: 'bg-amber-500', title: 'New gallery album', subtitle: 'School trip - Zoo', time: 'Yesterday' },
  { color: 'bg-purple-500', title: 'New student enrolled', subtitle: 'Ahmed Benali - Class 4C', time: '2 days ago' },
  { color: 'bg-red-500', title: 'Invoice overdue', subtitle: 'Student: Sara Mansouri', time: '3 days ago' },
];

const upcomingEvents = [
  { title: 'Parent-Teacher Meeting', date: 'Friday, Mar 15 at 6:00 PM', badge: 'info' as const },
  { title: 'End of Term Exams', date: 'Mar 20 - Mar 25', badge: 'warning' as const },
  { title: 'School Holiday', date: 'Apr 1 - Apr 15', badge: 'success' as const },
  { title: 'Science Fair', date: 'Apr 20 at 9:00 AM', badge: 'default' as const },
];

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const superAdminStats = useSuperAdminStats();
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    homework: 0,
    exams: 0,
    revenue: 0,
    notifications: 0,
    parents: 0,
  });

  useEffect(() => {
    async function load() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.school_id) {
        try {
          const [studentsRes, teachersRes, classesRes, homeworkRes, examsRes, notifRes, parentsRes] =
            await Promise.all([
              supabase.from('profiles').select('id', { count: 'exact' }).eq('school_id', profileData.school_id).eq('role', 'student'),
              supabase.from('profiles').select('id', { count: 'exact' }).eq('school_id', profileData.school_id).eq('role', 'teacher'),
              supabase.from('classes').select('id', { count: 'exact' }).eq('school_id', profileData.school_id),
              supabase.from('homework').select('id', { count: 'exact' }).eq('school_id', profileData.school_id),
              supabase.from('exams').select('id', { count: 'exact' }).eq('school_id', profileData.school_id),
              supabase.from('notifications').select('id', { count: 'exact' }).eq('school_id', profileData.school_id),
              supabase.from('profiles').select('id', { count: 'exact' }).eq('school_id', profileData.school_id).eq('role', 'parent'),
            ]);

          setStats({
            students: studentsRes.count || 0,
            teachers: teachersRes.count || 0,
            classes: classesRes.count || 0,
            homework: homeworkRes.count || 0,
            exams: examsRes.count || 0,
            revenue: 12450,
            notifications: notifRes.count || 0,
            parents: parentsRes.count || 0,
          });
        } catch (e) {
          // silently fail, use defaults
        }
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
            Your account exists but has no profile record, or a database policy error occurred (HTTP 500).
          </p>
          <div className="bg-muted p-4 text-left mb-4">
            <p className="text-xs font-semibold text-foreground mb-2">Fix: Run this SQL in Supabase Dashboard → SQL Editor</p>
            <code className="text-xs text-muted-foreground break-all">
              See file: supabase/fix_rls_recursion.sql
            </code>
          </div>
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
        <StatCard key="students" title="Total Students" value={stats.students} icon={Users} color="blue" trend={{ value: 12, isPositive: true }} />,
        <StatCard key="teachers" title="Teachers" value={stats.teachers} icon={GraduationCap} color="green" trend={{ value: 5, isPositive: true }} />,
        <StatCard key="classes" title="Classes" value={stats.classes} icon={School} color="purple" />,
        <StatCard key="homework" title="Active Homework" value={stats.homework} icon={ClipboardList} color="amber" />,
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
        <StatCard key="classes" title="My Classes" value={stats.classes} icon={BookOpen} color="blue" />,
        <StatCard key="homework" title="Homework Assigned" value={stats.homework} icon={ClipboardList} color="amber" />,
        <StatCard key="exams" title="Exams Created" value={stats.exams} icon={Award} color="green" />,
        <StatCard key="students" title="Total Students" value={stats.students} icon={Users} color="purple" />,
      ];
    }
    if (isStudent) {
      return [
        <StatCard key="hw" title="Active Homework" value={stats.homework} icon={ClipboardList} color="blue" />,
        <StatCard key="exams" title="Upcoming Exams" value={stats.exams} icon={Award} color="amber" />,
        <StatCard key="notif" title="Notifications" value={stats.notifications} icon={Bell} color="green" />,
        <StatCard key="avg" title="Average Score" value="74%" icon={TrendingUp} color="purple" />,
      ];
    }
    if (isParent) {
      return [
        <StatCard key="children" title="My Children" value={2} icon={Users} color="blue" />,
        <StatCard key="hw" title="Pending Homework" value={stats.homework} icon={ClipboardList} color="amber" />,
        <StatCard key="exams" title="Upcoming Exams" value={stats.exams} icon={Award} color="green" />,
        <StatCard key="invoices" title="Pending Invoices" value={3} icon={DollarSign} color="red" />,
      ];
    }
    return [
      <StatCard key="students" title="Total Students" value={stats.students} icon={Users} color="blue" />,
      <StatCard key="classes" title="Classes" value={stats.classes} icon={School} color="green" />,
      <StatCard key="homework" title="Homework" value={stats.homework} icon={ClipboardList} color="amber" />,
      <StatCard key="exams" title="Exams" value={stats.exams} icon={Award} color="purple" />,
    ];
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
          {/* Plan distribution pie */}
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
              {superAdminStats.recentSchools.map((school: any) => (
                <div key={school.id} className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{school.name}</p>
                  <span className="text-xs text-muted-foreground flex-shrink-0 capitalize">{school.subscription_plan}</span>
                </div>
              ))}
              {superAdminStats.recentSchools.length === 0 && (
                <p className="text-sm text-muted-foreground">No schools yet</p>
              )}
            </div>
          </div>

          {/* Platform stats breakdown */}
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

      {(isAdmin || isTeacher) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-card border border-border p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Student Enrollment Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 0 }}
                  labelStyle={{ color: 'var(--foreground)' }}
                />
                <Area type="monotone" dataKey="students" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Average Scores by Subject</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 0 }}
                />
                <Bar dataKey="avg" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, i) => (
              <div key={i} className={`flex items-start gap-3 ${i < recentActivities.length - 1 ? 'pb-4 border-b border-border' : ''}`}>
                <div className={`w-2 h-2 mt-2 flex-shrink-0 ${activity.color}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.subtitle}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Upcoming Events</h2>
          <div className="space-y-4">
            {upcomingEvents.map((event, i) => (
              <div key={i} className={`flex items-start justify-between gap-3 ${i < upcomingEvents.length - 1 ? 'pb-4 border-b border-border' : ''}`}>
                <div className="flex items-start gap-3">
                  <Calendar size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{event.date}</p>
                  </div>
                </div>
                <Badge variant={event.badge}>Event</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
