import { useState, useRef } from 'react';
import { X, Camera, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getDeviceId } from '@/lib/session';
import toast from 'react-hot-toast';
interface ReportFormProps {
  draftLocation: { lat: number, lng: number };
  onCancel: () => void;
  onSuccess: () => void;
}

export default function ReportForm({ draftLocation, onCancel, onSuccess }: ReportFormProps) {
  const supabase = createClient();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Stati aggiornati per gestire immagini multiple
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const termsCheckboxRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    // Convertiamo i file selezionati in un array
    const filesArray = Array.from(e.target.files);
    
    // Filtriamo i file troppo pesanti
    const validFiles = filesArray.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Il file ${file.name} supera i 5MB consentiti.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setPhotoFiles(prev => [...prev, ...validFiles]);
      
      // Creiamo gli URL per le anteprime
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const clearPhotos = () => {
    setPhotoFiles([]);
    setPhotoPreviews([]);
  };

  const removePhoto = (indexToRemove: number) => {
    // Filtra gli array mantenendo solo gli elementi che NON hanno quell'indice
    setPhotoFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setPhotoPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Controllo di sicurezza aggiuntivo per il checkbox
    if (!termsAccepted) {
      toast.error('Devi accettare i termini per procedere.');
      termsCheckboxRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    const deviceId = getDeviceId();

    
    
    // Inizializziamo un singolo toast per aggiornarlo in tempo reale
    const loadingToastId = toast.loading('Invio segnalazione in corso...');
    let finalImageUrls: string[] = [];

    if (photoFiles.length > 0) {
      // Aggiorniamo il messaggio del toast esistente
      toast.loading('Caricamento foto in corso...', { id: loadingToastId });
      
      const uploadPromises = photoFiles.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${deviceId}-${Date.now()}-${index}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('report-images').upload(fileName, file);
        
        if (!uploadError) {
          const { data } = supabase.storage.from('report-images').getPublicUrl(fileName);
          return data.publicUrl;
        }
        return null;
      });

      const results = await Promise.all(uploadPromises);
      finalImageUrls = results.filter(url => url !== null) as string[];
    }

    // Aggiorniamo il toast per la fase di scrittura a database
    toast.loading('Salvataggio nel database...', { id: loadingToastId });

    const { error } = await supabase.from('reports').insert([{
      category, 
      description, 
      amount_requested: amount ? parseFloat(amount) : null,
      latitude: draftLocation.lat, 
      longitude: draftLocation.lng,
      ip_hash: deviceId, 
      image_url: finalImageUrls.length > 0 ? finalImageUrls[0] : null, // Manteniamo la compatibilità col vecchio schema
      image_urls: finalImageUrls, // Nuova colonna array
      terms_accepted: termsAccepted
    }]);

    setIsSubmitting(false);
    toast.dismiss(loadingToastId); // Chiudiamo il toast

    if (error) {
      console.error(error);
      toast.error("Errore durante l'invio. Riprova.");
    } else {
      toast.success('Segnalazione inviata con successo! In attesa di moderazione.');
      onSuccess();
    }
  };

  return (
    <div className="absolute inset-0 z-[2000] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-lg text-slate-900">Dettagli Abuso</h2>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full"><X size={20} /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-6 pb-24">
          
          {/* SEZIONE FOTO */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex justify-between">
              <span>Foto prova</span><span className="text-slate-400 font-normal">Opzionale</span>
            </label>
            
            {photoPreviews.length === 0 ? (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                <Camera size={28} className="text-slate-400 mb-2" />
                <span className="text-sm text-slate-500 font-medium">Tocca per scattare o caricare</span>
                {/* Ricorda: senza capture="environment" */}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden border border-slate-200 snap-center">
                      <img src={preview} alt={`Anteprima ${index + 1}`} className="w-full h-full object-cover" />
                      
                      {/* NUOVO: Bottone per rimuovere la singola foto */}
                      <button 
                        type="button" 
                        onClick={() => removePhoto(index)} 
                        className="absolute top-1 right-1 p-1.5 bg-white/90 backdrop-blur-sm text-red-600 rounded-full shadow-sm hover:bg-white hover:text-red-700 transition-colors"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  
                  {/* Bottone per aggiungere ALTRE foto */}
                  <label className="flex flex-col items-center justify-center w-28 h-28 shrink-0 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors snap-center">
                    <Camera size={20} className="text-slate-400 mb-1" />
                    <span className="text-xs text-slate-500 font-medium text-center leading-tight">Aggiungi<br/>altra</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
                  </label>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{photoFiles.length} foto selezionate</span>
                  <button type="button" onClick={clearPhotos} className="text-sm text-red-600 font-medium flex items-center gap-1 hover:text-red-700">
                    <Trash2 size={16} /> Rimuovi tutte
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tipo di irregolarità *</label>
            <select required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-600 outline-none">
              <option value="" className="text-slate-900" disabled>Seleziona dalla lista...</option>
              <option value="pedaggio_accesso" className="text-slate-900">Richiesta pedaggio per transito/accesso</option>
              <option value="cancello_chiuso" className="text-slate-900">Sbarra o cancello che blocca il passaggio</option>
              <option value="omessa_ricevuta" className="text-slate-900" >Pagamento senza scontrino (Nero)</option>
              <option value="barriera_architettonica" className="text-slate-900">Barriera per disabili in area pubblica</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Cosa è successo? *</label>
            <textarea required maxLength={250} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Es: Mi hanno chiesto 5€..." className="w-full p-4 rounded-xl border border-slate-200 text-slate-900 bg-slate-50 h-28 resize-none focus:ring-2 focus:ring-blue-600 outline-none" />
          </div>

          {category === 'pedaggio_accesso' && (
             <div className="space-y-2">
               <label className="text-sm font-semibold text-slate-700">Importo richiesto (€)</label>
               <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full text-slate-900 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-600 outline-none" />
             </div>
          )}

          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
  <label className="flex items-center gap-3 cursor-pointer">
    <input 
      type="checkbox" 
      required 
      checked={termsAccepted} 
      ref={termsCheckboxRef}
      onChange={(e) => setTermsAccepted(e.target.checked)} 
      className="w-5 h-5 accent-red-600 shrink-0" 
    />
    <span className="text-xs text-red-900 leading-relaxed font-medium">
      Dichiaro che i fatti sono veri (Art. 368 CP).
    </span>
  </label>
</div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white shrink-0 rounded-b-3xl">
          <button onClick={handleSubmit} disabled={isSubmitting || !category || !description || !termsAccepted} className="w-full bg-blue-600 text-white font-bold text-lg p-4 rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center gap-2 transition-colors">
            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <ShieldAlert size={24} />}
            {isSubmitting ? 'Pubblicazione...' : 'Pubblica Segnalazione'}
          </button>
        </div>

      </div>
    </div>
  );
}