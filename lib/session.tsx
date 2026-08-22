import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'demanio_libero_device_id';

/**
 * Recupera l'ID del dispositivo dal localStorage.
 * Se non esiste (prima visita), ne genera uno nuovo e lo salva.
 */
// export function getDeviceId(): string {
//   if (typeof window === 'undefined') return '';

//   let deviceId = localStorage.getItem(SESSION_KEY);
  
//   if (!deviceId) {
//     deviceId = uuidv4();
//     localStorage.setItem(SESSION_KEY, deviceId);
//   }
  
//   return deviceId;
// }

import fpPromise from '@fingerprintjs/fingerprintjs';

export async function getDeviceId(): Promise<string> {
  // Evitiamo crash lato server in Next.js
  if (typeof window === 'undefined') {
    return 'server_render';
  }

  try {
    // Carichiamo l'agente di FingerprintJS
    const fp = await fpPromise.load();
    // Calcoliamo l'impronta digitale
    const result = await fp.get();
    
    // Restituisce l'ID univoco (es. "a1b2c3d4e5f6g7h8")
    return result.visitorId; 
  } catch (error) {
    console.error("Errore FingerprintJS:", error);
    // Fallback se l'utente usa browser ultra-restrittivi (es. Tor)
    return 'fallback_' + Math.random().toString(36).substring(2, 15);
  }
}