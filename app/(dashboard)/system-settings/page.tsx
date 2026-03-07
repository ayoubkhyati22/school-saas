'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Save, Settings, Shield, Mail } from 'lucide-react';

type Tab = 'general' | 'security' | 'email';

export default function SystemSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [generalForm, setGeneralForm] = useState({
    app_name: 'SchoolSaaS',
    support_email: 'support@schoolsaas.com',
    app_url: 'https://schoolsaas.com',
    timezone: 'UTC',
  });

  const [securityForm, setSecurityForm] = useState({
    session_timeout: '60',
    two_fa_required: false,
    max_login_attempts: '5',
    password_min_length: '8',
  });

  const [emailForm, setEmailForm] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    from_email: 'noreply@schoolsaas.com',
    from_name: 'SchoolSaaS',
  });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
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

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
    setMessage('Settings saved successfully.');
    setTimeout(() => setMessage(''), 3000);
  };

  const inputClass = "h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  const tabs = [
    { id: 'general' as Tab, label: 'General', icon: Settings },
    { id: 'security' as Tab, label: 'Security', icon: Shield },
    { id: 'email' as Tab, label: 'Email', icon: Mail },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="System Settings"
        description="Configure global platform settings"
      />

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

      <div className="max-w-lg">
        {activeTab === 'general' && (
          <div className="bg-card border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">General Settings</h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Application Name</label>
              <input
                type="text"
                value={generalForm.app_name}
                onChange={(e) => setGeneralForm({ ...generalForm, app_name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Support Email</label>
              <input
                type="email"
                value={generalForm.support_email}
                onChange={(e) => setGeneralForm({ ...generalForm, support_email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Application URL</label>
              <input
                type="url"
                value={generalForm.app_url}
                onChange={(e) => setGeneralForm({ ...generalForm, app_url: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Default Timezone</label>
              <input
                type="text"
                value={generalForm.timezone}
                onChange={(e) => setGeneralForm({ ...generalForm, timezone: e.target.value })}
                className={inputClass}
              />
            </div>
            <Button onClick={handleSave} loading={saving}>
              <Save size={14} className="mr-2" />
              Save General Settings
            </Button>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-card border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Security Settings</h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Session Timeout (minutes)</label>
              <input
                type="number"
                min="5"
                value={securityForm.session_timeout}
                onChange={(e) => setSecurityForm({ ...securityForm, session_timeout: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Max Login Attempts</label>
              <input
                type="number"
                min="1"
                value={securityForm.max_login_attempts}
                onChange={(e) => setSecurityForm({ ...securityForm, max_login_attempts: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Minimum Password Length</label>
              <input
                type="number"
                min="6"
                value={securityForm.password_min_length}
                onChange={(e) => setSecurityForm({ ...securityForm, password_min_length: e.target.value })}
                className={inputClass}
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={securityForm.two_fa_required}
                onChange={(e) => setSecurityForm({ ...securityForm, two_fa_required: e.target.checked })}
                className="w-4 h-4 border border-input"
              />
              <div>
                <span className="text-sm font-medium text-foreground">Require Two-Factor Authentication</span>
                <p className="text-xs text-muted-foreground">Force all admins to use 2FA</p>
              </div>
            </label>
            <Button onClick={handleSave} loading={saving}>
              <Save size={14} className="mr-2" />
              Save Security Settings
            </Button>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="bg-card border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Email (SMTP) Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">SMTP Host</label>
                <input
                  type="text"
                  placeholder="smtp.example.com"
                  value={emailForm.smtp_host}
                  onChange={(e) => setEmailForm({ ...emailForm, smtp_host: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">SMTP Port</label>
                <input
                  type="number"
                  value={emailForm.smtp_port}
                  onChange={(e) => setEmailForm({ ...emailForm, smtp_port: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">SMTP Username</label>
              <input
                type="text"
                placeholder="your@email.com"
                value={emailForm.smtp_user}
                onChange={(e) => setEmailForm({ ...emailForm, smtp_user: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">SMTP Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={emailForm.smtp_password}
                onChange={(e) => setEmailForm({ ...emailForm, smtp_password: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">From Email</label>
              <input
                type="email"
                value={emailForm.from_email}
                onChange={(e) => setEmailForm({ ...emailForm, from_email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">From Name</label>
              <input
                type="text"
                value={emailForm.from_name}
                onChange={(e) => setEmailForm({ ...emailForm, from_name: e.target.value })}
                className={inputClass}
              />
            </div>
            <Button onClick={handleSave} loading={saving}>
              <Save size={14} className="mr-2" />
              Save Email Settings
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
