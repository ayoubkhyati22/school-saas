'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Image as ImageIcon, FolderOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function GalleryPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    visibility: 'all',
  });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.school_id) {
        try {
          const { data } = await supabase
            .from('gallery_albums')
            .select('id, title, school_id, created_at')
            .eq('school_id', profileData.school_id)
            .order('created_at', { ascending: false });
          setAlbums(data || []);
        } catch (e) {
          setAlbums([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !profile) return <LoadingPage />;

  const canCreate = ['school_admin', 'teacher'].includes(profile.role);

  const handleSubmit = async () => {
    if (!profile.school_id || !form.title) return;
    setSaving(true);
    try {
      await supabase.from('gallery_albums').insert({
        title: form.title,
        school_id: profile.school_id,
      });
      const { data } = await supabase
        .from('gallery_albums')
        .select('id, title, school_id, created_at')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false });
      setAlbums(data || []);
      setShowModal(false);
      setForm({ title: '', visibility: 'all' });
    } catch (e) {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Gallery"
        description="School photo albums and media"
        action={
          canCreate ? (
            <Button onClick={() => setShowModal(true)}>
              <Plus size={15} className="mr-2" />
              New Album
            </Button>
          ) : undefined
        }
      />

      {albums.length === 0 ? (
        <div className="bg-card border border-border p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <FolderOpen size={40} className="text-muted-foreground/40" />
          <p className="text-sm">No albums created yet</p>
          {canCreate && (
            <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
              Create your first album
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-card border border-border overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
            >
              <div className="aspect-video bg-muted flex items-center justify-center group-hover:bg-muted/70 transition-colors">
                <ImageIcon size={32} className="text-muted-foreground/50" />
              </div>
              <div className="p-3">
                <p className="font-medium text-foreground text-sm truncate">{album.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(album.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="New Album"
        description="Create a new photo album"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>Create Album</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Album Title</label>
            <input
              type="text"
              placeholder="e.g. Sports Day 2025"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <Select
            label="Visibility"
            placeholder="Select visibility..."
            value={form.visibility}
            onValueChange={(v) => setForm({ ...form, visibility: v })}
            options={[
              { value: 'all', label: 'Everyone' },
              { value: 'class', label: 'Class only' },
            ]}
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
