# Demanio Libero 🌊🏖️

**Demanio Libero** è una piattaforma civica mobile-first, pensata per il crowdsourcing e la mappatura di abusi e restrizioni illegali all'accesso pubblico (es. spiagge blindate, laghi inaccessibili, pedaggi illegali, cancelli abusivi e barriere architettoniche) in Italia.

Il progetto nasce con un'esperienza utente frictionless: **zero registrazioni obbligatorie** per gli utenti che segnalano, sfruttando il device fingerprinting per la gestione delle sessioni e la prevenzione dello spam.

---

## 🚀 Funzionalità Principali

* **Mappa Interattiva in Tempo Reale:** Sviluppata con Leaflet e OpenStreetMap, mostra gli abusi pubblicati sul territorio nazionale.
* **Flusso di Segnalazione "A Due Tempi":** Possibilità di rilevare la posizione tramite GPS o selezionare/trascinare un pin rosso personalizzato direttamente sulla mappa.
* **Bottom Sheet Moderno (Airbnb Style):** Un form a comparsa che gestisce categorie, descrizioni e l'importo richiesto (per i pedaggi illegali).
* **Upload Foto Prova:** Integrazione con Supabase Storage e supporto nativo all'apertura della fotocamera dello smartphone (`capture="environment"`).
* **Ricerca e Filtri Rapidi:** Ricerca di località tramite OpenStreetMap Nominatim e filtri istantanei per categoria di abuso.
* **Pannello di Amministrazione Protetto:** Area riservata (`/admin`) protetta da autenticazione Supabase per moderare (approvare o rifiutare) le segnalazioni.
* **Dashboard Pubblica di Trasparenza:** Pagina dedicata (`/dashboard`) con indicatori KPI, grafici interattivi (Recharts) sulla tipologia di abusi e feed delle ultime segnalazioni.

---

## 🛠️ Stack Tecnologico

* **Framework:** Next.js (App Router)
* **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Storage, Auth)
* **Styling:** Tailwind CSS & Lucide Icons
* **Mappe:** React-Leaflet / Leaflet / OpenStreetMap
* **Grafici:** Recharts
* **Hosting:** Vercel

---

## ⚙️ Configurazione e Avvio Locale

1. Cliona il repository:
   ```bash
   git clone [https://github.com/tuo-username/demanio-libero.git](https://github.com/tuo-username/demanio-libero.git)
   cd demanio-libero