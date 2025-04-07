/*
  # Create profiles table for status management

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `status` (text, not null)
      - `custom_message` (text)
      - `updated_at` (timestamptz, not null)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for authenticated users to:
      - Read all profiles
      - Update their own profile
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'offline',
  custom_message text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles
CREATE POLICY "Anyone can read profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);