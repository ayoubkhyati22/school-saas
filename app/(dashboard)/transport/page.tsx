'use client';

import { useEffect, useState } from 'react';
import { getCurrentProfile } from '@/lib/auth';
import { Profile } from '@/types/database';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { Plus, Bus, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function TransportPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    route_name: '',
    vehicle_info: '',
    driver_name: '',
    morning_departure: '',
  });

  useEffect(() => {
    async function loadData() {
      const profileData = await getCurrentProfile();
      setProfile(profileData);

      if (profileData?.school_id) {
        try {
          const { data } = await supabase
            .from('transport_routes')
            .select('*')
            .eq('school_id', profileData.school_id)
            .order('route_name');
          setRoutes(data || []);
        } catch (e) {
          setRoutes([]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading || !profile) return <LoadingPage />;

  const canCreate = profile.role === 'school_admin';

  const handleSubmit = async () => {
    if (!profile.school_id || !form.route_name) return;
    setSaving(true);
    try {
      await supabase.from('transport_routes').insert({
        school_id: profile.school_id,
        route_name: form.route_name,
        vehicle_info: form.vehicle_info || null,
        driver_name: form.driver_name || null,
        morning_departure: form.morning_departure || null,
      });
      const { data } = await supabase
        .from('transport_routes')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('route_name');
      setRoutes(data || []);
      setShowModal(false);
      setForm({ route_name: '', vehicle_info: '', driver_name: '', morning_departure: '' });
    } catch (e) {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'route_name',
      label: 'Route Name',
      render: (route: any) => (
        <div className="flex items-center gap-2">
          <Bus size={16} className="text-muted-foreground" />
          <span className="font-medium text-foreground">{route.route_name}</span>
        </div>
      ),
    },
    {
      key: 'vehicle_info',
      label: 'Vehicle',
      render: (route: any) => (
        <span className="text-sm text-foreground">{route.vehicle_info || '—'}</span>
      ),
    },
    {
      key: 'driver_name',
      label: 'Driver',
      render: (route: any) => (
        <span className="text-sm text-foreground">{route.driver_name || '—'}</span>
      ),
    },
    {
      key: 'morning_departure',
      label: 'Morning Departure',
      render: (route: any) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock size={13} />
          <span className="text-sm text-foreground">{route.morning_departure || '—'}</span>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout profile={profile}>
      <PageHeader
        title="Transport"
        description="Manage school transport routes"
        action={
          canCreate ? (
            <Button onClick={() => setShowModal(true)}>
              <Plus size={15} className="mr-2" />
              Add Route
            </Button>
          ) : undefined
        }
      />

      <DataTable
        data={routes}
        columns={columns}
        keyExtractor={(r) => r.id}
        emptyMessage="No transport routes configured"
        emptyIcon={<Bus size={32} className="text-muted-foreground/40" />}
        searchable
        searchKeys={['route_name', 'driver_name']}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Route"
        description="Configure a new transport route"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>Add Route</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Route Name</label>
            <input
              type="text"
              placeholder="e.g. North District Route"
              value={form.route_name}
              onChange={(e) => setForm({ ...form, route_name: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Vehicle Info</label>
            <input
              type="text"
              placeholder="e.g. Bus #12 - ABC-1234"
              value={form.vehicle_info}
              onChange={(e) => setForm({ ...form, vehicle_info: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Driver Name</label>
            <input
              type="text"
              placeholder="Driver's full name"
              value={form.driver_name}
              onChange={(e) => setForm({ ...form, driver_name: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Morning Departure Time</label>
            <input
              type="time"
              value={form.morning_departure}
              onChange={(e) => setForm({ ...form, morning_departure: e.target.value })}
              className="h-9 w-full border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
