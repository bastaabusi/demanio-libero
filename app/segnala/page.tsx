'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getDeviceId } from '@/lib/session';

export default function SegnalaPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Legge le coordinate dall'URL (se provengono dal click sulla mappa)
  const supabase = createClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  
  // Se arriviamo dal doppio click sulla mappa, pre-compiliamo le coordinate
  const initialLat = searchParams.get('lat');
  const initialLng = searchParams.get('lng');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(
    initialLat && initialLng ? { lat: parseFloat(initialLat), lng: parseFloat(initialLng) } : null
  );

  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Se l'utente clicca il bottone dalla home, non ha coordinate e facciamo partire subito il GPS
  useEffect(() => {
    if (!coords && !gpsLoading) {
      getLocation();
    }
  }, []);

  const getLocation = () => {
    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
          setGpsLoading(false);
        },
        (error) => {
          console.error(error);
          setGpsLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setGpsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) return alert('Serve una posizione valida per la segnalazione.');
    if (!termsAccepted) return;

    setIsSubmitting(true);
    const deviceId = getDeviceId();

    const { error } = await supabase.from('reports').insert([
      {
        category,
        description,
        amount_requested: amount ? parseFloat(amount) : null,
        latitude: coords.lat,
        longitude: coords.lng,
        ip_hash: deviceId,
        terms_accepted: termsAccepted
      }
    ]);

    setIsSubmitting(false);

    if (error) {
      alert('Errore durante l\'invio. Riprova.');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col">
      {/* Header Mobile */}
      <header className="bg-white px-4 py-4 border-b border-slate-100 flex items-center sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg text-slate-900 ml-2">Dettagli Abuso</h1>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full pb-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Card Posizione */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">1. Posizione esatta</h2>
            {coords ? (
              <div className="flex items-start gap-3 text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <MapPin size={24} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-700">Posizione acquisita</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}</p>
                </div>
              </div>
            ) : (
              <button type="button" onClick={getLocation} disabled={gpsLoading} className="w-full flex justify-center items-center gap-3 bg-blue-50 text-blue-700 p-4 rounded-xl hover:bg-blue-100 transition-colors font-semibold">
                {gpsLoading ? <Loader2 className="animate-spin" size={24} /> : <MapPin size={24} />}
                {gpsLoading ? 'Ricerca satelliti...' : 'Riprova a cercare il GPS'}
              </button>
            )}
            {!initialLat && <p className="text-xs text-slate-400 mt-3">*Puoi anche tornare indietro e fare doppio-click sulla mappa per inserire il punto manualmente.</p>}
          </div>

          {/* Card Dettagli */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-5">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">2. Descrizione</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tipo di irregolarità *</label>
              <select required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all appearance-none font-medium">
                <option value="" disabled>Seleziona dalla lista...</option>
                <option value="pedaggio_accesso">Richiesta pedaggio per transito/accesso a piedi</option>
                <option value="cancello_chiuso">Sbarra o cancello che blocca il passaggio</option>
                <option value="omessa_ricevuta">Pagamento senza scontrino (Nero)</option>
                <option value="barriera_architettonica">Barriera per disabili in area pubblica</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Cosa è successo? *</label>
              <textarea required maxLength={250} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Scrivi in modo oggettivo (es. 'Mi hanno bloccato il passaggio in riva al mare...')" className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 h-32 resize-none focus:ring-2 focus:ring-slate-900 outline-none transition-all" />
              <div className="text-right text-xs text-slate-400">{description.length}/250</div>
            </div>

            {category === 'pedaggio_accesso' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-semibold text-slate-700">Importo richiesto (€)</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all" />
              </div>
            )}
          </div>

          {/* Card Legale */}
          <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
            <label className="flex items-start gap-4 cursor-pointer">
              <input type="checkbox" required checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 w-6 h-6 rounded-md accent-slate-900" />
              <span className="text-sm text-slate-800 leading-relaxed font-medium">
                Dichiaro che i fatti sono veri e mi assumo la responsabilità penale di quanto scritto (Art. 368 CP).
              </span>
            </label>
          </div>

          {/* Submit */}
          <button type="submit" disabled={isSubmitting || !coords || !termsAccepted} className="w-full bg-slate-900 text-white font-bold text-lg p-5 rounded-2xl shadow-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <ShieldAlert size={24} />}
            {isSubmitting ? 'Pubblicazione...' : 'Pubblica Segnalazione'}
          </button>
        </form>
      </main>
    </div>
  );
}