import { supabase } from '@/lib/supabase/client';

export async function getGalleryAlbums(schoolId: string) {
  const { data, error } = await supabase
    .from('gallery_albums')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAlbumPhotos(albumId: string) {
  const { data, error } = await supabase
    .from('gallery_photos')
    .select('*')
    .eq('album_id', albumId);
  if (error) throw error;
  return data;
}

export async function createAlbum(albumData: {
  school_id: string;
  title: string;
}) {
  const { data, error } = await supabase
    .from('gallery_albums')
    .insert(albumData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadPhoto(albumId: string, file: File) {
  const path = `gallery/${albumId}/${Date.now()}-${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('school-saas')
    .upload(path, file);
  if (uploadError) throw uploadError;
  const { data: photoData, error: photoError } = await supabase
    .from('gallery_photos')
    .insert({ album_id: albumId, image_url: path })
    .select()
    .single();
  if (photoError) throw photoError;
  return photoData;
}

export async function updateAlbum(albumId: string, updates: Partial<{ title: string }>) {
  const { data, error } = await supabase
    .from('gallery_albums')
    .update(updates)
    .eq('id', albumId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAlbum(albumId: string) {
  const { error } = await supabase
    .from('gallery_albums')
    .delete()
    .eq('id', albumId);
  if (error) throw error;
}

export async function deletePhoto(photoId: string) {
  const { error } = await supabase
    .from('gallery_photos')
    .delete()
    .eq('id', photoId);
  if (error) throw error;
}

export function getPhotoUrl(path: string): string {
  return supabase.storage.from('school-saas').getPublicUrl(path).data?.publicUrl || '';
}
