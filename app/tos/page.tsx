import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';

export const metadata = {
  title: 'Termini e Condizioni | Demanio Libero',
  description: 'Condizioni generali d\'uso della piattaforma e clausole di manleva.',
};

export default function TosPage() {
  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-800 selection:bg-blue-200">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Scale size={20} className="text-blue-600" />
            <span>Termini e Condizioni</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12 prose prose-slate prose-a:text-blue-600 hover:prose-a:text-blue-700">
        <h1>Termini e Condizioni di Utilizzo</h1>
        <p className="text-sm text-slate-500">Ultimo aggiornamento: 18 Agosto 2026</p>

        <p>
          L&apos;accesso e l&apos;utilizzo della piattaforma <strong>Demanio Libero</strong> sono regolati dai presenti Termini di Servizio. 
          L&apos;invio di una segnalazione costituisce piena e incondizionata accettazione delle clausole che seguono.
        </p>

        <h2>1. Natura del Servizio e Assenza di Valore Ufficiale</h2>
        <p>
          Demanio Libero è un progetto indipendente di partecipazione civica e mappatura crowdsourced. 
          <strong>Non costituisce organo della Pubblica Amministrazione né forza di Polizia Giudiziaria</strong>. 
          Le segnalazioni condivise hanno valore esclusivamente informativo e documentale e <strong>non sostituiscono in alcun modo denunce, querele o esposti</strong> da presentarsi presso le Autorità competenti (Capitaneria di Porto, Guardia di Finanza, Polizia Locale, Carabinieri).
        </p>

        <h2>2. Responsabilità dell&apos;Utente e Rilevanza Penale</h2>
        <p>
          L&apos;utente è l&apos;unico ed esclusivo responsabile, in sede civile e penale, delle informazioni, testi e immagini trasmesse. L&apos;utente si impegna a fornire esclusivamente informazioni rispondenti al vero, essendo pienamente consapevole delle responsabilità previste dalla legge italiana, tra cui:
        </p>
        <ul>
          <li><strong>Art. 595 c.p. (Diffamazione):</strong> punisce chiunque offenda l&apos;altrui reputazione tramite comunicazioni o pubblicazioni;</li>
          <li><strong>Art. 368 c.p. (Calunnia):</strong> sanziona chi incolpa di un reato taluno che sa essere innocente.</li>
        </ul>

        <h2>3. Regole sui Contenuti Pubblicati</h2>
        <p>
          È severamente vietato pubblicare:
        </p>
        <ul>
          <li>Immagini che ritraggano volti riconoscibili di persone fisiche o targhe automobilistiche leggibili (senza previa opportuna censura/oscuramento da parte dell&apos;utente);</li>
          <li>Accuse ad personam non documentate, ingiurie, incitamenti all&apos;odio o minacce;</li>
          <li>Materiale coperto da diritti di proprietà intellettuale di terzi senza relativa autorizzazione;</li>
          <li>Segnalazioni fittizie, duplicate o intenzionalmente ingannevoli.</li>
        </ul>

        <h2>4. Licenza sui Contenuti</h2>
        <p>
          Con l&apos;invio del materiale (testi e immagini), l&apos;utente concede a Demanio Libero una licenza d&apos;uso gratuita, non esclusiva, perpetua e trasferibile per la pubblicazione, divulgazione, modifica tecnica e visualizzazione dei contenuti nell&apos;ambito della missione del progetto.
        </p>

        <h2>5. Qualifica di Hosting Provider e Clausola di Manleva (DSA)</h2>
        <p>
          I gestori di Demanio Libero operano come meri intermediari tecnici di memorizzazione dati (<strong>Hosting Provider</strong> ai sensi del Regolamento UE 2022/2065 - Digital Services Act).
        </p>
        <p>
          Il gestore non esercita un controllo editoriale preventivo e non assume alcuna garanzia sull&apos;accuratezza delle informazioni fornite dagli utenti. L&apos;utente si impegna a manlevare e tenere indenne il gestore della piattaforma da qualsiasi pretesa risarcitoria, spesa legale o sanzione derivante dai contenuti caricati in violazione dei presenti Termini o di norme di legge.
        </p>

        <h2>6. Procedura di Segnalazione e Rimozione (Notice & Take Down)</h2>
        <p>
          Chiunque ritenga che un contenuto pubblicato sia lesivo della propria privacy, diffamatorio, non veritiero o violi diritti di terzi, può richiederne l&apos;immediata verifica o rimozione ai sensi dell&apos;Art. 16 del Regolamento (UE) 2022/2065 (DSA):
        </p>
        <ol>
          <li>Inviando un&apos;email a <strong>bastaabusi@proton.me</strong> con oggetto <em>&quot;Segnalazione Contenuto Illecito - Notice & Take Down&quot;</em>;</li>
          <li>Indicando l&apos;ID della segnalazione (o le coordinate geografiche esatte) e la motivazione dettagliata della richiesta.</li>
        </ol>
        <p>
          Il team esaminerà la richiesta con la massima diligenza e procederà, ove fondata, all&apos;oscuramento o rimozione del contenuto.
        </p>
      </main>
    </div>
  );
}