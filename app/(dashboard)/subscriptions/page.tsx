'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Check, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'For small schools getting started',
    features: ['Up to 50 students', '2 teachers', 'Basic homework', 'Basic exams', 'Email support'],
    variant: 'default' as const,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$29',
    period: '/month',
    description: 'For growing schools',
    features: ['Up to 200 students', '10 teachers', 'Homework & exams', 'Gallery', 'Finance module', 'Priority support'],
    variant: 'info' as const,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99',
    period: '/month',
    description: 'For established schools',
    features: ['Up to 1000 students', 'Unlimited teachers', 'All modules', 'Transport management', 'Analytics', 'API access', 'Dedicated support'],
    variant: 'success' as const,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$299',
    period: '/month',
    description: 'For large institutions',
    features: ['Unlimited students', 'Unlimited everything', 'Custom branding', 'SLA guarantee', 'Custom integrations', 'Onboarding support', '24/7 support'],
    variant: 'warning' as const,
  },
];

export default function SubscriptionsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.role === 'super_admin') {
        try {
          const { data } = await supabase
            .from('schools')
            .select('id, name, subscription_plan, created_at')
            .order('created_at', { ascending: false });
          setSubscriptions(data || []);
        } catch (e) {
          setSubscriptions([]);
        }
      }
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

  const planVariant = (plan: string): 'default' | 'info' | 'success' | 'warning' => {
    const map: any = { free: 'default', basic: 'info', pro: 'success', enterprise: 'warning' };
    return map[plan] || 'default';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const subsColumns = [
    {
      key: 'name',
      label: 'School',
      render: (s: any) => <span className="font-medium text-foreground">{s.name}</span>,
    },
    {
      key: 'subscription_plan',
      label: 'Plan',
      render: (s: any) => (
        <Badge variant={planVariant(s.subscription_plan)}>
          {s.subscription_plan?.charAt(0).toUpperCase() + s.subscription_plan?.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: () => <Badge variant="success">Active</Badge>,
    },
    {
      key: 'created_at',
      label: 'Member Since',
      render: (s: any) => <span className="text-sm text-muted-foreground">{formatDate(s.created_at)}</span>,
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Subscriptions"
        description="Manage subscription plans and school memberships"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-card border p-5 relative ${plan.popular ? 'border-primary' : 'border-border'}`}
          >
            {plan.popular && (
              <span className="absolute top-3 right-3 text-xs bg-primary text-primary-foreground px-2 py-0.5 font-medium">
                Popular
              </span>
            )}
            <div className="mb-4">
              <Badge variant={plan.variant}>{plan.name}</Badge>
            </div>
            <div className="mb-1">
              <span className="text-2xl font-bold text-foreground tabular-nums">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
            <ul className="space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                  <Check size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-2">
        <CreditCard size={16} className="text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Active School Subscriptions</h2>
      </div>

      <DataTable
        data={subscriptions}
        columns={subsColumns}
        keyExtractor={(s) => s.id}
        emptyMessage="No subscriptions found"
        emptyIcon={<CreditCard size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['name']}
      />
    </DashboardLayout>
  );
}
