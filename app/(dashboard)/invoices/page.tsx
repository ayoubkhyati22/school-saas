'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Wallet, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function InvoicesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.id) {
        try {
          // Get children first
          const { data: childrenData } = await supabase
            .from('profiles')
            .select('id')
            .eq('managed_by', profileData.id);

          const childIds = (childrenData || []).map((c: any) => c.id);

          // Also include self (parent might have their own invoices)
          const allIds = [...childIds, profileData.id];

          if (allIds.length > 0) {
            const { data: invoicesData } = await supabase
              .from('invoices')
              .select('*, profiles:student_id (full_name)')
              .in('student_id', allIds)
              .order('due_date', { ascending: true });
            setInvoices(invoicesData || []);
          }
        } catch (e) {
          setInvoices([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !profile) return <LoadingPage />;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const statusVariant = (status: string): 'success' | 'warning' | 'danger' => {
    if (status === 'paid') return 'success';
    if (status === 'pending') return 'warning';
    return 'danger';
  };

  const handlePay = async (invoiceId: string) => {
    try {
      await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoiceId);
      setInvoices((prev) => prev.map((inv) => inv.id === invoiceId ? { ...inv, status: 'paid' } : inv));
    } catch (e) {
      // handle error
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Invoice',
      render: (inv: any) => (
        <div>
          <p className="font-medium text-foreground">{inv.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{inv.profiles?.full_name}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (inv: any) => (
        <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(inv.amount)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (inv: any) => (
        <Badge variant={statusVariant(inv.status)}>
          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (inv: any) => <span className="text-sm text-muted-foreground">{formatDate(inv.due_date)}</span>,
    },
    {
      key: 'action',
      label: '',
      render: (inv: any) =>
        inv.status === 'pending' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handlePay(inv.id);
            }}
          >
            <CreditCard size={13} className="mr-1.5" />
            Pay
          </Button>
        ) : null,
    },
  ];

  const pendingTotal = invoices
    .filter((inv) => inv.status === 'pending')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Invoices"
        description="View and pay your school invoices"
      />

      {pendingTotal > 0 && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-amber-700 dark:text-amber-400">
              You have <strong>{formatCurrency(pendingTotal)}</strong> in pending payments.
            </span>
          </div>
        </div>
      )}

      <DataTable
        data={invoices}
        columns={columns}
        keyExtractor={(inv) => inv.id}
        emptyMessage="No invoices found"
        emptyIcon={<Wallet size={32} className="text-muted-foreground/40" />}
      />
    </DashboardLayout>
  );
}
