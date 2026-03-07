'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/button';
import FileUploader from '@/components/ui/FileUploader';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Save, User, School, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Tab = 'profile' | 'school' | 'security';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSchool, setSavingSchool] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '', phone_number: '' });
  const [schoolForm, setSchoolForm] = useState({ name: '', address: '', massar_id: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData) {
        setProfileForm({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          phone_number: profileData.phone_number || '',
        });
        if (profileData.school_id) {
          const { data } = await supabase.from('schools').select('*').eq('id', profileData.school_id).single();
          setSchool(data);
          if (data) {
            setSchoolForm({ name: data.name || '', address: data.address || '', massar_id: data.massar_id || '' });
          }
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (!profile) return <LoadingPage />;


  const isAdmin = profile.role === 'school_admin';

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await supabase.from('profiles').update({
        full_name: profileForm.full_name,
        phone_number: profileForm.phone_number,
      }).eq('id', profile.id);
      setMessage('Profile updated successfully.');
    } catch (e) {
      setMessage('Failed to update profile.');
    } finally {
      setSavingProfile(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSaveSchool = async () => {
    if (!profile.school_id) return;
    setSavingSchool(true);
    try {
      await supabase.from('schools').update({
        name: schoolForm.name,
        address: schoolForm.address,
        massar_id: schoolForm.massar_id,
      }).eq('id', profile.school_id);
      setMessage('School settings updated.');
    } catch (e) {
      setMessage('Failed to update school settings.');
    } finally {
      setSavingSchool(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!profile) return;
    try {
      const path = `avatars/${profile.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('school-saas').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('school-saas').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', profile.id);
      setMessage('Avatar updated successfully.');
    } catch (e) {
      setMessage('Failed to upload avatar.');
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.new || passwordForm.new !== passwordForm.confirm) {
      setMessage('Passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
      if (error) throw error;
      setMessage('Password changed successfully.');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (e) {
      setMessage('Failed to change password.');
    } finally {
      setSavingPassword(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    ...(isAdmin ? [{ id: 'school' as Tab, label: 'School', icon: School }] : []),
    { id: 'security' as Tab, label: 'Security', icon: Lock },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader title="Settings" description="Manage your account and school settings" />

      {message && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
          {message}
        </div>
      )}

      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-foreground border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'profile' && (
        <div className="max-w-lg">
          <div className="bg-card border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Profile Information</h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <input
                type="text"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={profileForm.email}
                disabled
                className="h-9 w-full border border-input bg-muted px-3 text-sm text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <input
                type="tel"
                value={profileForm.phone_number}
                onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <FileUploader
              onFileSelect={handleAvatarUpload}
              accept="image/*"
              label="Avatar"
              description="Upload a profile picture (JPG, PNG, max 2MB)"
              maxSizeMB={2}
            />
            <Button onClick={handleSaveProfile} loading={savingProfile}>
              <Save size={14} className="mr-2" />
              Save Profile
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'school' && isAdmin && (
        <div className="max-w-lg">
          <div className="bg-card border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">School Information</h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">School Name</label>
              <input
                type="text"
                value={schoolForm.name}
                onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Address</label>
              <textarea
                rows={3}
                value={schoolForm.address}
                onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                className="w-full border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Massar ID</label>
              <input
                type="text"
                value={schoolForm.massar_id}
                onChange={(e) => setSchoolForm({ ...schoolForm, massar_id: e.target.value })}
                className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <Button onClick={handleSaveSchool} loading={savingSchool}>
              <Save size={14} className="mr-2" />
              Save School Settings
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="max-w-lg">
          <div className="bg-card border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Change Password</h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Current Password</label>
              <input
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <input
                type="password"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <Button onClick={handleChangePassword} loading={savingPassword}>
              <Lock size={14} className="mr-2" />
              Change Password
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
