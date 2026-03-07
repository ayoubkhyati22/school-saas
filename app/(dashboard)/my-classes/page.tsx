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
          // Fetch classes where teacher has school_subjects assignments
          const { data: subjectsData } = await supabase
            .from('school_subjects')
            .select(`
              *,
              ref_subjects (label),
              classes (id, name, academic_year)
            `)
            .eq('school_id', profileData.school_id)
            .eq('teacher_id', profileData.id);

          const classMap = new Map();
          (subjectsData || []).forEach((subject: any) => {
            if (subject.classes) {
              const classId = subject.classes.id;
              if (!classMap.has(classId)) {
                classMap.set(classId, {
                  ...subject.classes,
                  subjects: [],
                });
              }
              classMap.get(classId).subjects.push(
                subject.custom_label || subject.ref_subjects?.label || 'Subject'
              );
            }
          });

          // Get student count for each class
          const classes = Array.from(classMap.values());
          const enriched = await Promise.all(
            classes.map(async (cls: any) => {
              const { count } = await supabase
                .from('enrollments')
                .select('id', { count: 'exact' })
                .eq('class_id', cls.id);
              return { ...cls, studentCount: count || 0 };
            })
          );

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
