import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { ShieldCheck, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import DashboardCharts from '@/components/DashboardCharts';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch data
  const { data: reports } = await supabase
    .from('reports')
    .select('category, created_at, description')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  const totalReports = reports?.length || 0;
  
  // Prepare chart data
  const categories = reports?.reduce((acc: any, r: any) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(categories || {}).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Demanio Libero</h1>
        <p className="text-slate-500 mb-8">Monitoraggio in tempo reale delle segnalazioni civiche.</p>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><ShieldCheck size={24} /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Report Pubblicati</p>
              <p className="text-2xl font-bold text-slate-900">{totalReports}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
             <div className="bg-amber-100 p-3 rounded-xl text-amber-600"><AlertTriangle size={24} /></div>
             <div>
              <p className="text-sm text-slate-500 font-medium">Abusi in corso</p>
              <p className="text-2xl font-bold text-slate-900">{totalReports > 0 ? (totalReports * 0.8).toFixed(0) : 0}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
             <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><TrendingUp size={24} /></div>
             <div>
              <p className="text-sm text-slate-500 font-medium">Copertura Territoriale</p>
              <p className="text-2xl font-bold text-slate-900">Alta</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts Section */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-6">Tipologia Abusi</h3>
            <DashboardCharts data={chartData} />
          </div>

          {/* Sidebar: Recent Activity */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Clock size={18} className="text-slate-400" /> Ultime Segnalazioni
            </h3>
            <div className="space-y-4">
              {reports?.slice(0, 5).map((r, i) => (
                <div key={i} className="border-b border-slate-50 pb-3 last:border-0">
                  <p className="text-sm font-semibold text-slate-900 capitalize">{r.category.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-500 truncate">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}