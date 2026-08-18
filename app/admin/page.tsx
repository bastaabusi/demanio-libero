import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LogOut, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Verifica se l'utente è loggato
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  // 2. Recupera TUTTE le segnalazioni (ordinandole dalle più recenti)
  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  // Funzioni per gestire lo status (Server Actions)
  async function updateStatus(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const action = formData.get('action') as string;
    
    // 1. CLIENT NORMALE: Verifichiamo che la richiesta venga davvero da te
    const cookieStore = await cookies();
    const supabaseUser = createClient(cookieStore);
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user || user.email !== 'bastaabusi@proton.me') {
      console.error("Tentativo di modifica non autorizzato!");
      return;
    }

    // 2. SUPER CLIENT: Bypassiamo l'RLS per operare sul database
    // Usiamo direttamente il pacchetto standard di Supabase con la chiave master
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    console.log(`🔧 Aggiornamento status report ${id} a ${action}...`);
    if (action === 'rejected') {
      await supabaseAdmin.from('reports').update({ status: 'rejected' }).eq('id', id);
      console.log(`✅ Report ${id} rifiutato.`);
    } else {
      await supabaseAdmin.from('reports').update({ status: 'published' }).eq('id', id);
      console.log(`✅ Report ${id} pubblicato.`);
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

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      
      {/* Header Admin */}
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md flex justify-between items-center">
        <h1 className="font-bold text-lg">Pannello di Controllo</h1>
        <form action={signOut}>
          <button type="submit" className="text-slate-300 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
            Esci <LogOut size={16} />
          </button>
        </form>
      </header>

      {/* Lista Segnalazioni */}
      <main className="p-4 max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Segnalazioni ({reports?.length || 0})</h2>
        </div>

        <div className="space-y-4">
          {reports?.map((report) => (
            <div key={report.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between">
              
              {/* Dati Report */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                    report.status === 'published' ? 'bg-green-100 text-green-700' : 
                    report.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {report.status || 'pending'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">ID: {report.id.substring(0, 8)}</span>
                </div>
                
                <h3 className="font-bold text-slate-900">{report.category.replace('_', ' ').toUpperCase()}</h3>
                <p className="text-sm text-slate-600">{report.description}</p>
                
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                  <MapPin size={12} /> Lat: {report.latitude.toFixed(4)}, Lng: {report.longitude.toFixed(4)}
                </div>
                {report.amount_requested && (
                  <div className="text-sm font-semibold text-red-600">Importo: €{report.amount_requested}</div>
                )}
                {report.image_url && (
                  <a href={report.image_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline inline-block mt-2 font-medium">
                    📸 Vedi Foto Allegata
                  </a>
                )}
              </div>

              {/* Bottoni Azione */}
              <div className="flex md:flex-col gap-2 shrink-0 md:w-40">
                <form action={updateStatus} className="flex-1">
                  <input type="hidden" name="id" value={report.id} />
                  {/* Modifica qui: name="action" */}
                  <input type="hidden" name="action" value="published" />
                  <button type="submit" disabled={report.status === 'published'} className="w-full bg-green-50 text-green-700 hover:bg-green-100 p-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    <CheckCircle size={16} /> Pubblica
                  </button>
                </form>

                <form action={updateStatus} className="flex-1">
                  <input type="hidden" name="id" value={report.id} />
                  {/* Modifica qui: name="action" */}
                  <input type="hidden" name="action" value="rejected" />
                  <button type="submit" className="w-full bg-red-50 text-red-700 hover:bg-red-100 p-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    <XCircle size={16} /> Rifiuta ed Elimina
                  </button>
                </form>
              </div>

            </div>
          ))}

          {reports?.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              Nessuna segnalazione presente nel database.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}