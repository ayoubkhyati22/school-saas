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
import { Plus, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function GlobalSubjectsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: '', description: '' });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.role === 'super_admin') {
        try {
          const { data } = await supabase.from('ref_subjects').select('*').order('label');
          setSubjects(data || []);
        } catch (e) {
          setSubjects([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !profile) return <LoadingPage />;

  if (profile.role !== 'super_admin') {
    return (
      <DashboardLayout profile={profile}>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>Access denied. Super admin only.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmit = async () => {
    if (!form.label) return;
    setSaving(true);
    try {
      await supabase.from('ref_subjects').insert({
        label: form.label,
        description: form.description || null,
      });
      const { data } = await supabase.from('ref_subjects').select('*').order('label');
      setSubjects(data || []);
      setShowModal(false);
      setForm({ label: '', description: '' });
    } catch (e) {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'label',
      label: 'Subject Name',
      render: (subject: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted flex items-center justify-center">
            <BookOpen size={14} className="text-muted-foreground" />
          </div>
          <span className="font-medium text-foreground">{subject.label}</span>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (subject: any) => (
        <span className="text-sm text-muted-foreground">{subject.description || '—'}</span>
      ),
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Global Subjects"
        description="Manage the reference subject catalog"
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={15} className="mr-2" />
            Add Subject
          </Button>
        }
      />

      <DataTable
        data={subjects}
        columns={columns}
        keyExtractor={(s) => s.id}
        emptyMessage="No subjects in the catalog"
        emptyIcon={<BookOpen size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['label']}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Subject"
        description="Add a new subject to the global catalog"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>Add Subject</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Subject Name</label>
            <input
              type="text"
              placeholder="e.g. Mathematics, French..."
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="Brief description of the subject"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
