'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { School, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';

type Step = 'welcome' | 'create' | 'done';

export default function SetupPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      // 1. Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed.');

      // 2. Insert the profile as super_admin
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        username: form.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
        email: form.email,
        full_name: form.full_name,
        role: 'super_admin',
        school_id: null,
      });

      if (profileError) {
        // Profile might already exist or have a conflict
        // Try upsert
        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          username: form.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now(),
          email: form.email,
          full_name: form.full_name,
          role: 'super_admin',
          school_id: null,
        });
        if (upsertError) {
          console.warn('Profile insert warning:', upsertError.message);
        }
      }

      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-primary flex items-center justify-center">
            <School size={16} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-lg">EduManager</span>
        </div>

        {/* Step: Welcome */}
        {step === 'welcome' && (
          <div className="bg-card border border-border p-8">
            <h1 className="text-xl font-bold text-foreground">Initial Setup</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Welcome to EduManager. Since no admin account exists yet, let's create your
              <strong className="text-foreground"> Super Admin</strong> account to get started.
            </p>

            <div className="mt-6 space-y-3">
              {[
                'Create your super admin account',
                'Set up your first school',
                'Invite teachers and students',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  {item}
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('create')}
              className="mt-8 w-full flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started
              <ChevronRight size={16} />
            </button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Already have an account?{' '}
              <button onClick={handleGoToLogin} className="text-primary hover:underline font-medium">
                Sign in
              </button>
            </p>
          </div>
        )}

        {/* Step: Create Account */}
        {step === 'create' && (
          <div className="bg-card border border-border p-8">
            <h1 className="text-xl font-bold text-foreground">Create Super Admin Account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              This account will have full access to manage the entire platform.
            </p>

            {error && (
              <div className="mt-4 flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 text-destructive">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="John Smith"
                  className="w-full h-9 px-3 border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@school.com"
                  className="w-full h-9 px-3 border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="w-full h-9 px-3 border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Repeat your password"
                  className="w-full h-9 px-3 border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {loading ? 'Creating account...' : 'Create Admin Account'}
              </button>
            </form>

            <button
              onClick={() => setStep('welcome')}
              className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="bg-card border border-border p-8 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Account Created!</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Your Super Admin account has been created successfully.
              {' '}
              <strong className="text-foreground">Check your email</strong> to confirm your address
              (if email confirmation is enabled in your Supabase settings),
              then sign in to continue.
            </p>

            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-left">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                If email confirmation is required:
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                Go to <strong>Supabase Dashboard → Authentication → Providers → Email</strong> and disable
                &quot;Confirm email&quot; for development, or check your inbox for the confirmation link.
              </p>
            </div>

            <button
              onClick={handleGoToLogin}
              className="mt-6 w-full h-10 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
