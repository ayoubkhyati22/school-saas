import { supabase } from '@/lib/supabase/client';

export async function getInvoices(schoolId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, profiles:student_id(full_name, email)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getInvoicesByStudent(studentId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createInvoice(invoiceData: {
  school_id: string;
  student_id: string;
  title: string;
  amount: number;
  due_date?: string;
}) {
  const { data, error } = await supabase
    .from('invoices')
    .insert({ ...invoiceData, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', invoiceId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
