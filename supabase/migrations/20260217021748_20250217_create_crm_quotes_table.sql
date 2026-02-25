/*
  # Create CRM Quotes Table

  1. New Tables
    - `crm_quotes`
      - `id` (uuid, primary key)
      - `folio` (text, unique) - Quote number/identifier
      - `client_id` (uuid, foreign key to crm_clients)
      - `items` (jsonb) - Array of quoted products
      - `subtotal_neto` (numeric) - Subtotal without tax
      - `iva` (numeric) - Tax amount (19%)
      - `total_bruto` (numeric) - Total with tax
      - `total` (numeric) - Alias for total_bruto
      - `estado` (text) - Status: Pendiente, Aceptada, Rechazada, Facturada
      - `created_at` (timestamp) - Creation date

  2. Security
    - Enable RLS on `crm_quotes` table
    - Add policies for authenticated users to perform CRUD operations

  3. Indexes
    - Index on `folio` for fast lookups
    - Index on `client_id` for joins
    - Index on `estado` for filtering
    - Index on `created_at` for sorting
*/

CREATE TABLE IF NOT EXISTS public.crm_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.crm_clients(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_neto NUMERIC(12, 2) NOT NULL DEFAULT 0,
  iva NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_bruto NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) GENERATED ALWAYS AS (total_bruto) STORED,
  estado TEXT NOT NULL DEFAULT 'Pendiente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_estado CHECK (estado IN ('Pendiente', 'Aceptada', 'Rechazada', 'Facturada'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crm_quotes_folio ON public.crm_quotes(folio);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_client_id ON public.crm_quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_estado ON public.crm_quotes(estado);
CREATE INDEX IF NOT EXISTS idx_crm_quotes_created_at ON public.crm_quotes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.crm_quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all quotes
CREATE POLICY "Authenticated users can view all quotes"
  ON public.crm_quotes
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create quotes
CREATE POLICY "Authenticated users can create quotes"
  ON public.crm_quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update quotes
CREATE POLICY "Authenticated users can update quotes"
  ON public.crm_quotes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete quotes
CREATE POLICY "Authenticated users can delete quotes"
  ON public.crm_quotes
  FOR DELETE
  TO authenticated
  USING (true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
