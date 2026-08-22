'use client';

import { useState, useMemo } from 'react';
import { LogOut, MapPin, CheckCircle, XCircle, Flag, LayoutList, Search, Filter, Map } from 'lucide-react';
import Link from 'next/link';

export default function AdminClient({ initialReports, updateStatus, signOutAction }: any) {
  // STATI: Ora partono allineati su 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // <-- CORRETTO QUI (parte da 'all')
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);

  const flaggedTotal = initialReports.filter((r: any) => r.flagCount > 0).length;

  // Logica di Filtraggio Istantanea
  const filteredReports = useMemo(() => {
    return initialReports.filter((report: any) => {
      // 1. Filtro testuale
      const textMatch = 
        report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id.includes(searchTerm);
      
      // 2. Filtro stato
      const statusMatch = statusFilter === 'all' || report.status === statusFilter;
      
      // 3. Filtro flaggati
      const flagMatch = showOnlyFlagged ? report.flagCount > 0 : true;

      return textMatch && statusMatch && flagMatch;
    });
  }, [initialReports, searchTerm, statusFilter, showOnlyFlagged]);

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md flex justify-between items-center">
        <h1 className="font-bold text-lg">Pannello di Controllo</h1>
        <form action={signOutAction}>
          <button type="submit" className="text-slate-300 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
            Esci <LogOut size={16} />
          </button>
        </form>
      </header>

      <main className="p-4 max-w-4xl mx-auto py-8">
        
        {/* NAVIGAZIONE TAB */}
        <div className="flex gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-xl">
          <button 
            onClick={() => { setShowOnlyFlagged(false); setStatusFilter('all'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              !showOnlyFlagged && statusFilter === 'all' 
                ? 'bg-white shadow-sm text-slate-900' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutList size={18} /> Tutti i Report ({initialReports.length})
          </button>
          
          <button 
            onClick={() => { setShowOnlyFlagged(false); setStatusFilter('pending'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              !showOnlyFlagged && statusFilter === 'pending' 
                ? 'bg-white shadow-sm text-amber-600' 
                : 'text-slate-500 hover:text-amber-600'
            }`}
          >
            ⏳ Da Approvare ({initialReports.filter((r: any) => r.status === 'pending' || !r.status).length})
          </button>

          <button 
            onClick={() => { setShowOnlyFlagged(true); setStatusFilter('all'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors relative ${
              showOnlyFlagged 
                ? 'bg-white shadow-sm text-red-600' 
                : 'text-slate-500 hover:text-red-500'
            }`}
          >
            <Flag size={18} /> Sospetti / Flaggati
            {flaggedTotal > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                {flaggedTotal}
              </span>
            )}
          </button>
        </div>

        {/* BARRA DI RICERCA E FILTRI */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-1/2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cerca parole chiave, luogo, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-slate-800"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <Filter size={16} className="text-slate-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setShowOnlyFlagged(false);
              }}
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer w-full"
            >
              <option value="all">Tutti gli stati</option>
              <option value="pending">Solo Da Approvare (Pending)</option>
              <option value="published">Solo Pubblicati (Online)</option>
              <option value="rejected">Solo Cestinati (Rifiutati)</option>
            </select>
          </div>
        </div>

        {/* LISTA DEI REPORT */}
        <div className="space-y-4">
          {filteredReports.map((report: any) => (
            <div 
              key={report.id} 
              className={`bg-white p-5 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-4 justify-between transition-colors ${
                report.flagCount > 0 ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
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
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 ml-auto animate-pulse">
                      <Flag size={12} /> {report.flagCount} {report.flagCount === 1 ? 'Segnalazione' : 'Segnalazioni'}
                    </span>
                  )}
                </div>
                
                <h3 className="font-bold text-slate-900 mt-2">
                  {report.category?.replace(/_/g, ' ').toUpperCase()}
                </h3>

                {report.location_name && (
                  <p className="text-xs font-bold text-blue-600">
                    📍 {report.location_name}
                  </p>
                )}

                <p className="text-sm text-slate-600">{report.description}</p>
                
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                  <MapPin size={12} /> Lat: {report.latitude?.toFixed(4)}, Lng: {report.longitude?.toFixed(4)}
                </div>
              </div>

              <div className="flex md:flex-col gap-2 shrink-0 md:w-40 justify-center">

                <Link 
                  href={`/?lat=${report.latitude}&lng=${report.longitude}&zoom=18`}
                  target="_blank"
                  className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 p-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Map size={16} /> Vedi Mappa
                </Link>

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
                    disabled={report.status === 'rejected'}
                    className="w-full bg-red-50 text-red-700 hover:bg-red-100 p-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle size={16} /> Elimina
                  </button>
                </form>
              </div>
            </div>
          ))}

          {filteredReports.length === 0 && (
            <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              Nessuna segnalazione trovata con questi filtri.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}