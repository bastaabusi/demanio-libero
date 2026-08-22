'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { createClient } from '@/utils/supabase/client';
import { Search, Crosshair, Check, AlertTriangle, Flag, Plus, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDeviceId } from '@/lib/session';
import { flagReportAction } from '@/app/actions/moderation';
import { useSearchParams } from 'next/navigation';
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

const previewIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
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

// Funzione per generare lo stile personalizzato del cluster
const createClusterCustomIcon = function (cluster: any) {
  const count = cluster.getChildCount();
  
  let bgColor = 'bg-blue-600/90 text-white border-2 border-white shadow-lg';

  if (count > 10 && count < 50) {
    bgColor = 'bg-indigo-600/90 text-white border-2 border-white shadow-lg';
  } else if (count >= 50) {
    bgColor = 'bg-purple-600/90 text-white border-2 border-white shadow-lg';
  }

  return L.divIcon({
    html: `<div class="flex items-center justify-center w-full h-full rounded-full font-bold text-xs ${bgColor}">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(40, 40), // <-- Usiamo iconSize di Leaflet al posto di pointSize
    iconAnchor: [20, 20]     // Centra perfettamente il cerchio rispetto alle coordinate
  });
};

function PopupTracker({ setIsPopupOpen }: { setIsPopupOpen: (isOpen: boolean) => void }) {
  useMapEvents({
    popupopen: () => setIsPopupOpen(true),
    popupclose: () => setIsPopupOpen(false),
  });
  
  // Non renderizza nulla sulla mappa, sta lì solo in ascolto invisibile
  return null; 
}

function MapController() {
  const map = useMap();
  const searchParams = useSearchParams();

  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const zoom = searchParams.get('zoom');

    if (lat && lng) {
      // Se trova le coordinate, vola lì in automatico
      map.setView(
        [parseFloat(lat), parseFloat(lng)], 
        zoom ? parseInt(zoom) : 18
      );
    }
  }, [map, searchParams]);

  return null;
}

export default function MapClient() {
  const searchParams = useSearchParams();
  const previewLat = searchParams.get('lat');
  const previewLng = searchParams.get('lng');
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
  const [isEmailing, setIsEmailing] = useState<string | null>(null);
  
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Aggiungi questo hook che ascolta la mappa
  
  
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
    const deviceId = await getDeviceId();
    
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

  // NUOVA FUNZIONE ASINCRONA
  const handleEmailAuthorities = async (report: any) => {
    setIsEmailing(report.id); // Mostriamo il caricamento

    try {
      // 1. Troviamo la città esatta dalle coordinate
      let city = "Tuo Comune";
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${report.latitude}&lon=${report.longitude}&format=json&addressdetails=1`,
          { headers: { 'Accept-Language': 'it' } }
        );
        const data = await res.json();
        if (data && data.address) {
           city = data.address.city || data.address.town || data.address.village || data.address.municipality || "Tuo Comune";
        }
      } catch (e) {
        console.error("Errore reverse geocoding", e);
      }

      // 2. Scegliamo l'Autorità e la frase da cercare su Google
      let searchTip = `"PEC Polizia Locale Comune di ${city}"`;
      
      const cat = report.category.toLowerCase();
      if (cat.includes('spiaggia') || cat.includes('lido') || cat.includes('costa') || cat.includes('mare')) {
        searchTip = `"PEC Capitaneria di Porto ${city}"`;
      } else if (cat.includes('scontrino') || cat.includes('fiscale') || cat.includes('concessione')) {
        searchTip = `"PEC Guardia di Finanza ${city}"`;
      }

      // 3. Prepariamo l'Oggetto
      const subject = encodeURIComponent(`Esposto/Segnalazione presunto illecito: ${report.category.replace('_', ' ')}`);
      
      // 4. Prepariamo il Corpo della Mail con le istruzioni guidate
      const body = encodeURIComponent(`Spett.le Comando,

con la presente desidero segnalare un presunto illecito di cui sono stato testimone.

📍 LUOGO: ${report.location_name ? report.location_name : `Coordinate GPS: ${report.latitude}, ${report.longitude}`} (${city})
📝 DESCRIZIONE: 
${report.description}

(Questa segnalazione è stata pubblicata anche sulla piattaforma civica Demanio Libero).

Resto a disposizione per eventuali chiarimenti.

Cordiali saluti,

Nome: [INSERISCI NOME E COGNOME]
Telefono: [INSERISCI IL TUO NUMERO]

----------------------------------
⚠️ COSA DEVI FARE ORA PER INVIARE LA SEGNALAZIONE:
1. Vai su Google e cerca esattamente questa frase: 
   ${searchTip}
2. Copia l'indirizzo Email o PEC che trovi sui siti istituzionali.
3. Incollalo nel campo "A:" (Destinatario) di questa email in alto.
4. Premi Invia.`);

      // 5. Apriamo l'app di posta
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      
    } finally {
      setIsEmailing(null); // Togliamo il caricamento
    }
  };

  return (
    <div className="relative w-full h-full min-h-[100dvh] overflow-hidden">
      
      <div className={`absolute inset-0 transition-all duration-300 ${flowState === 'form' ? 'blur-sm scale-105' : ''}`}>
        <MapContainer center={mapCenter} zoom={mapZoom} className="w-full h-full z-0" zoomControl={false} doubleClickZoom={false}>
          <ChangeView center={mapCenter} zoom={mapZoom} />
          <ZoomControl position="bottomright" /> 
          <MapClickHandler active={flowState === 'map'} onLocationSelect={(lat, lng) => { setDraftLocation({lat, lng}); setFlowState('draft'); }} />
          
          {/* <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          /> */}
          <PopupTracker setIsPopupOpen={setIsPopupOpen} />

          <MapController />
  

          <TileLayer
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png"
/>

          <InteractivePOIs 
  onPoiSelect={(lat, lng, name) => {
    // Quando l'utente clicca "Segnala qui" su un'attività commerciale:
    setDraftLocation({ lat, lng }); 
    setFlowState('draft');
    toast.success(`Segnalazione su: ${name}`);
    // (Nel form poi potrai recuperare questo nome se vuoi, magari salvandolo in uno State)
  }} 
/>
          
          {/* GRUPPO CLUSTER: Raggruppa i marker quando si fa zoom out */}
           <MarkerClusterGroup chunkedLoading={true} maxClusterRadius={50} iconCreateFunction={createClusterCustomIcon}>
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

                      {/* BOTTONE DI FLAG / SEGNALAZIONE
                      <hr className="my-1 border-slate-100" />
                      <button 
                        onClick={() => handleFlag(report.id)}
                        disabled={isFlagging}
                        className="flex items-center gap-2 text-[11px] font-medium text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 pt-1"
                      >
                        <Flag size={12} />
                        {isFlagging ? 'Invio in corso...' : 'Segnala come inesatto'}
                      </button> */}
                      <hr className="my-3 border-slate-100" />
<div className="flex flex-col gap-2.5 w-full">
  
  {/* Bottone 1: Aggiungi (Azione principale della community) */}
  <button 
    onClick={() => {
      setDraftLocation({ lat: report.latitude, lng: report.longitude });
      setFlowState('form');
    }}
    className="w-full px-4 flex items-center justify-center gap-2 text-sm font-bold text-blue-700 bg-blue-50 py-2 rounded-xl hover:bg-blue-100 transition-colors"
  >
    <Plus size={16} /> Aggiungi Segnalazione
  </button>

  {/* Bottone 2: Autorità (Azione esterna) */}
  <button 
    onClick={() => handleEmailAuthorities(report)}
    disabled={isEmailing === report.id}
    className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-slate-800 py-2 rounded-xl hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50"
  >
    <Mail size={16} /> 
    {isEmailing === report.id ? 'Attendi...' : 'Invia alle Autorità'}
  </button>

  {/* Bottone 3: Segnala (Discreto, in basso) */}
  <div className="flex items-center justify-between w-full mt-1">
    <button 
      onClick={() => handleFlag(report.id)}
      disabled={isFlagging}
      className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      <Flag size={12} />
      {isFlagging ? 'Invio in corso...' : 'Segnala come falso'}
    </button>
    
    {/* ID nascosto in bella vista per l'Admin */}
    <span 
      className="text-[9px] text-slate-300 font-mono cursor-text select-all" 
      title="ID Segnalazione"
    >
      #{report.id.substring(0, 8)}
    </span>
  </div>
</div>

                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>

          {previewLat && previewLng && (
    <Marker 
      position={[parseFloat(previewLat), parseFloat(previewLng)]} 
      icon={previewIcon}
      zIndexOffset={1000} // Lo tiene in primo piano sopra gli altri!
    >
      <Popup className="min-w-[150px]">
        <div className="flex flex-col gap-1 text-center py-2">
          <span className="font-bold text-orange-600 text-sm">📍 Modalità Preview</span>
          <span className="text-xs text-slate-500">Posizione della segnalazione "Da approvare"</span>
        </div>
      </Popup>
    </Marker>
  )}

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

          {!isPopupOpen && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[500] opacity-80">
            <div className="bg-slate-900/80 text-white px-5 py-3 rounded-full text-sm font-medium backdrop-blur-sm shadow-xl animate-pulse hidden md:block whitespace-nowrap">
              Tocca la mappa o usa il GPS per segnalare
            </div>
          </div>)}
          
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

