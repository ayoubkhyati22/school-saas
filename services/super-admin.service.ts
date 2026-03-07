import { supabase } from '@/lib/supabase/client';

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  basic: 29,
  pro: 99,
  enterprise: 299,
};

export async function getPlatformStats() {
  const [
    schoolsRes,
    usersRes,
    studentsRes,
    teachersRes,
    schoolAdminsRes,
    parentsRes,
    levelsRes,
    subjectsRes,
    competenciesRes,
    schoolPlansRes,
  ] = await Promise.all([
    supabase.from('schools').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'school_admin'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'parent'),
    supabase.from('ref_levels').select('id', { count: 'exact', head: true }),
    supabase.from('ref_subjects').select('id', { count: 'exact', head: true }),
    supabase.from('ref_competencies').select('id', { count: 'exact', head: true }),
    supabase.from('schools').select('subscription_plan'),
  ]);

  const schools = schoolPlansRes.data || [];
  const monthlyRevenue = schools.reduce((sum, s) => sum + (PLAN_PRICES[s.subscription_plan] || 0), 0);
  const activePaid = schools.filter((s) => s.subscription_plan !== 'free').length;

  const planCounts: Record<string, number> = { free: 0, basic: 0, pro: 0, enterprise: 0 };
  schools.forEach((s) => {
    if (planCounts[s.subscription_plan] !== undefined) planCounts[s.subscription_plan]++;
  });

  return {
    totalSchools: schoolsRes.count || 0,
    totalUsers: usersRes.count || 0,
    totalStudents: studentsRes.count || 0,
    totalTeachers: teachersRes.count || 0,
    totalSchoolAdmins: schoolAdminsRes.count || 0,
    totalParents: parentsRes.count || 0,
    totalLevels: levelsRes.count || 0,
    totalSubjects: subjectsRes.count || 0,
    totalCompetencies: competenciesRes.count || 0,
    monthlyRevenue,
    activePaidSubscriptions: activePaid,
    planCounts,
  };
}

export async function getAllUsers(filters?: { role?: string; school_id?: string }) {
  let query = supabase
    .from('profiles')
    .select('*, schools (name)')
    .order('created_at', { ascending: false });

  if (filters?.role) query = query.eq('role', filters.role);
  if (filters?.school_id) query = query.eq('school_id', filters.school_id);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateUserRole(userId: string, role: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function assignUserToSchool(userId: string, schoolId: string | null) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ school_id: schoolId })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getRecentSchools(limit = 5) {
  const { data, error } = await supabase
    .from('schools')
    .select('id, name, subscription_plan, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getRecentUsers(limit = 5) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, schools (name), created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
