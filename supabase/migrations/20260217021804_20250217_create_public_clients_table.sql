/*
  # Create Public Clients Table (Contact Form)

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `nombre` (text) - Contact name
      - `email` (text) - Contact email
      - `empresa` (text, nullable) - Company name
      - `rut` (text, nullable) - Chilean tax ID
      - `telefono` (text, nullable) - Phone number
      - `solicitud` (text, nullable) - Request type
      - `comentarios` (text, nullable) - Additional comments
      - `estado` (text) - Status: Nuevo, Contactado, Calificado, Convertido
      - `created_at` (timestamp) - Submission date

  2. Security
    - Enable RLS on `clients` table
    - Add policy for anonymous users to insert (public contact form)
    - Add policy for authenticated users to read and manage

  3. Indexes
    - Index on `email` for fast lookups
    - Index on `estado` for filtering
    - Index on `created_at` for sorting
*/

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  empresa TEXT,
  rut TEXT,
  telefono TEXT,
  solicitud TEXT,
  comentarios TEXT,
  estado TEXT NOT NULL DEFAULT 'Nuevo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_estado CHECK (estado IN ('Nuevo', 'Contactado', 'Calificado', 'Convertido'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_estado ON public.clients(estado);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (public contact form)
CREATE POLICY "Anyone can submit contact form"
  ON public.clients
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can view all submissions
CREATE POLICY "Authenticated users can view all submissions"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can update submissions
CREATE POLICY "Authenticated users can update submissions"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete submissions
CREATE POLICY "Authenticated users can delete submissions"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
