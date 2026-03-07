'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { getTransportRoutes, createTransportRoute, updateTransportRoute, deleteTransportRoute } from '@/services/transport.service';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Bus, Clock, Pencil, Trash2 } from 'lucide-react';

export default function TransportPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ route_name: '', vehicle_info: '', driver_name: '', morning_departure: '' });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);
      if (profileData?.school_id) {
        try {
          const data = await getTransportRoutes(profileData.school_id);
          setRoutes(data || []);
        } catch (e) {
          setRoutes([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (!profile) return <LoadingPage />;


  const canManage = profile.role === 'school_admin';

  const openCreate = () => {
    setEditItem(null);
    setForm({ route_name: '', vehicle_info: '', driver_name: '', morning_departure: '' });
    setShowModal(true);
  };

  const openEdit = (route: any) => {
    setEditItem(route);
    setForm({ route_name: route.route_name, vehicle_info: route.vehicle_info || '', driver_name: route.driver_name || '', morning_departure: route.morning_departure || '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!profile.school_id || !form.route_name) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateTransportRoute(editItem.id, { route_name: form.route_name, vehicle_info: form.vehicle_info || undefined, driver_name: form.driver_name || undefined, morning_departure: form.morning_departure || undefined });
        setRoutes((prev) => prev.map((r) => r.id === editItem.id ? { ...r, ...form } : r));
      } else {
        await createTransportRoute({ school_id: profile.school_id, route_name: form.route_name, vehicle_info: form.vehicle_info || undefined, driver_name: form.driver_name || undefined, morning_departure: form.morning_departure || undefined });
        const updated = await getTransportRoutes(profile.school_id);
        setRoutes(updated || []);
      }
      setShowModal(false);
      setForm({ route_name: '', vehicle_info: '', driver_name: '', morning_departure: '' });
    } catch (e) {
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await deleteTransportRoute(deleteItem.id);
      setRoutes((prev) => prev.filter((r) => r.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (e) {
    } finally {
      setDeleting(false);
    }
  };

  const inputClass = "h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  const columns = [
    {
      key: 'route_name', label: 'Route Name',
      render: (route: any) => (
        <div className="flex items-center gap-2">
          <Bus size={16} className="text-muted-foreground" />
          <span className="font-medium text-foreground">{route.route_name}</span>
        </div>
      ),
    },
    { key: 'vehicle_info', label: 'Vehicle', render: (route: any) => <span className="text-sm text-foreground">{route.vehicle_info || '—'}</span> },
    { key: 'driver_name', label: 'Driver', render: (route: any) => <span className="text-sm text-foreground">{route.driver_name || '—'}</span> },
    {
      key: 'morning_departure', label: 'Morning Departure',
      render: (route: any) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock size={13} />
          <span className="text-sm text-foreground">{route.morning_departure || '—'}</span>
        </div>
      ),
    },
    ...(canManage ? [{
      key: 'actions', label: '',
      render: (route: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(route); }}>
            <Pencil size={13} />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteItem(route); }}>
            <Trash2 size={13} className="text-red-500" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Transport"
        description="Manage school transport routes"
        action={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus size={15} className="mr-2" />
              Add Route
            </Button>
          ) : undefined
        }
      />

      <DataTable
        data={routes}
        columns={columns}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyMessage="No transport routes configured"
        emptyIcon={<Bus size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['route_name', 'driver_name']}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? 'Edit Route' : 'Add Route'}
        description={editItem ? 'Update route information' : 'Configure a new transport route'}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editItem ? 'Save Changes' : 'Add Route'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Route Name</label>
            <input type="text" placeholder="e.g. North District Route" value={form.route_name}
              onChange={(e) => setForm({ ...form, route_name: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Vehicle Info</label>
            <input type="text" placeholder="e.g. Bus #12 - ABC-1234" value={form.vehicle_info}
              onChange={(e) => setForm({ ...form, vehicle_info: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Driver Name</label>
            <input type="text" placeholder="Driver's full name" value={form.driver_name}
              onChange={(e) => setForm({ ...form, driver_name: e.target.value })} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Morning Departure Time</label>
            <input type="time" value={form.morning_departure}
              onChange={(e) => setForm({ ...form, morning_departure: e.target.value })} className={inputClass} />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Delete Route"
        description={`Delete route "${deleteItem?.route_name}"?`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            <Button onClick={handleDelete} loading={deleting} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">This route will be permanently removed.</p>
      </Modal>
    </DashboardLayout>
  );
}
