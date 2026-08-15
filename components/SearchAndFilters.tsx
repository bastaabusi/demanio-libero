'use client';

import { useState } from 'react';
import { Search, MapPin, X, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface SearchAndFiltersProps {
  onPlaceSelect: (lat: number, lng: number) => void;
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export default function SearchAndFilters({ onPlaceSelect, activeCategory, onCategoryChange }: SearchAndFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=it&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Errore ricerca", error);
    }
  };

  const handleSelectPlace = (place: any) => {
    onPlaceSelect(parseFloat(place.lat), parseFloat(place.lon));
    setSearchResults([]);
    setSearchQuery(place.display_name.split(',')[0]);
  };

  const categories = [
    { id: null, label: 'Tutti' },
    { id: 'pedaggio_accesso', label: '💸 Pedaggi' },
    { id: 'cancello_chiuso', label: '🚧 Cancelli' },
    { id: 'barriera_architettonica', label: '♿ Barriere' }
  ];

  return (
    <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none flex flex-col gap-3">
      {/* Ricerca + Bottone Dashboard */}
      <div className="max-w-md mx-auto w-full pointer-events-auto relative flex gap-2 items-center">
        <form onSubmit={handleSearch} className="relative shadow-lg rounded-2xl overflow-hidden bg-white flex items-center border border-slate-100 flex-1">
          <Search className="absolute left-4 text-slate-400" size={20} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cerca località..." className="w-full py-4 pl-12 pr-10 outline-none text-slate-700 bg-transparent placeholder:text-slate-400 font-medium" />
          {searchQuery && (
            <button type="button" onClick={() => {setSearchQuery(''); setSearchResults([])}} className="absolute right-4 text-slate-400 hover:text-slate-700">
              <X size={20} />
            </button>
          )}
        </form>

        {/* BOTTONE DASHBOARD */}
        <Link 
          href="/dashboard" 
          className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center shrink-0"
          title="Vai alla Dashboard"
        >
          <BarChart3 size={22} className="text-slate-700" />
        </Link>

        {searchResults.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100 flex flex-col max-h-60 overflow-y-auto z-50">
            {searchResults.map((place) => (
              <button key={place.place_id} onClick={() => handleSelectPlace(place)} className="text-left px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 text-sm flex items-start gap-3 text-slate-700 transition-colors">
                <MapPin size={16} className="mt-0.5 text-blue-500 shrink-0" />
                <span className="line-clamp-2">{place.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filtri */}
      <div className="max-w-md mx-auto w-full pointer-events-auto overflow-x-auto flex gap-2 pb-2 [&::-webkit-scrollbar]:hidden">
        {categories.map((cat) => (
          <button key={cat.id || 'tutti'} onClick={() => onCategoryChange(cat.id)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold shadow-sm border transition-all ${ activeCategory === cat.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' }`}>
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}