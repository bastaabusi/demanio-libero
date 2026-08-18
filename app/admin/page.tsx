import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, MapPin, CheckCircle, XCircle, Flag, LayoutList } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Forza Next.js a non memorizzare in cache questa pagina
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboard({ 
  searchParams 
}: { 
  searchParams: Promise<{ view?: string }> 
}) {
  const resolvedParams = await searchParams;
  const view = resolvedParams?.view || 'all';

  // 1. Controllo di autenticazione dell'utente
  const cookieStore = await cookies();
  const supabaseUser = createClient(cookieStore);
  const { data: { user } } = await supabaseUser.auth.getUser();

  if (!user || user.email !== 'bastaabusi@proton.me') {
    redirect('/admin/login');
  }

  // 2. Client Amministrativo (Service Role) per leggere TUTTI i dati
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. Query con conteggio dei flag
  const { data: reportsData, error } = await supabaseAdmin
    .from('reports')
    .select(`
      *,
      flags:report_flags(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Errore nel recupero dei report:', error);
  }

  // 4. Normalizzazione dati
  const reports = reportsData?.map(report => {
    let count = 0;
    if (Array.isArray(report.flags) && report.flags.length > 0) {
      count = report.flags[0].count || 0;
    }
    return {
      ...report,
      flagCount: count
    };
  }) || [];

  // 5. Filtro per la vista selezionata
  let displayReports = reports;
  if (view === 'flagged') {
    displayReports = reports
      .filter(r => r.flagCount > 0)
      .sort((a, b) => b.flagCount - a.flagCount);
  }

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

  async function signOut() {
    'use server';
    const cookieStore = await cookies();
    const supabaseServer = createClient(cookieStore);
    await supabaseServer.auth.signOut();
    redirect('/admin/login');
  }

  const flaggedTotal = reports.filter(r => r.flagCount > 0).length;

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md flex justify-between items-center">
        <h1 className="font-bold text-lg">Pannello di Controllo</h1>
        <form action={signOut}>
          <button type="submit" className="text-slate-300 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
            Esci <LogOut size={16} />
          </button>
        </form>
      </header>

      <main className="p-4 max-w-4xl mx-auto py-8">
        
        {/* Navigazione Tab */}
        <div className="flex gap-2 mb-8 bg-slate-200/50 p-1.5 rounded-xl">
          <Link 
            href="/admin" 
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              view === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutList size={18} /> Tutti i Report ({reports.length})
          </Link>
          <Link 
            href="/admin?view=flagged" 
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors relative ${
              view === 'flagged' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500 hover:text-red-500'
            }`}
          >
            <Flag size={18} /> Sospetti / Flaggati
            {flaggedTotal > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                {flaggedTotal}
              </span>
            )}
          </Link>
        </div>

        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {view === 'flagged' ? 'Coda di Moderazione' : 'Tutte le Segnalazioni'} ({displayReports.length})
          </h2>
        </div>

        <div className="space-y-4">
          {displayReports.map((report) => (
            <div 
              key={report.id} 
              className={`bg-white p-5 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-4 justify-between transition-colors ${
                report.flagCount > 0 ? 'border-red-200' : 'border-slate-200'
              }`}
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                    report.status === 'published' ? 'bg-green-100 text-green-700' : 
                    report.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {report.status || 'pending'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">ID: {report.id.substring(0, 8)}</span>
                  
                  {report.flagCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 ml-auto">
                      <Flag size={12} /> {report.flagCount} {report.flagCount === 1 ? 'Segnalazione' : 'Segnalazioni'}
                    </span>
                  )}
                </div>
                
                <h3 className="font-bold text-slate-900 mt-2">
                  {report.category?.replace(/_/g, ' ').toUpperCase()}
                </h3>
                <p className="text-sm text-slate-600">{report.description}</p>
                
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                  <MapPin size={12} /> Lat: {report.latitude?.toFixed(4)}, Lng: {report.longitude?.toFixed(4)}
                </div>
              </div>

              <div className="flex md:flex-col gap-2 shrink-0 md:w-40 justify-center">
                <form action={updateStatus} className="flex-1">
                  <input type="hidden" name="id" value={report.id} />
                  <input type="hidden" name="action" value="published" />
                  <button 
                    type="submit" 
                    disabled={report.status === 'published'} 
                    className="w-full bg-green-50 text-green-700 hover:bg-green-100 p-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle size={16} /> Approva
                  </button>
                </form>

                <form action={updateStatus} className="flex-1">
                  <input type="hidden" name="id" value={report.id} />
                  <input type="hidden" name="action" value="rejected" />
                  <button 
                    type="submit" 
                    className="w-full bg-red-50 text-red-700 hover:bg-red-100 p-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} /> Elimina
                  </button>
                </form>
              </div>
            </div>
          ))}

          {displayReports.length === 0 && (
            <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              {view === 'flagged' 
                ? 'Nessun report segnalato dagli utenti.' 
                : 'Nessuna segnalazione presente nel database.'}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}