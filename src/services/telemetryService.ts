import { supabase } from '../lib/supabase';

// Tipagem rigorosa para garantir que apenas as ações definidas sejam registadas
export type TelemetryAction = 
  | 'view_portal' 
  | 'download_official_pdf' 
  | 'open_single_spec' 
  | 'open_multiple_specs' 
  | 'download_zip_specs';

/**
 * Regista de forma assíncrona uma interação do utilizador com um documento de cotação.
 * Esta função foi concebida para falhar silenciosamente e não interromper a experiência do cliente.
 * * @param quoteId O ID (UUID) da cotação na base de dados
 * @param actionType O tipo de ação realizada (ex: 'view_portal', 'download_zip_specs')
 * @param clientEmail O email do cliente validado na sessão (opcional)
 * @param extraMetadata Objeto JSON com dados adicionais (ex: quantidade de ficheiros, número de folio)
 */
export const logQuoteInteraction = async (
  quoteId: string, 
  actionType: TelemetryAction, 
  clientEmail?: string | null,
  extraMetadata?: Record<string, any>
): Promise<void> => {
  try {
    // Captura o dispositivo e navegador do cliente de forma nativa
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Desconhecido';

    const { error } = await supabase.from('quote_telemetry').insert({
      quote_id: quoteId,
      action_type: actionType,
      client_email: clientEmail || 'desconhecido',
      user_agent: userAgent,
      metadata: extraMetadata || {}
    });

    if (error) {
      // O erro é registado apenas na consola para depuração interna, sem mostrar alertas ao cliente
      console.warn('[Telemetria] Erro ao registar evento no Supabase:', error.message);
    }
  } catch (err) {
    // Proteção global para evitar que a promessa rejeitada quebre a aplicação React
    console.warn('[Telemetria] Erro interno no serviço de telemetria:', err);
  }
};