function InteractivePOIs({ onPoiSelect }: { onPoiSelect: (lat: number, lng: number, name: string) => void }) {
  const map = useMap();
  const [pois, setPois] = useState<any[]>([]);

  useEffect(() => {
    const fetchLocalPOIs = async () => {
      const zoom = map.getZoom();
      // Alziamo leggermente lo zoom a 16 per evitare aree troppo vaste che farebbero esplodere l'API
      if (zoom < 16) {
        setPois([]);
        return; 
      }

      const bounds = map.getBounds();
      const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
      
      const query = `
        [out:json][timeout:5];
        (
          nwr["leisure"="beach_resort"](${bbox});
          nwr["amenity"="bar"](${bbox});
          nwr["amenity"="restaurant"](${bbox});
          nwr["natural"="beach"](${bbox});
        );
        out center 50;
      `;

      try {
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        
        // Controlliamo se la risposta è ok prima di leggerla come JSON
        if (!response.ok) {
          console.warn("Overpass API occupata o limitata.");
          return;
        }

        const textResponse = await response.text();
        
        // Verifichiamo che inizi con '{' (quindi sia davvero JSON e non una pagina HTML di errore)
        if (!textResponse.trim().startsWith('{')) {
          return;
        }

        const data = JSON.parse(textResponse);
        
        if (data && data.elements) {
          const validPois = data.elements
            .map((el: any) => ({
              id: el.id,
              name: el.tags?.name,
              category: el.tags?.amenity || el.tags?.leisure || el.tags?.natural,
              lat: el.lat || el.center?.lat,
              lon: el.lon || el.center?.lon
            }))
            .filter((poi: any) => poi.name && typeof poi.lat === 'number' && typeof poi.lon === 'number');

          setPois(validPois);
        }
      } catch (e) {
        // Ignoriamo silenziosamente l'errore di rete/parsing per non rompere l'esperienza utente
        console.warn("Impossibile caricare i POI locali in questo momento.");
      }
    };

    map.on('moveend', fetchLocalPOIs);
    fetchLocalPOIs();

    return () => { map.off('moveend', fetchLocalPOIs); };
  }, [map]);

  const poiIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [18, 30], iconAnchor: [9, 30], popupAnchor: [1, -24]
  });

  return (
    <>
      {pois.map((poi) => (
        <Marker key={poi.id} position={[poi.lat, poi.lon]} icon={poiIcon}>
          <Popup className="min-w-[150px]">
            <div className="flex flex-col gap-2">
              <span className="font-bold text-slate-800">{poi.name}</span>
              <span className="text-[10px] text-slate-500 uppercase">{poi.category}</span>
              <button 
                onClick={() => onPoiSelect(poi.lat, poi.lon, poi.name)}
                className="bg-blue-600 text-white text-xs font-bold py-1.5 rounded-lg w-full mt-1"
              >
                Segnala qui
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}