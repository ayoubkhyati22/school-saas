'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getGalleryAlbums, getAlbumPhotos, createAlbum, updateAlbum, deleteAlbum, uploadPhoto, deletePhoto, getPhotoUrl } from '@/services/gallery.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Image as ImageIcon, FolderOpen, ArrowLeft, Trash2, Pencil, Upload, X } from 'lucide-react';

export default function GalleryPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteAlbumItem, setDeleteAlbumItem] = useState<any>(null);
  const [deletePhotoItem, setDeletePhotoItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        try {
          const data = await getGalleryAlbums(profileData.school_id);
          setAlbums(data || []);
        } catch (e) {
          setAlbums([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const openAlbum = async (album: any) => {
    setSelectedAlbum(album);
    setLoadingPhotos(true);
    try {
      const data = await getAlbumPhotos(album.id);
      setPhotos(data || []);
    } catch (e) {
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  };

  if (loading || !profile) return <LoadingPage />;

  const canManage = ['school_admin', 'teacher'].includes(profile.role);

  const openCreate = () => { setEditItem(null); setTitle(''); setShowModal(true); };
  const openEdit = (album: any) => { setEditItem(album); setTitle(album.title); setShowModal(true); };

  const handleSubmit = async () => {
    if (!profile.school_id || !title) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateAlbum(editItem.id, { title });
        setAlbums((prev) => prev.map((a) => a.id === editItem.id ? { ...a, title } : a));
        if (selectedAlbum?.id === editItem.id) setSelectedAlbum((prev: any) => ({ ...prev, title }));
      } else {
        await createAlbum({ school_id: profile.school_id, title });
        const data = await getGalleryAlbums(profile.school_id);
        setAlbums(data || []);
      }
      setShowModal(false);
      setTitle('');
    } catch (e) {
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!deleteAlbumItem) return;
    setDeleting(true);
    try {
      await deleteAlbum(deleteAlbumItem.id);
      setAlbums((prev) => prev.filter((a) => a.id !== deleteAlbumItem.id));
      if (selectedAlbum?.id === deleteAlbumItem.id) setSelectedAlbum(null);
      setDeleteAlbumItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!deletePhotoItem) return;
    setDeleting(true);
    try {
      await deletePhoto(deletePhotoItem.id);
      setPhotos((prev) => prev.filter((p) => p.id !== deletePhotoItem.id));
      setDeletePhotoItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAlbum || !e.target.files?.[0]) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      await uploadPhoto(selectedAlbum.id, file);
      const data = await getAlbumPhotos(selectedAlbum.id);
      setPhotos(data || []);
    } catch (e) {
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return dateStr; }
  };

  // Album view
  if (selectedAlbum) {
    return (
      <DashboardLayout profile={profile}>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="sm" onClick={() => setSelectedAlbum(null)}>
            <ArrowLeft size={14} className="mr-1.5" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">{selectedAlbum.title}</h1>
            <p className="text-xs text-muted-foreground">{photos.length} photos</p>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
                <span className="inline-flex items-center gap-2 h-9 px-3 border border-border bg-background text-sm text-foreground hover:bg-muted transition-colors cursor-pointer">
                  {uploading ? (
                    <span className="text-xs text-muted-foreground">Uploading…</span>
                  ) : (
                    <>
                      <Upload size={14} />
                      Upload Photo
                    </>
                  )}
                </span>
              </label>
              <Button variant="outline" size="sm" onClick={() => openEdit(selectedAlbum)}>
                <Pencil size={13} className="mr-1.5" />
                Rename
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeleteAlbumItem(selectedAlbum)}>
                <Trash2 size={13} className="text-red-500 mr-1.5" />
                Delete Album
              </Button>
            </div>
          )}
        </div>

        {loadingPhotos ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">Loading photos…</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-card border border-border p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <ImageIcon size={40} className="text-muted-foreground/40" />
            <p className="text-sm">No photos in this album</p>
            {canManage && <p className="text-xs">Use the Upload Photo button to add photos</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square bg-muted overflow-hidden">
                <img
                  src={getPhotoUrl(photo.photo_url)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {canManage && (
                  <button
                    onClick={() => setDeletePhotoItem(photo)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Rename album modal */}
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Rename Album"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSubmit} loading={saving}>Save</Button>
            </>
          }
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Album Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </Modal>

        {/* Delete album confirm */}
        <Modal
          open={!!deleteAlbumItem}
          onClose={() => setDeleteAlbumItem(null)}
          title="Delete Album"
          description={`Delete album "${deleteAlbumItem?.title}"? All photos will be lost.`}
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleteAlbumItem(null)}>Cancel</Button>
              <Button onClick={handleDeleteAlbum} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
        </Modal>

        {/* Delete photo confirm */}
        <Modal
          open={!!deletePhotoItem}
          onClose={() => setDeletePhotoItem(null)}
          title="Delete Photo"
          description="Are you sure you want to delete this photo?"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeletePhotoItem(null)}>Cancel</Button>
              <Button onClick={handleDeletePhoto} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
        </Modal>
      </DashboardLayout>
    );
  }

  // Albums list view
  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Gallery"
        description="School photo albums and media"
        action={
          canManage ? (
            <Button onClick={openCreate}>
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
          {canManage && (
            <Button variant="outline" size="sm" onClick={openCreate}>Create your first album</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {albums.map((album) => (
            <div
              key={album.id}
              className="bg-card border border-border overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group relative"
              onClick={() => openAlbum(album)}
            >
              <div className="aspect-video bg-muted flex items-center justify-center group-hover:bg-muted/70 transition-colors">
                <ImageIcon size={32} className="text-muted-foreground/50" />
              </div>
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{album.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(album.created_at)}</p>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground" onClick={() => openEdit(album)}>
                      <Pencil size={12} />
                    </button>
                    <button className="p-1 hover:bg-muted text-red-400 hover:text-red-600" onClick={() => setDeleteAlbumItem(album)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create album modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Rename Album' : 'New Album'}
        description={editItem ? undefined : 'Create a new photo album'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editItem ? 'Save' : 'Create Album'}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Album Title</label>
          <input type="text" placeholder="e.g. Sports Day 2025" value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
      </Modal>

      {/* Delete album confirm */}
      <Modal
        open={!!deleteAlbumItem}
        onClose={() => setDeleteAlbumItem(null)}
        title="Delete Album"
        description={`Delete "${deleteAlbumItem?.title}"? All photos will be lost.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteAlbumItem(null)}>Cancel</Button>
            <Button onClick={handleDeleteAlbum} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
      </Modal>
    </DashboardLayout>
  );
}
