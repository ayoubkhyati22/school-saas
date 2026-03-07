'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { BookOpen, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function SubjectsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [configModal, setConfigModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ custom_label: '', coefficient: '1' });

  const loadSubjects = async (schoolId: string) => {
    const [refRes, schoolRes] = await Promise.all([
      supabase.from('ref_subjects').select('id, label').order('label'),
      supabase.from('school_subjects').select('*').eq('school_id', schoolId),
    ]);
    const schoolMap: Record<string, any> = {};
    (schoolRes.data || []).forEach((s: any) => { schoolMap[s.ref_subject_id] = s; });
    const merged = (refRes.data || []).map((rs: any) => ({
      id: rs.id,
      label: rs.label,
      school_subject: schoolMap[rs.id] || null,
      custom_label: schoolMap[rs.id]?.custom_label || null,
      coefficient: schoolMap[rs.id]?.coefficient ?? 1,
    }));
    setSubjects(merged);
  };

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        try { await loadSubjects(profileData.school_id); } catch (e) { setSubjects([]); }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (!profile) return <LoadingPage />;

  const canManage = profile.role === 'school_admin';

  const openConfig = (subject: any) => {
    setConfigModal(subject);
    setForm({ custom_label: subject.custom_label || '', coefficient: String(subject.coefficient ?? 1) });
  };

  const handleSave = async () => {
    if (!profile.school_id || !configModal) return;
    setSaving(true);
    try {
      const payload = {
        school_id: profile.school_id,
        ref_subject_id: configModal.id,
        custom_label: form.custom_label || null,
        coefficient: parseFloat(form.coefficient) || 1,
      };
      if (configModal.school_subject) {
        await supabase.from('school_subjects').update({ custom_label: payload.custom_label, coefficient: payload.coefficient }).eq('id', configModal.school_subject.id);
      } else {
        await supabase.from('school_subjects').insert(payload);
      }
      await loadSubjects(profile.school_id);
      setConfigModal(null);
    } catch (e) {
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'label', label: 'Subject',
      render: (subject: any) => (
        <div>
          <p className="font-medium text-foreground">{subject.custom_label || subject.label}</p>
          {subject.custom_label && <p className="text-xs text-muted-foreground mt-0.5">{subject.label}</p>}
        </div>
      ),
    },
    {
      key: 'coefficient', label: 'Coefficient',
      render: (subject: any) => <span className="text-sm text-foreground">{subject.coefficient}</span>,
    },
    ...(canManage ? [{
      key: 'actions', label: '',
      render: (subject: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" title="Configure" onClick={(e) => { e.stopPropagation(); openConfig(subject); }}>
            <Settings size={13} />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader title="Subjects" description="View and configure school subjects" />

      <DataTable
        data={subjects}
        columns={columns}
        loading={loading}
        keyExtractor={(s) => s.id}
        emptyMessage="No subjects found"
        emptyIcon={<BookOpen size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['label', 'custom_label']}
      />

      <Modal
        open={!!configModal}
        onClose={() => setConfigModal(null)}
        title={`Configure: ${configModal?.label}`}
        description="Set school-specific label and coefficient for this subject"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfigModal(null)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Custom Label (Optional)</label>
            <input type="text" placeholder={configModal?.label} value={form.custom_label}
              onChange={(e) => setForm({ ...form, custom_label: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Coefficient</label>
            <input type="number" min="0.5" step="0.5" value={form.coefficient}
              onChange={(e) => setForm({ ...form, coefficient: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
