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
import Select from '@/components/ui/Select';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, School, Pencil, Trash2, BarChart2 } from 'lucide-react';

const PLANS = [
  { value: 'free', label: 'Free ($0/mo)' },
  { value: 'basic', label: 'Basic ($29/mo)' },
  { value: 'pro', label: 'Pro ($99/mo)' },
  { value: 'enterprise', label: 'Enterprise ($299/mo)' },
];

const inputClass = 'h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';

export default function SchoolsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { schools, loading, saving, deleting, create, update, changePlan, remove } = useSchools();

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [planItem, setPlanItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', address: '', massar_id: '', subscription_plan: 'free' });
  const [selectedPlan, setSelectedPlan] = useState('');

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

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', address: '', massar_id: '', subscription_plan: 'free' });
    setShowModal(true);
  };

  const openEdit = (school: any) => {
    setEditItem(school);
    setForm({ name: school.name, address: school.address || '', massar_id: school.massar_id || '', subscription_plan: school.subscription_plan || 'free' });
    setShowModal(true);
  };

  const openPlanChange = (school: any) => {
    setPlanItem(school);
    setSelectedPlan(school.subscription_plan || 'free');
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    const payload = { name: form.name, address: form.address || undefined, massar_id: form.massar_id || undefined, subscription_plan: form.subscription_plan };
    const ok = editItem
      ? await update(editItem.id, payload)
      : await create(payload);
    if (ok) {
      setShowModal(false);
      setForm({ name: '', address: '', massar_id: '', subscription_plan: 'free' });
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    const ok = await remove(deleteItem.id);
    if (ok) setDeleteItem(null);
  };

  const handlePlanChange = async () => {
    if (!planItem) return;
    const ok = await changePlan(planItem.id, selectedPlan);
    if (ok) setPlanItem(null);
  };

  const planVariant = (plan: string): 'default' | 'info' | 'success' | 'warning' => {
    const map: any = { free: 'default', basic: 'info', pro: 'success', enterprise: 'warning' };
    return map[plan] || 'default';
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return dateStr; }
  };

  const columns = [
    {
      key: 'name', label: 'School',
      render: (school: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-muted flex items-center justify-center flex-shrink-0">
            <School size={16} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">{school.name}</p>
            {school.massar_id && <p className="text-xs text-muted-foreground font-mono">{school.massar_id}</p>}
          </div>
        </div>
      ),
    },
    { key: 'address', label: 'Address', render: (school: any) => <span className="text-sm text-muted-foreground">{school.address || '—'}</span> },
    {
      key: 'subscription_plan', label: 'Plan',
      render: (school: any) => (
        <Badge variant={planVariant(school.subscription_plan)}>
          {school.subscription_plan?.charAt(0).toUpperCase() + school.subscription_plan?.slice(1)}
        </Badge>
      ),
    },
    { key: 'created_at', label: 'Created', render: (school: any) => <span className="text-sm text-muted-foreground">{formatDate(school.created_at)}</span> },
    {
      key: 'actions', label: '',
      render: (school: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" title="Change Plan" onClick={(e) => { e.stopPropagation(); openPlanChange(school); }}>
            <BarChart2 size={13} className="text-blue-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(school); }}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteItem(school); }}>
            <Trash2 size={13} className="text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Schools"
        description="Manage all schools on the platform"
        action={
          <Button onClick={openCreate}>
            <Plus size={15} className="mr-2" />
            Add School
          </Button>
        }
      />

      <DataTable
        data={schools}
        columns={columns}
        keyExtractor={(s) => s.id}
        emptyMessage="No schools found"
        emptyIcon={<School size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['name', 'massar_id', 'address']}
        loading={loading}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit School' : 'Add School'}
        description={editItem ? 'Update school information' : 'Register a new school on the platform'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editItem ? 'Save Changes' : 'Add School'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">School Name</label>
            <input type="text" placeholder="School name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Address</label>
            <input type="text" placeholder="School address" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Massar ID</label>
            <input type="text" placeholder="Official Massar identifier" value={form.massar_id}
              onChange={(e) => setForm({ ...form, massar_id: e.target.value })} className={inputClass} />
          </div>
          <Select label="Subscription Plan" value={form.subscription_plan}
            onValueChange={(v) => setForm({ ...form, subscription_plan: v })}
            options={PLANS} />
        </div>
      </Modal>

      {/* Change Plan Modal */}
      <Modal
        open={!!planItem}
        onClose={() => setPlanItem(null)}
        title="Change Subscription Plan"
        description={`Update the plan for "${planItem?.name}"`}
        footer={
          <>
            <Button variant="outline" onClick={() => setPlanItem(null)}>Cancel</Button>
            <Button onClick={handlePlanChange} loading={saving}>Apply Plan</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {PLANS.map((plan) => (
              <button
                key={plan.value}
                onClick={() => setSelectedPlan(plan.value)}
                className={`p-3 border text-left transition-colors ${selectedPlan === plan.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              >
                <p className="text-sm font-semibold text-foreground capitalize">{plan.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{plan.label.split('(')[1]?.replace(')', '') || 'Free'}</p>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Delete School"
        description={`Delete "${deleteItem?.name}"? This action cannot be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">All users, classes, and data belonging to this school will be affected.</p>
      </Modal>
    </DashboardLayout>
  );
}
