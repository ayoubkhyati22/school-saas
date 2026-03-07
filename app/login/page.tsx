'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth';
import { School, Eye, EyeOff, AlertCircle, Key } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Demo credentials data
  const demoAccounts = [
    { role: 'Super Admin', email: 'admin@novaytek.com', pass: 'SuperAdmin@2025' },
    { role: 'School Admin', email: 'admin@riad-ittihad.ma', pass: 'SchoolAdmin@2025' },
    { role: 'Teacher', email: 'hassan.benali@riad-ittihad.ma', pass: 'Teacher@2025' },
    { role: 'Assistant', email: 'assistant@riad-ittihad.ma', pass: 'Assistant@2025' },
    { role: 'Parent', email: 'parent.amrani@gmail.com', pass: 'Parent@2025' },
    { role: 'Student', email: 'student01@riad-ittihad.ma', pass: 'Student@2025' },
  ];

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    // Optional: Automatically trigger handleSubmit here if you want 1-click login
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError('Invalid email or password. If you haven\'t created an account yet, go to Setup.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Please confirm your email address first. Check your inbox.');
      } else {
        setError(msg || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - Stays same */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-foreground/10 flex items-center justify-center">
            <School size={16} className="text-primary-foreground" />
          </div>
          <span className="text-primary-foreground font-bold text-lg">EduManager</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-primary-foreground leading-tight">
            Everything your school needs,<br />in one platform.
          </h2>
          <p className="text-primary-foreground/60 mt-4 text-sm leading-relaxed max-w-sm">
            Manage classes, teachers, students, homework, exams, and more. Built for modern schools.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-10">
            {[
              { label: 'Students Managed', value: '10,000+' },
              { label: 'Schools Worldwide', value: '500+' },
              { label: 'Teachers Active', value: '2,000+' },
              { label: 'Satisfaction Rate', value: '98%' },
            ].map((stat) => (
              <div key={stat.label} className="border border-primary-foreground/10 p-4">
                <p className="text-2xl font-bold text-primary-foreground">{stat.value}</p>
                <p className="text-xs text-primary-foreground/60 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-primary-foreground/40">
          © 2025 EduManager. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-primary flex items-center justify-center">
              <School size={14} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">EduManager</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Sign in to your account</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 text-destructive mb-6">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@school.com"
                className="w-full h-10 px-3 border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-10 px-3 pr-10 border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 border border-input bg-background" />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <a href="#" className="text-primary hover:underline font-medium text-xs">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* --- QUICK LOGIN SECTION --- */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <Key size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">Quick Connect (Test Period)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email, acc.pass)}
                  className="text-left px-3 py-2 border border-input hover:bg-accent hover:text-accent-foreground transition-all group"
                >
                  <p className="text-[10px] font-bold text-primary uppercase">{acc.role}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{acc.email}</p>
                </button>
              ))}
            </div>
          </div>
          {/* --------------------------- */}

          <p className="text-xs text-center text-muted-foreground mt-6">
            First time here?{' '}
            <a href="/setup" className="text-primary hover:underline font-medium">
              Create admin account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}