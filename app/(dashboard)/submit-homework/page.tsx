'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getHomework, submitHomework } from '@/services/homework.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/button';
import FileUploader from '@/components/ui/FileUploader';
import { LoadingPage, LoadingContent } from '@/components/ui/LoadingSpinner';
import { ClipboardList, Calendar, ChevronRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function SubmitHomeworkPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [homework, setHomework] = useState<any[]>([]);
  const [selectedHw, setSelectedHw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [submissionForm, setSubmissionForm] = useState({
    content_text: '',
  });
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.school_id) {
        try {
          // Get student's enrolled class first
          const { data: enrollment } = await supabase
            .from('enrollments')
            .select('class_id')
            .eq('student_id', profileData.id)
            .single();

          const [hwData, subsData] = await Promise.all([
            getHomework(profileData.school_id, enrollment?.class_id ? { classId: enrollment.class_id } : undefined),
            supabase.from('homework_submissions').select('homework_id').eq('student_id', profileData.id),
          ]);

          // Only show active (not overdue) homework
          const active = (hwData || []).filter((hw: any) => new Date(hw.due_date) >= new Date());
          setHomework(active);

          const submittedIds = new Set((subsData.data || []).map((s: any) => s.homework_id));
          setSubmitted(submittedIds);
        } catch (e) {
          setHomework([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (!profile) return <LoadingPage />;


  const handleSubmit = async () => {
    if (!selectedHw || !profile) return;
    setSubmitting(true);
    try {
      let fileUrl: string | undefined;
      if (submissionFile) {
        const path = `submissions/${profile.id}/${Date.now()}_${submissionFile.name}`;
        await supabase.storage.from('school-saas').upload(path, submissionFile);
        fileUrl = supabase.storage.from('school-saas').getPublicUrl(path).data?.publicUrl;
      }

      await submitHomework({
        homework_id: selectedHw.id,
        student_id: profile.id,
        content_text: submissionForm.content_text || undefined,
        file_url: fileUrl,
      });

      setSubmitted((prev) => new Set([...prev, selectedHw.id]));
      setSelectedHw(null);
      setSubmissionForm({ content_text: '' });
      setSubmissionFile(null);
    } catch (e) {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const getSubjectLabel = (hw: any) => {
    if (hw.school_subjects?.custom_label) return hw.school_subjects.custom_label;
    if (hw.school_subjects?.ref_subjects?.label) return hw.school_subjects.ref_subjects.label;
    return 'No subject';
  };

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Submit Homework"
        description="View and submit your pending homework assignments"
      />

      {loading ? <LoadingContent /> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Active Assignments</h2>
          {homework.length === 0 ? (
            <div className="bg-card border border-border p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <ClipboardList size={36} className="text-muted-foreground/40" />
              <p className="text-sm">No active homework assignments</p>
            </div>
          ) : (
            <div className="space-y-2">
              {homework.map((hw: any) => {
                const isSubmitted = submitted.has(hw.id);
                const isSelected = selectedHw?.id === hw.id;
                return (
                  <div
                    key={hw.id}
                    onClick={() => !isSubmitted && setSelectedHw(isSelected ? null : hw)}
                    className={`bg-card border p-4 flex items-start justify-between gap-3 transition-colors ${
                      isSubmitted ? 'opacity-60 cursor-default border-border' :
                      isSelected ? 'border-primary cursor-pointer' :
                      'border-border cursor-pointer hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ClipboardList size={14} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{hw.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{getSubjectLabel(hw)} — {hw.classes?.name}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Calendar size={11} className="text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Due: {formatDate(hw.due_date)}</span>
                        </div>
                      </div>
                    </div>
                    {isSubmitted ? (
                      <Badge variant="success">Submitted</Badge>
                    ) : (
                      <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          {selectedHw ? (
            <div className="bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Submit: {selectedHw.title}</h2>
                <button
                  onClick={() => setSelectedHw(null)}
                  className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {selectedHw.description && (
                <div className="mb-4 p-3 bg-muted text-sm text-foreground">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Instructions:</p>
                  {selectedHw.description}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Your Answer</label>
                  <textarea
                    rows={5}
                    placeholder="Write your answer here..."
                    value={submissionForm.content_text}
                    onChange={(e) => setSubmissionForm({ content_text: e.target.value })}
                    className="w-full border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </div>
                <FileUploader
                  onFileSelect={(file) => setSubmissionFile(file)}
                  label="Attach File (Optional)"
                  description="Upload a document or image"
                  maxSizeMB={10}
                />
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={!submissionForm.content_text && !submissionFile}
                >
                  Submit Homework
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground h-full">
              <ClipboardList size={36} className="text-muted-foreground/40" />
              <p className="text-sm text-center">Select a homework assignment from the list to submit it</p>
            </div>
          )}
        </div>
      </div>}
    </DashboardLayout>
  );
}
