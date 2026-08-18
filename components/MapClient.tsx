'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { createClient } from '@/utils/supabase/client';
import { Search, Crosshair, Check, AlertTriangle, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDeviceId } from '@/lib/session';
import { flagReportAction } from '@/app/actions/moderation';

// Importiamo il Clustering Magico!
import MarkerClusterGroup from 'react-leaflet-cluster';

// Componenti esterni
import SearchAndFilters from './SearchAndFilters';
import ReportForm from './ReportForm';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const draftIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 1.5 }); }, [center, zoom, map]);
  return null;
}

function MapClickHandler({ onLocationSelect, active }: { onLocationSelect: (lat: number, lng: number) => void, active: boolean }) {
  useMapEvents({
    click(e) { if (active) onLocationSelect(e.latlng.lat, e.latlng.lng); },
    dblclick(e) { if (!active) onLocationSelect(e.latlng.lat, e.latlng.lng); }
  });
  return null;
}

export default function MapClient() {
  const supabase = createClient();
  
  const [reports, setReports] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.9028, 12.4964]);
  const [mapZoom, setMapZoom] = useState(6);

  // FLUSSO
  const [flowState, setFlowState] = useState<'map' | 'draft' | 'form'>('map');
  const [draftLocation, setDraftLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false); // Stato per il caricamento del flag
  
  const draftMarkerRef = useRef<L.Marker>(null);

  const fetchReports = async () => {
    const { data } = await supabase.from('reports').select('*').eq('status', 'published');
    if (data) setReports(data);
  };
  
  useEffect(() => { fetchReports(); }, [supabase]);

  const filteredReports = activeCategory ? reports.filter(r => r.category === activeCategory) : reports;

  const handleGpsRequest = () => {
    setIsGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          setMapZoom(16);
          setDraftLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setFlowState('draft');
          setIsGpsLoading(false);
        },
        () => { alert("Controlla i permessi del GPS."); setIsGpsLoading(false); },
        { enableHighAccuracy: true }
      );
    }
  };

  // Funzione per gestire la segnalazione (Flag) di un abuso
  const handleFlag = async (reportId: string) => {
    setIsFlagging(true);
    const deviceId = getDeviceId();
    
    const result = await flagReportAction(reportId, deviceId);
    
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    
    setIsFlagging(false);
  };

  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = draftMarkerRef.current;
      if (marker) setDraftLocation({ lat: marker.getLatLng().lat, lng: marker.getLatLng().lng });
    },
  }), []);

  return (
    <div className="relative w-full h-full min-h-[100dvh] overflow-hidden">
      
      <div className={`absolute inset-0 transition-all duration-300 ${flowState === 'form' ? 'blur-sm scale-105' : ''}`}>
        <MapContainer center={mapCenter} zoom={mapZoom} className="w-full h-full z-0" zoomControl={false} doubleClickZoom={false}>
          <ChangeView center={mapCenter} zoom={mapZoom} />
          <ZoomControl position="bottomright" /> 
          <MapClickHandler active={flowState === 'map'} onLocationSelect={(lat, lng) => { setDraftLocation({lat, lng}); setFlowState('draft'); }} />
          
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          
          {/* GRUPPO CLUSTER: Raggruppa i marker quando si fa zoom out */}
          <MarkerClusterGroup chunkedLoading={true} maxClusterRadius={50}>
            {filteredReports.map((report) => {
              // Prendiamo la prima immagine dall'array image_urls (se esiste), altrimenti fallback su image_url
              const displayImage = (report.image_urls && report.image_urls.length > 0) 
                ? report.image_urls[0] 
                : report.image_url;

              return (
                <Marker key={report.id} position={[report.latitude, report.longitude]}>
                  <Popup className="rounded-xl overflow-hidden min-w-[200px]">
                    <div className="flex flex-col gap-2 p-1 max-w-xs">
                      {displayImage && (
                        <img src={displayImage} alt="Foto abuso" className="w-full h-32 object-cover rounded-lg border border-slate-100" />
                      )}
                      
                      <span className="text-[10px] font-bold text-white bg-blue-600 px-2 py-1 rounded-full uppercase tracking-wider self-start">
                        {report.category.replace('_', ' ')}
                      </span>
                      
                      <p className="text-sm mt-1 text-slate-800 font-medium leading-snug">
                        {report.description}
                      </p>

                      {/* BOTTONE DI FLAG / SEGNALAZIONE */}
                      <hr className="my-1 border-slate-100" />
                      <button 
                        onClick={() => handleFlag(report.id)}
                        disabled={isFlagging}
                        className="flex items-center gap-2 text-[11px] font-medium text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 pt-1"
                      >
                        <Flag size={12} />
                        {isFlagging ? 'Invio in corso...' : 'Segnala come inesatto'}
                      </button>

                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>

          {draftLocation && <Marker draggable={flowState === 'draft'} eventHandlers={eventHandlers} position={[draftLocation.lat, draftLocation.lng]} ref={draftMarkerRef} icon={draftIcon} />}
        </MapContainer>
      </div>

      {flowState === 'map' && (
        <>
          <SearchAndFilters 
            onPlaceSelect={(lat, lng) => { setMapCenter([lat, lng]); setMapZoom(13); }} 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[500] opacity-80">
            <div className="bg-slate-900/80 text-white px-5 py-3 rounded-full text-sm font-medium backdrop-blur-sm shadow-xl animate-pulse hidden md:block whitespace-nowrap">
              Tocca la mappa o usa il GPS per segnalare
            </div>
          </div>
          
          <div className="absolute bottom-6 left-0 right-0 z-[1000] p-4 pointer-events-none flex justify-center pb-safe">
            <button onClick={handleGpsRequest} disabled={isGpsLoading} className="pointer-events-auto flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:scale-105 transition-all w-full max-w-xs">
              {isGpsLoading ? <Search className="animate-spin text-blue-400" size={20} /> : <Crosshair size={20} className="text-blue-400" />}
              Usa Posizione GPS
            </button>
          </div>
        </>
      )}

      {flowState === 'draft' && (
         <div className="absolute bottom-6 left-0 right-0 z-[1000] p-4 pointer-events-none flex justify-center pb-safe">
            <div className="pointer-events-auto w-full max-w-sm flex flex-col gap-3">
              <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3 text-sm font-medium text-slate-700">
                <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                Trascina il pin rosso per aggiustare la posizione.
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setFlowState('map'); setDraftLocation(null); }} className="flex-1 bg-white text-slate-700 py-4 rounded-xl font-bold shadow-lg border border-slate-200">Annulla</button>
                <button onClick={() => setFlowState('form')} className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-xl font-bold shadow-xl"><Check size={20} /> Conferma Qui</button>
              </div>
            </div>
         </div>
      )}

      {flowState === 'form' && draftLocation && (
        <ReportForm 
          draftLocation={draftLocation} 
          onCancel={() => setFlowState('draft')} 
          onSuccess={() => { setFlowState('map'); setDraftLocation(null); fetchReports(); }} 
        />
      )}
      {flowState === 'map' && (
  <div className="absolute top-4 right-4 z-[1000] flex gap-2">
    <a href="/privacy" className="bg-white/90 backdrop-blur-sm text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm hover:bg-white transition-colors">
      Privacy
    </a>
    <a href="/tos" className="bg-white/90 backdrop-blur-sm text-slate-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm hover:bg-white transition-colors">
      Termini
    </a>
  </div>
)}
    </div>
  );
}