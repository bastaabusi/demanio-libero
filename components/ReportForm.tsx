import { useState } from 'react';
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert('La foto è troppo grande. Massimo 5MB.');
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  const deviceId = getDeviceId();
  let finalImageUrl = null;

  // 1. Notifica di caricamento opzionale (utile se l'utente carica una foto pesante)
  const loadingToast = toast.loading('Invio segnalazione in corso...');

  if (photoFile) {
    const fileExt = photoFile.name.split('.').pop();
    const fileName = `${deviceId}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('report-images').upload(fileName, photoFile);
    if (!uploadError) {
      const { data } = supabase.storage.from('report-images').getPublicUrl(fileName);
      finalImageUrl = data.publicUrl;
    }
  }

  const { error } = await supabase.from('reports').insert([{
    category, description, amount_requested: amount ? parseFloat(amount) : null,
    latitude: draftLocation.lat, longitude: draftLocation.lng,
    ip_hash: deviceId, image_url: finalImageUrl, terms_accepted: termsAccepted
  }]);

  setIsSubmitting(false);
  
  // 2. Rimuoviamo il toast di caricamento e mostriamo il risultato
  toast.dismiss(loadingToast);

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
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex justify-between">
              <span>Foto prova</span><span className="text-slate-400 font-normal">Opzionale</span>
            </label>
            {!photoPreview ? (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                <Camera size={28} className="text-slate-400 mb-2" />
                <span className="text-sm text-slate-500 font-medium">Tocca per scattare o caricare</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
              </label>
            ) : (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200">
                <img src={photoPreview} alt="Anteprima" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute top-2 right-2 p-2 bg-white/90 text-red-600 rounded-full shadow-md"><Trash2 size={18} /></button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tipo di irregolarità *</label>
            <select required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-600 outline-none">
              <option value="" disabled>Seleziona dalla lista...</option>
              <option value="pedaggio_accesso">Richiesta pedaggio per transito/accesso</option>
              <option value="cancello_chiuso">Sbarra o cancello che blocca il passaggio</option>
              <option value="omessa_ricevuta">Pagamento senza scontrino (Nero)</option>
              <option value="barriera_architettonica">Barriera per disabili in area pubblica</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Cosa è successo? *</label>
            <textarea required maxLength={250} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Es: Mi hanno chiesto 5€..." className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 h-28 resize-none focus:ring-2 focus:ring-blue-600 outline-none" />
          </div>

          {category === 'pedaggio_accesso' && (
             <div className="space-y-2">
               <label className="text-sm font-semibold text-slate-700">Importo richiesto (€)</label>
               <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-600 outline-none" />
             </div>
          )}

          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" required checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 w-5 h-5 accent-red-600" />
              <span className="text-xs text-red-900 leading-relaxed font-medium">Dichiaro che i fatti sono veri (Art. 368 CP).</span>
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white shrink-0 rounded-b-3xl">
          <button onClick={handleSubmit} disabled={isSubmitting || !category || !description || !termsAccepted} className="w-full bg-blue-600 text-white font-bold text-lg p-4 rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center gap-2">
            {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <ShieldAlert size={24} />}
            {isSubmitting ? 'Pubblicazione...' : 'Pubblica Segnalazione'}
          </button>
        </div>

      </div>
    </div>
  );
}