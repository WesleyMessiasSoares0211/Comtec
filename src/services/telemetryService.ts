import { supabase } from '../lib/supabase';

export type TelemetryAction = 
  | 'view_portal' 
  | 'download_official_pdf' 
  | 'open_single_spec' 
  | 'open_multiple_specs' 
  | 'download_zip_specs';

export const logQuoteInteraction = async (
  quoteId: string, 
  actionType: TelemetryAction, 
  clientEmail?: string | null,
  extraMetadata?: Record<string, any>
): Promise<void> => {
  try {
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Desconocido';

    const { error } = await supabase.from('quote_telemetry').insert({
      quote_id: quoteId,
      action_type: actionType,
      client_email: clientEmail || 'desconocido',
      user_agent: userAgent,
      metadata: extraMetadata || {}
    });

    if (error) {
      console.warn('[Telemetría] Error al registrar evento en Supabase:', error.message);
    }
  } catch (err) {
    console.warn('[Telemetría] Error interno en el servicio:', err);
  }
};