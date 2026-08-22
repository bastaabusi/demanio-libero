import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import AdminClient from './AdminClient'; // Lo creiamo nel prossimo step!

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboard() {
  // 1. Controllo Autenticazione
  const cookieStore = await cookies();
  const supabaseUser = createClient(cookieStore);
  const { data: { user } } = await supabaseUser.auth.getUser();

  if (!user || user.email !== 'bastaabusi@proton.me') {
    redirect('/admin/login');
  }

  // 2. Fetch di tutti i report con il Service Role
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: reportsData, error } = await supabaseAdmin
    .from('reports')
    .select('*, flags:report_flags(count)')
    .order('created_at', { ascending: false });

  if (error) console.error('Errore fetch report:', error);

  // 3. Normalizziamo il conteggio dei flag
  const reports = reportsData?.map(report => ({
    ...report,
    flagCount: (Array.isArray(report.flags) && report.flags.length > 0) ? report.flags[0].count : 0
  })) || [];

  // --- SERVER ACTIONS ---
  async function updateStatus(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const action = formData.get('action') as string;
    
    const cookieStore = await cookies();
    const supabaseServer = createClient(cookieStore);
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user || user.email !== 'bastaabusi@proton.me') return;

    const supabaseAdminAction = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    if (action === 'rejected') {
      await supabaseAdminAction.from('reports').delete().eq('id', id);
    } else {
      await supabaseAdminAction.from('reports').update({ status: 'published' }).eq('id', id);
    }
      
    revalidatePath('/admin'); 
    revalidatePath('/'); 
  }

  async function signOutAction() {
    'use server';
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    await supabase.auth.signOut();
    redirect('/admin/login');
  }

  // Passiamo i dati e le funzioni all'interfaccia Client
  return (
    <AdminClient 
      initialReports={reports} 
      updateStatus={updateStatus} 
      signOutAction={signOutAction} 
    />
  );
}