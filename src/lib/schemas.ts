import { z } from 'zod';

export const clientSchema = z.object({
  rut: z.string().min(8, "RUT inválido").max(12),
  razon_social: z.string().min(3, "Razón social requerida"),
  giro: z.string().min(3, "Giro requerido"),
  email_contacto: z.string().email("Email inválido").optional().or(z.literal('')),
  telefono: z.string().optional(),
});

export const quoteItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  part_number: z.string(),
  quantity: z.number().min(1, "Mínimo 1 unidad"),
  unit_price: z.number().min(0),
  total: z.number(),
});