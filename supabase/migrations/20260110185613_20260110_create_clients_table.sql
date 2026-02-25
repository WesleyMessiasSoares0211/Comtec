/*
  # Create clients table

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `rut` (text, unique, optional) - Chilean ID format (xx.xxx.xxx-x)
      - `nombre` (text, required)
      - `email` (text, required)
      - `telefono` (text, optional)
      - `comentarios` (text, optional)
      - `solicitud` (text, optional)
      - `estado` (text, default 'pendiente')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `clients` table
    - Public read policy for all clients
    - Public insert policy for form submissions
    - No update/delete policies (data integrity)

  3. Notes
    - RUT column is unique but optional
    - Table designed for public client/prospect submissions
    - Estado tracks submission status (pendiente, contactado, convertido)
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rut text UNIQUE,
  nombre text NOT NULL,
  email text NOT NULL,
  telefono text,
  comentarios text,
  solicitud text,
  estado text NOT NULL DEFAULT 'pendiente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON clients
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert"
  ON clients
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_rut ON clients(rut);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
