import MapWrapper from '@/components/MapWrapper';
import Link from 'next/link';
import { AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';

export default function Home() {
  return (
    <div className="w-full h-full relative flex flex-col bg-slate-900">
      
      {/* La Mappa a tutto schermo (che sta sotto) */}
      <div className="absolute inset-0 z-0">
         <MapWrapper />
      </div>

      {/* Sfumatura in alto per far risaltare eventuali controlli mappa */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-slate-900/40 to-transparent z-10 pointer-events-none"></div>

      {/* Pannello in basso (Stile App Mobile) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          
          {/* Card Effetto Vetro */}
          <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl p-6 border border-white/50">
            
            {/* Intestazione della Card */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Mappa degli abusi
                </h2>
                <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                  <ShieldCheck size={16} className="text-green-600" />
                  Segnalazioni anonime e sicure
                </p>
              </div>
              <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <MapPin size={12} />
                Live
              </div>
            </div>

            {/* Testo descrittivo */}
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Aiutaci a mappare l'Italia. Segnala spiagge inaccessibili, pedaggi illegali o cancelli abusivi sul demanio pubblico.
            </p>

            {/* Bottone di Segnalazione Moderno */}
            <Link 
              href="/segnala" 
              className="group relative flex w-full justify-center items-center gap-3 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-1 transition-all duration-200"
            >
              {/* Effetto pulsazione dietro l'icona */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
                <AlertTriangle size={22} className="relative z-10" />
              </div>
              <span>Fai una Segnalazione</span>
            </Link>
            
          </div>
        </div>
      </div>

    </div>
  );
}