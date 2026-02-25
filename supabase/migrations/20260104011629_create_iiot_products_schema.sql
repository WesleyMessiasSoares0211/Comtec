/*
  # Create IIoT Products Schema for Comtec Industrial

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text) - Category name (Ambiental, Mecánicos, Electricidad, Seguridad)
      - `description` (text) - Category description
      - `icon` (text) - Icon identifier
      - `created_at` (timestamptz)
    
    - `products`
      - `id` (uuid, primary key)
      - `name` (text) - Product name
      - `category_id` (uuid, foreign key) - Reference to categories
      - `description` (text) - Product description
      - `price` (decimal) - Product price
      - `image_url` (text) - Product image URL
      - `protocol` (text) - Communication protocol (MQTT, Modbus, etc.)
      - `connectivity` (text) - Connectivity type (WiFi, LoRaWAN, Ethernet, etc.)
      - `sensor_type` (text) - Type of sensor
      - `specifications` (jsonb) - Technical specifications
      - `datasheet_url` (text) - URL to datasheet PDF
      - `case_studies` (jsonb) - Array of case studies
      - `featured` (boolean) - Is product featured
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add public read access policies (no authentication required for viewing products)
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  description text NOT NULL,
  price decimal(10, 2) NOT NULL,
  image_url text NOT NULL,
  protocol text NOT NULL,
  connectivity text NOT NULL,
  sensor_type text NOT NULL,
  specifications jsonb DEFAULT '{}',
  datasheet_url text DEFAULT '',
  case_studies jsonb DEFAULT '[]',
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT
  TO anon
  USING (true);