'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getNotifications, createNotification, deleteNotification } from '@/services/notification.service';
import { Profile, UserRole } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { LoadingPage, LoadingContent } from '@/components/ui/LoadingSpinner';
import { Bell, Send, User, Trash2 } from 'lucide-react';

export default function NotificationsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', target_role: '' });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        try {
          const data = await getNotifications(profileData.school_id, profileData.role);
          setNotifications(data || []);
        } catch (e) {
          setNotifications([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (!profile) return <LoadingPage />;


  const canSend = ['school_admin', 'teacher'].includes(profile.role);
  const canDelete = ['school_admin'].includes(profile.role);

  const handleSend = async () => {
    if (!profile.school_id || !form.title || !form.content) return;
    setSending(true);
    try {
      await createNotification({
        school_id: profile.school_id, sender_id: profile.id,
        title: form.title, content: form.content,
        target_role: form.target_role as UserRole | undefined,
      });
      const updated = await getNotifications(profile.school_id, profile.role);
      setNotifications(updated || []);
      setForm({ title: '', content: '', target_role: '' });
    } catch (e) {
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteNotification(deleteItem.id);
      setNotifications((prev) => prev.filter((n) => n.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  const roleVariant = (role: string | null): 'info' | 'success' | 'warning' | 'default' => {
    if (!role) return 'default';
    if (role === 'student') return 'info';
    if (role === 'teacher') return 'success';
    if (role === 'parent') return 'warning';
    return 'default';
  };

  return (
    <DashboardLayout profile={profile}>
      <PageHeader title="Notifications" description="School-wide announcements and messages" />

      {loading ? <LoadingContent /> : <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {canSend && (
          <div className="lg:col-span-1">
            <div className="bg-card border border-border p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Send size={15} />
                Send Notification
              </h2>
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Title</label>
                  <input type="text" placeholder="Notification title..." value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Message</label>
                  <textarea rows={4} placeholder="Write your message..." value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    className="w-full border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
                </div>
                <Select label="Target Audience" placeholder="Everyone" value={form.target_role}
                  onValueChange={(v) => setForm({ ...form, target_role: v })}
                  options={[
                    { value: 'student', label: 'Students' },
                    { value: 'teacher', label: 'Teachers' },
                    { value: 'parent', label: 'Parents' },
                    { value: 'assistant', label: 'Assistants' },
                  ]} />
                <Button className="w-full" onClick={handleSend} loading={sending} disabled={!form.title || !form.content}>
                  <Send size={14} className="mr-2" />
                  Send Notification
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className={canSend ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {notifications.length === 0 ? (
            <div className="bg-card border border-border p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Bell size={40} className="text-muted-foreground/40" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div key={notif.id} className="bg-card border border-border p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 bg-muted flex items-center justify-center flex-shrink-0">
                      <Bell size={16} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-foreground text-sm">{notif.title}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {notif.target_role ? (
                            <Badge variant={roleVariant(notif.target_role)}>{notif.target_role}</Badge>
                          ) : (
                            <Badge variant="default">Everyone</Badge>
                          )}
                          {canDelete && (
                            <button onClick={() => setDeleteItem(notif)}
                              className="p-1 hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{notif.content}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User size={11} />
                          <span>{notif.profiles?.full_name || 'Administration'}</span>
                        </div>
                        <span>•</span>
                        <span>{formatDate(notif.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>}

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Delete Notification"
        description={`Delete notification "${deleteItem?.title}"?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">This notification will be removed for all recipients.</p>
      </Modal>
    </DashboardLayout>
  );
}
