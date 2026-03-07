'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from '@/services/finance.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Wallet, TrendingUp, Clock, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Tab = 'invoices' | 'overview';

export default function FinancePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', student_id: '', due_date: '', status: 'pending' });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        try {
          const [invoicesData, studentsRes] = await Promise.all([
            getInvoices(profileData.school_id),
            supabase.from('profiles').select('id, full_name').eq('school_id', profileData.school_id).eq('role', 'student'),
          ]);
          setInvoices(invoicesData || []);
          setStudents(studentsRes.data || []);
        } catch (e) {
          setInvoices([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (!profile) return <LoadingPage />;


  const canManage = profile.role === 'school_admin';

  const totalRevenue = invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const pendingAmount = invoices.filter((inv) => inv.status === 'pending').reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', amount: '', student_id: '', due_date: '', status: 'pending' });
    setShowModal(true);
  };

  const openEdit = (inv: any) => {
    setEditItem(inv);
    setForm({
      title: inv.title, amount: String(inv.amount || ''),
      student_id: inv.student_id || '', due_date: inv.due_date?.slice(0, 10) || '',
      status: inv.status || 'pending',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!profile.school_id || !form.title || !form.amount) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateInvoice(editItem.id, { title: form.title, amount: Number(form.amount), due_date: form.due_date || undefined, status: form.status });
        const updated = await getInvoices(profile.school_id);
        setInvoices(updated || []);
      } else {
        await createInvoice({ school_id: profile.school_id, student_id: form.student_id, title: form.title, amount: Number(form.amount), due_date: form.due_date || undefined });
        const updated = await getInvoices(profile.school_id);
        setInvoices(updated || []);
      }
      setShowModal(false);
      setForm({ title: '', amount: '', student_id: '', due_date: '', status: 'pending' });
    } catch (e) {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteInvoice(deleteItem.id);
      setInvoices((prev) => prev.filter((inv) => inv.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try { return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return dateStr; }
  };
  const statusVariant = (status: string): 'success' | 'warning' | 'danger' => {
    if (status === 'paid') return 'success';
    if (status === 'pending') return 'warning';
    return 'danger';
  };

  const invoiceColumns = [
    { key: 'student', label: 'Student', render: (inv: any) => <span className="text-sm text-foreground">{inv.profiles?.full_name || '—'}</span> },
    { key: 'title', label: 'Title', render: (inv: any) => <span className="text-sm font-medium text-foreground">{inv.title}</span> },
    { key: 'amount', label: 'Amount', render: (inv: any) => <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(inv.amount)}</span> },
    {
      key: 'status', label: 'Status',
      render: (inv: any) => <Badge variant={statusVariant(inv.status)}>{inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</Badge>,
    },
    { key: 'due_date', label: 'Due Date', render: (inv: any) => <span className="text-sm text-muted-foreground">{formatDate(inv.due_date)}</span> },
    ...(canManage ? [{
      key: 'actions', label: '',
      render: (inv: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(inv); }}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteItem(inv); }}>
            <Trash2 size={13} className="text-red-500" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Finance"
        description="Manage invoices and payments"
        action={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus size={15} className="mr-2" />
              New Invoice
            </Button>
          ) : undefined
        }
      />

      <div className="flex gap-1 mb-6 border-b border-border">
        {(['overview', 'invoices'] as Tab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'text-foreground border-b-2 border-primary -mb-px' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={TrendingUp} color="green" />
          <StatCard title="Pending Amount" value={formatCurrency(pendingAmount)} icon={Clock} color="amber" />
          <StatCard title="Overdue Invoices" value={overdueCount} icon={AlertCircle} color="red" />
        </div>
      )}

      {activeTab === 'invoices' && (
        <DataTable
          data={invoices}
          columns={invoiceColumns}
          loading={loading}
          keyExtractor={(inv) => inv.id}
          emptyMessage="No invoices found"
          emptyIcon={<Wallet size={32} className="text-muted-foreground/40" />}
          searchable
          searchKeys={['title']}
        />
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Invoice' : 'New Invoice'}
        description={editItem ? 'Update invoice details' : 'Create a new invoice for a student'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editItem ? 'Save Changes' : 'Create Invoice'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Invoice Title</label>
            <input type="text" placeholder="e.g. Monthly Tuition - March" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Amount ($)</label>
            <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          {!editItem && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Student</label>
              <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Select a student...</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Due Date</label>
            <input type="date" value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          {editItem && (
            <Select label="Status" value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
              options={[{ value: 'pending', label: 'Pending' }, { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' }]} />
          )}
        </div>
      </Modal>

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Delete Invoice"
        description={`Delete invoice "${deleteItem?.title}"?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">This invoice record will be permanently removed.</p>
      </Modal>
    </DashboardLayout>
  );
}
