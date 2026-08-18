import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Demanio Libero',
  description: 'Informativa sul trattamento dei dati personali ai sensi dell\'Art. 13 del Regolamento UE 2016/679 (GDPR).',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-800 selection:bg-blue-200">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Shield size={20} className="text-blue-600" />
            <span>Privacy Policy</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12 prose prose-slate prose-a:text-blue-600 hover:prose-a:text-blue-700">
        <h1>Informativa sul Trattamento dei Dati Personali (GDPR)</h1>
        <p className="text-sm text-slate-500">Ultimo aggiornamento: 18 Agosto 2026</p>

        <p>
          La presente Informativa, resa ai sensi dell’Art. 13 del Regolamento (UE) 2016/679 (&quot;GDPR&quot;), descrive le modalità di raccolta, 
          trattamento e conservazione dei dati degli utenti della piattaforma <strong>Demanio Libero</strong>.
        </p>

        <h2>1. Titolare del Trattamento</h2>
        <p>
          Il Titolare del trattamento è il team di gestione del progetto civico <strong>Demanio Libero</strong>.<br />
          Per qualsiasi richiesta di esercizio diritti o informazione relativa ai dati personali, è possibile contattare l&apos;indirizzo email: <strong>bastaabusi@proton.me</strong>.
        </p>

        <h2>2. Tipologia di Dati Trattati e Basi Giuridiche</h2>
        <ul>
          <li>
            <strong>Dati Geografici e di Posizione:</strong> Coordinate GPS (latitudine e longitudine) selezionate o acquisite su richiesta esplicita dell&apos;utente al solo fine di collocare la segnalazione sulla mappa.<br />
            <em>Base giuridica:</em> Consenso espresso dell&apos;interessato (Art. 6, par. 1, lett. a GDPR).
          </li>
          <li>
            <strong>Dati Tecnici di Sicurezza (IP Hash e Device Identifier):</strong> Per contrastare attacchi informatici, spam e abusi della funzione di voto/segnalazione, il sistema genera un identificativo pseudonimizzato e crittografato (hash non reversibile).<br />
            <em>Base giuridica:</em> Legittimo interesse del titolare a garantire la sicurezza delle reti e dell&apos;infrastruttura (Art. 6, par. 1, lett. f GDPR).
          </li>
          <li>
            <strong>Contenuti delle Segnalazioni (Testi e Immagini):</strong> Informazioni fornite volontariamente dall&apos;utente relative a presunti ostacoli o abusi su demanio/suolo pubblico.
          </li>
        </ul>

        <h2>3. Divieto di Conferimento Dati di Terzi</h2>
        <p>
          È fatto espresso divieto agli utenti di caricare fotografie o testi contenenti <strong>dati personali identificativi di soggetti terzi</strong> (quali volti riconoscibili di persone fisiche, targhe di autoveicoli o riferimenti anagrafici espliciti). 
          Qualora tali elementi dovessero sfuggire al filtro preliminare, verranno rimossi tempestivamente previa segnalazione.
        </p>

        <h2>4. Destinatari e Trasferimento dei Dati (Fornitori Terzi)</h2>
        <p>
          I dati raccolti non sono ceduti a fini commerciali. Il funzionamento dell&apos;infrastruttura si avvale dei seguenti fornitori tecnici in qualità di Responsabili del Trattamento:
        </p>
        <ul>
          <li><strong>Supabase Inc.:</strong> Gestione del database e dello storage sicuro dei file multimediali.</li>
          <li><strong>Vercel Inc.:</strong> Hosting dell&apos;applicazione frontend e serverless compute.</li>
          <li><strong>CartoDB / OpenStreetMap:</strong> Erogazione dei livelli cartografici (Tile Layer).</li>
        </ul>

        <h2>5. Periodo di Conservazione dei Dati</h2>
        <p>
          I dati pubblicati (segnalazioni approvate) rimangono visibili sulla mappa pubblica a tempo indeterminato in funzione dell&apos;interesse civico perseguito, salvo richiesta di rettifica o cancellazione. I dati tecnici (hash di sicurezza) sono soggetti a rotazione e cancellazione periodica automatizzata.
        </p>

        <h2>6. Diritti dell&apos;Interessato (Artt. 15-22 GDPR)</h2>
        <p>
          L&apos;utente può esercitare in ogni momento il diritto di accesso, rettifica, cancellazione (diritto all&apos;oblio), limitazione del trattamento o opposizione, inviando una comunicazione a <strong>bastaabusi@proton.me</strong>. 
          L&apos;interessato ha altresì diritto di proporre reclamo all&apos;Autorità Garante per la Protezione dei Dati Personali (www.garanteprivacy.it).
        </p>

        <h2>7. Cookie e Tecnologie di Tracciamento</h2>
        <p>
          Demanio Libero <strong>non utilizza cookie di profilazione o tracciamento pubblicitario</strong>. 
          Vengono impiegati esclusivamente cookie tecnici e memorie locali (LocalStorage/SessionStorage) strettamente indispensabili per l&apos;autenticazione delle sessioni amministrative e la prevenzione del flood di segnalazioni.
        </p>
      </main>
    </div>
  );
}