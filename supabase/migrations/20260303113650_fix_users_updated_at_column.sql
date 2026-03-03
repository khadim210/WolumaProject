/*
  # Fix users table - add missing updated_at column

  1. Changes
    - Add `updated_at` column to users table
    - Set default value to now()
    - Backfill existing rows with created_at value

  2. Notes
    - The trigger `update_users_updated_at` already exists and calls `update_updated_at_column()`
    - This migration adds the missing column that the trigger expects
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN updated_at timestamptz DEFAULT now();
    
    UPDATE public.users SET updated_at = COALESCE(created_at, now()) WHERE updated_at IS NULL;
  END IF;
END $$;