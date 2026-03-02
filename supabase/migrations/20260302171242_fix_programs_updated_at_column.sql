/*
  # Fix programs table - Add missing updated_at column

  1. Changes
    - Add `updated_at` column to `programs` table
    - Set default value to current timestamp
    - Update existing rows to have updated_at = created_at

  2. Reason
    - The table has a trigger `update_programs_updated_at` that tries to update 
      the `updated_at` column, but this column was missing from the table schema
    - This was causing "record new has no field updated_at" errors on UPDATE
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programs' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE programs ADD COLUMN updated_at timestamptz DEFAULT now();
    
    UPDATE programs SET updated_at = created_at WHERE updated_at IS NULL;
  END IF;
END $$;