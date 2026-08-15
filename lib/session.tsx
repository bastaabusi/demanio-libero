import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'demanio_libero_device_id';

/**
 * Recupera l'ID del dispositivo dal localStorage.
 * Se non esiste (prima visita), ne genera uno nuovo e lo salva.
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';

  let deviceId = localStorage.getItem(SESSION_KEY);
  
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(SESSION_KEY, deviceId);
  }
  
  return deviceId;
}