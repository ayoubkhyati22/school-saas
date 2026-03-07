'use client';

import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useSchools } from '@/hooks/useSchools';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Check, CreditCard, BarChart2, TrendingUp, School, DollarSign } from 'lucide-react';

const PLAN_PRICES: Record<string, number> = { free: 0, basic: 29, pro: 99, enterprise: 299 };

const plans = [
  {
    id: 'free', name: 'Free', price: '$0', period: '/month',
    description: 'For small schools getting started',
    features: ['Up to 50 students', '2 teachers', 'Basic homework', 'Basic exams', 'Email support'],
    variant: 'default' as const,
  },
  {
    id: 'basic', name: 'Basic', price: '$29', period: '/month',
    description: 'For growing schools',
    features: ['Up to 200 students', '10 teachers', 'Homework & exams', 'Gallery', 'Finance module', 'Priority support'],
    variant: 'info' as const,
  },
  {
    id: 'pro', name: 'Pro', price: '$99', period: '/month',
    description: 'For established schools',
    features: ['Up to 1000 students', 'Unlimited teachers', 'All modules', 'Transport management', 'Analytics', 'API access', 'Dedicated support'],
    variant: 'success' as const,
    popular: true,
  },
  {
    id: 'enterprise', name: 'Enterprise', price: '$299', period: '/month',
    description: 'For large institutions',
    features: ['Unlimited students', 'Unlimited everything', 'Custom branding', 'SLA guarantee', 'Custom integrations', 'Onboarding support', '24/7 support'],
    variant: 'warning' as const,
  },
];

export default function SubscriptionsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { schools, loading, saving, changePlan } = useSchools();

  const [planItem, setPlanItem] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState('');

  type Tab = 'overview' | 'schools';
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  if (profileLoading || !profile) return <LoadingPage />;
  if (profile.role !== 'super_admin') {
    return (
      <DashboardLayout profile={profile}>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>Access denied. Super admin only.</p>
        </div>
      </DashboardLayout>
    );
  }

  const monthlyRevenue = schools.reduce((sum, s) => sum + (PLAN_PRICES[s.subscription_plan] || 0), 0);
  const paidCount = schools.filter((s) => s.subscription_plan !== 'free').length;
  const planCounts = plans.map((p) => ({ ...p, count: schools.filter((s) => s.subscription_plan === p.id).length }));

  const planVariant = (plan: string): 'default' | 'info' | 'success' | 'warning' => {
    const map: any = { free: 'default', basic: 'info', pro: 'success', enterprise: 'warning' };
    return map[plan] || 'default';
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return dateStr; }
  };

  const handlePlanChange = async () => {
    if (!planItem) return;
    const ok = await changePlan(planItem.id, selectedPlan);
    if (ok) setPlanItem(null);
  };

  const subsColumns = [
    {
      key: 'name', label: 'School',
      render: (s: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted flex items-center justify-center flex-shrink-0">
            <School size={14} className="text-muted-foreground" />
          </div>
          <span className="font-medium text-foreground">{s.name}</span>
        </div>
      ),
    },
    {
      key: 'subscription_plan', label: 'Plan',
      render: (s: any) => (
        <Badge variant={planVariant(s.subscription_plan)}>
          {s.subscription_plan?.charAt(0).toUpperCase() + s.subscription_plan?.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'mrr', label: 'MRR',
      render: (s: any) => (
        <span className="text-sm font-semibold text-foreground tabular-nums">
          ${PLAN_PRICES[s.subscription_plan] || 0}/mo
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: () => <Badge variant="success">Active</Badge>,
    },
    { key: 'created_at', label: 'Member Since', render: (s: any) => <span className="text-sm text-muted-foreground">{formatDate(s.created_at)}</span> },
    {
      key: 'actions', label: '',
      render: (s: any) => (
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setPlanItem(s); setSelectedPlan(s.subscription_plan); }}>
          <BarChart2 size={13} className="mr-1.5" />
          Change Plan
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Subscriptions"
        description="Manage subscription plans and school memberships"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <School size={15} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Schools</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{schools.length}</p>
        </div>
        <div className="bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={15} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Paid Plans</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{paidCount}</p>
        </div>
        <div className="bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={15} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly Revenue</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">${monthlyRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={15} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Annual Revenue</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">${(monthlyRevenue * 12).toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {(['overview', 'schools'] as Tab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'text-foreground border-b-2 border-primary -mb-px' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab === 'overview' ? 'Plan Overview' : 'School Subscriptions'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {planCounts.map((plan) => (
            <div key={plan.id} className={`bg-card border p-5 relative ${plan.popular ? 'border-primary' : 'border-border'}`}>
              {plan.popular && (
                <span className="absolute top-3 right-3 text-xs bg-primary text-primary-foreground px-2 py-0.5 font-medium">Popular</span>
              )}
              <div className="mb-3 flex items-center justify-between">
                <Badge variant={plan.variant}>{plan.name}</Badge>
                <span className="text-xs font-semibold text-muted-foreground">{plan.count} school{plan.count !== 1 ? 's' : ''}</span>
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
      )}

      {activeTab === 'schools' && (
        <DataTable
          data={schools}
          columns={subsColumns}
          keyExtractor={(s) => s.id}
          emptyMessage="No schools found"
          emptyIcon={<CreditCard size={32} className="text-muted-foreground/40" />}
          searchable
          searchKeys={['name']}
          loading={loading}
        />
      )}

      {/* Change Plan Modal */}
      <Modal
        open={!!planItem}
        onClose={() => setPlanItem(null)}
        title="Change Subscription Plan"
        description={`Update plan for "${planItem?.name}"`}
        footer={
          <>
            <Button variant="outline" onClick={() => setPlanItem(null)}>Cancel</Button>
            <Button onClick={handlePlanChange} loading={saving}>Apply Plan</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`p-4 border text-left transition-colors ${selectedPlan === plan.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-foreground capitalize">{plan.id}</span>
                {selectedPlan === plan.id && <Check size={14} className="text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground">{plan.price}{plan.period}</p>
            </button>
          ))}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
