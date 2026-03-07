import { supabase } from '@/lib/supabase/client';
import { UserRole } from '@/types/database';

export async function getNotifications(schoolId: string, userRole?: UserRole, classId?: string) {
  let query = supabase
    .from('notifications')
    .select(`
      *,
      profiles:sender_id (full_name, avatar_url)
    `)
    .eq('school_id', schoolId);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  // Filter notifications based on user role and class
  return data.filter((notif: any) => {
    if (!notif.target_role && !notif.target_class_id) return true;
    if (notif.target_role && notif.target_role === userRole) return true;
    if (notif.target_class_id && notif.target_class_id === classId) return true;
    return false;
  });
}

export async function createNotification(notificationData: {
  school_id: string;
  sender_id: string;
  title: string;
  content: string;
  target_role?: UserRole;
  target_class_id?: string;
}) {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
}
