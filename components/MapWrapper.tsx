'use client';

import dynamic from 'next/dynamic';

// Importa la mappa disabilitando il Server-Side Rendering
const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Caricamento mappa in corso...</p>
      </div>
    </div>
  )
});

export default function MapWrapper() {
  return <MapClient />;
}