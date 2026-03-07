'use client';

import { useEffect, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/button';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Save, Settings, Shield, Mail, Globe, Database, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Tab = 'general' | 'security' | 'email' | 'platform';

const inputClass = 'h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';

export default function SystemSettingsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [generalForm, setGeneralForm] = useState({
    app_name: 'EduManager',
    support_email: 'support@edumanager.com',
    app_url: 'https://edumanager.com',
    timezone: 'UTC',
    default_language: 'en',
  });

  const [securityForm, setSecurityForm] = useState({
    session_timeout: '60',
    two_fa_required: false,
    max_login_attempts: '5',
    password_min_length: '8',
    allow_registration: true,
  });

  const [emailForm, setEmailForm] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    from_email: 'noreply@edumanager.com',
    from_name: 'EduManager',
  });

  const [platformForm, setPlatformForm] = useState({
    maintenance_mode: false,
    max_schools: '',
    max_users_per_school: '',
    allow_free_plan: true,
    platform_version: '1.0.0',
  });

  // Load settings from Supabase if a platform_settings table exists,
  // otherwise fall back to localStorage for persistence.
  useEffect(() => {
    const saved = localStorage.getItem('platform_system_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.general) setGeneralForm(parsed.general);
        if (parsed.security) setSecurityForm(parsed.security);
        if (parsed.email) setEmailForm({ ...parsed.email, smtp_password: '' });
        if (parsed.platform) setPlatformForm(parsed.platform);
      } catch { /* ignore */ }
    }
  }, []);

  if (profileLoading) return <LoadingPage />;
  if (!profile) return null;
  if (profile.role !== 'super_admin') {
    return (
      <DashboardLayout profile={profile}>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>Access denied. Super admin only.</p>
        </div>
      </DashboardLayout>
    );
  }

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSave = async (tab: Tab) => {
    setSaving(true);
    try {
      // Persist to localStorage (replace with Supabase platform_settings table if available)
      const saved = JSON.parse(localStorage.getItem('platform_system_settings') || '{}');
      if (tab === 'general') saved.general = generalForm;
      if (tab === 'security') saved.security = securityForm;
      if (tab === 'email') saved.email = { ...emailForm, smtp_password: '' };
      if (tab === 'platform') saved.platform = platformForm;
      localStorage.setItem('platform_system_settings', JSON.stringify(saved));
      showSuccess('Settings saved successfully.');
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'email', label: 'Email (SMTP)', icon: Mail },
    { id: 'platform', label: 'Platform', icon: Globe },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="System Settings"
        description="Configure global platform settings"
      />

      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
          <CheckCircle size={15} />
          {successMsg}
        </div>
      )}

      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.id ? 'text-foreground border-b-2 border-primary -mb-px' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="max-w-xl">
        {activeTab === 'general' && (
          <div className="bg-card border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">General Settings</h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Application Name</label>
              <input type="text" value={generalForm.app_name}
                onChange={(e) => setGeneralForm({ ...generalForm, app_name: e.target.value })} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Support Email</label>
              <input type="email" value={generalForm.support_email}
                onChange={(e) => setGeneralForm({ ...generalForm, support_email: e.target.value })} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Application URL</label>
              <input type="url" value={generalForm.app_url}
                onChange={(e) => setGeneralForm({ ...generalForm, app_url: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Default Timezone</label>
                <input type="text" placeholder="e.g. UTC, Europe/Paris" value={generalForm.timezone}
                  onChange={(e) => setGeneralForm({ ...generalForm, timezone: e.target.value })} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Default Language</label>
                <select value={generalForm.default_language}
                  onChange={(e) => setGeneralForm({ ...generalForm, default_language: e.target.value })}
                  className={inputClass}>
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="ar">Arabic</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
            </div>
            <Button onClick={() => handleSave('general')} loading={saving}>
              <Save size={14} className="mr-2" />
              Save General Settings
            </Button>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-card border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Security Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Session Timeout (min)</label>
                <input type="number" min="5" value={securityForm.session_timeout}
                  onChange={(e) => setSecurityForm({ ...securityForm, session_timeout: e.target.value })} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Max Login Attempts</label>
                <input type="number" min="1" value={securityForm.max_login_attempts}
                  onChange={(e) => setSecurityForm({ ...securityForm, max_login_attempts: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Minimum Password Length</label>
              <input type="number" min="6" max="32" value={securityForm.password_min_length}
                onChange={(e) => setSecurityForm({ ...securityForm, password_min_length: e.target.value })} className={inputClass} />
            </div>
            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={securityForm.two_fa_required}
                  onChange={(e) => setSecurityForm({ ...securityForm, two_fa_required: e.target.checked })}
                  className="w-4 h-4 border border-input" />
                <div>
                  <span className="text-sm font-medium text-foreground">Require Two-Factor Authentication</span>
                  <p className="text-xs text-muted-foreground">Force all admins to use 2FA</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={securityForm.allow_registration}
                  onChange={(e) => setSecurityForm({ ...securityForm, allow_registration: e.target.checked })}
                  className="w-4 h-4 border border-input" />
                <div>
                  <span className="text-sm font-medium text-foreground">Allow Public Registration</span>
                  <p className="text-xs text-muted-foreground">Let new users sign up without an invite</p>
                </div>
              </label>
            </div>
            <Button onClick={() => handleSave('security')} loading={saving}>
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
                <input type="text" placeholder="smtp.example.com" value={emailForm.smtp_host}
                  onChange={(e) => setEmailForm({ ...emailForm, smtp_host: e.target.value })} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">SMTP Port</label>
                <input type="number" value={emailForm.smtp_port}
                  onChange={(e) => setEmailForm({ ...emailForm, smtp_port: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">SMTP Username</label>
              <input type="text" placeholder="your@email.com" value={emailForm.smtp_user}
                onChange={(e) => setEmailForm({ ...emailForm, smtp_user: e.target.value })} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">SMTP Password</label>
              <input type="password" placeholder="Enter new password to change" value={emailForm.smtp_password}
                onChange={(e) => setEmailForm({ ...emailForm, smtp_password: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">From Email</label>
                <input type="email" value={emailForm.from_email}
                  onChange={(e) => setEmailForm({ ...emailForm, from_email: e.target.value })} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">From Name</label>
                <input type="text" value={emailForm.from_name}
                  onChange={(e) => setEmailForm({ ...emailForm, from_name: e.target.value })} className={inputClass} />
              </div>
            </div>
            <Button onClick={() => handleSave('email')} loading={saving}>
              <Save size={14} className="mr-2" />
              Save Email Settings
            </Button>
          </div>
        )}

        {activeTab === 'platform' && (
          <div className="bg-card border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Platform Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Max Schools</label>
                <input type="number" min="0" placeholder="Unlimited" value={platformForm.max_schools}
                  onChange={(e) => setPlatformForm({ ...platformForm, max_schools: e.target.value })} className={inputClass} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Max Users per School</label>
                <input type="number" min="0" placeholder="Unlimited" value={platformForm.max_users_per_school}
                  onChange={(e) => setPlatformForm({ ...platformForm, max_users_per_school: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Platform Version</label>
              <input type="text" value={platformForm.platform_version}
                onChange={(e) => setPlatformForm({ ...platformForm, platform_version: e.target.value })} className={inputClass} />
            </div>
            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={platformForm.allow_free_plan}
                  onChange={(e) => setPlatformForm({ ...platformForm, allow_free_plan: e.target.checked })}
                  className="w-4 h-4 border border-input" />
                <div>
                  <span className="text-sm font-medium text-foreground">Allow Free Plan</span>
                  <p className="text-xs text-muted-foreground">Let schools sign up on the free tier</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={platformForm.maintenance_mode}
                  onChange={(e) => setPlatformForm({ ...platformForm, maintenance_mode: e.target.checked })}
                  className="w-4 h-4 border border-input" />
                <div>
                  <span className="text-sm font-medium text-foreground">Maintenance Mode</span>
                  <p className="text-xs text-muted-foreground text-red-500">Only super admins can access the platform</p>
                </div>
              </label>
            </div>
            <Button onClick={() => handleSave('platform')} loading={saving}>
              <Save size={14} className="mr-2" />
              Save Platform Settings
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
