import { supabase } from '@/lib/supabase/client';

export async function getTransportRoutes(schoolId: string) {
  const { data, error } = await supabase
    .from('transport_routes')
    .select('*')
    .eq('school_id', schoolId)
    .order('route_name');
  if (error) throw error;
  return data;
}

export async function createTransportRoute(routeData: {
  school_id: string;
  route_name: string;
  vehicle_info?: string;
  driver_name?: string;
  morning_departure?: string;
}) {
  const { data, error } = await supabase
    .from('transport_routes')
    .insert(routeData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTransportRoute(routeId: string, updates: Partial<{
  route_name: string;
  vehicle_info: string;
  driver_name: string;
  morning_departure: string;
}>) {
  const { data, error } = await supabase
    .from('transport_routes')
    .update(updates)
    .eq('id', routeId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
