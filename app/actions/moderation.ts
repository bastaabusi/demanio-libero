'use server'

import { createClient } from '@supabase/supabase-js';

export async function flagReportAction(reportId: string, deviceId: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Inseriamo solo il flag
  const { error } = await supabaseAdmin
    .from('report_flags')
    .insert({ report_id: reportId, ip_hash: deviceId });

  if (error) {
    if (error.code === '23505') {
      return { success: false, message: 'Hai già segnalato questo abuso.' };
    }
    return { success: false, message: 'Errore durante la segnalazione.' };
  }

  return { success: true, message: 'Segnalazione inviata agli amministratori. Grazie!' };
}