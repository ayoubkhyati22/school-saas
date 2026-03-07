'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { LoadingPage, LoadingContent } from '@/components/ui/LoadingSpinner';
import { BookOpen, Users, ClipboardList, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export default function MyClassesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.id && profileData.school_id) {
        try {
          // Fetch classes via courses_pdf and homework (both have teacher_id + class_id)
          const [coursesRes, hwRes] = await Promise.all([
            supabase.from('courses_pdf').select('class_id, school_subjects(custom_label, ref_subjects(label))').eq('teacher_id', profileData.id).eq('school_id', profileData.school_id),
            supabase.from('homework').select('class_id, school_subjects(custom_label, ref_subjects(label))').eq('teacher_id', profileData.id).eq('school_id', profileData.school_id),
          ]);

          const classIds = new Set<string>();
          const subjectsByClass: Record<string, string[]> = {};

          const processItems = (items: any[]) => {
            items.forEach((item: any) => {
              if (!item.class_id) return;
              classIds.add(item.class_id);
              if (!subjectsByClass[item.class_id]) subjectsByClass[item.class_id] = [];
              const label = item.school_subjects?.custom_label || item.school_subjects?.ref_subjects?.label;
              if (label && !subjectsByClass[item.class_id].includes(label)) {
                subjectsByClass[item.class_id].push(label);
              }
            });
          };
          processItems(coursesRes.data || []);
          processItems(hwRes.data || []);

          if (classIds.size === 0) { setMyClasses([]); setLoading(false); return; }

          const classIdsArr = Array.from(classIds);
          const [classesRes, enrollRes] = await Promise.all([
            supabase.from('classes').select('id, name, academic_year').in('id', classIdsArr),
            supabase.from('enrollments').select('class_id').in('class_id', classIdsArr),
          ]);

          const countMap: Record<string, number> = {};
          (enrollRes.data || []).forEach((e: any) => {
            countMap[e.class_id] = (countMap[e.class_id] || 0) + 1;
          });

          const enriched = (classesRes.data || []).map((cls: any) => ({
            ...cls,
            subjects: subjectsByClass[cls.id] || [],
            studentCount: countMap[cls.id] || 0,
          }));

          setMyClasses(enriched);
        } catch (e) {
          setMyClasses([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (!profile) return <LoadingPage />;


  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="My Classes"
        description="Classes you are assigned to teach"
      />

      {loading ? <LoadingContent /> : myClasses.length === 0 ? (
        <div className="bg-card border border-border p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <BookOpen size={40} className="text-muted-foreground/40" />
          <p className="text-sm">No classes assigned yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myClasses.map((cls: any) => (
            <div key={cls.id} className="bg-card border border-border p-5 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
                  <BookOpen size={18} className="text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">{cls.academic_year}</span>
              </div>
              <h3 className="font-semibold text-foreground text-base mb-1">{cls.name}</h3>
              {cls.subjects && cls.subjects.length > 0 && (
                <p className="text-xs text-muted-foreground mb-3">
                  {cls.subjects.slice(0, 2).join(', ')}{cls.subjects.length > 2 ? ` +${cls.subjects.length - 2} more` : ''}
                </p>
              )}
              <div className="flex items-center gap-2 mb-4">
                <Users size={13} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{cls.studentCount} students</span>
              </div>
              <div className="flex gap-2 pt-3 border-t border-border">
                <Link
                  href="/homework"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ClipboardList size={13} />
                  Homework
                </Link>
                <span className="text-border">|</span>
                <Link
                  href="/exams"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Award size={13} />
                  Exams
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
