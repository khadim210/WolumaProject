/*
  # Ajouter le champ de verrouillage aux programmes

  1. Modifications
    - Ajouter le champ `is_locked` à la table `programs`
    - Ajouter le champ `locked_at` pour tracer quand le programme a été verrouillé
    - Ajouter le champ `locked_by` pour tracer qui a verrouillé le programme
  
  2. Objectif
    - Permettre aux administrateurs et gestionnaires de verrouiller/déverrouiller les programmes
    - Un programme verrouillé ne peut plus recevoir de nouvelles soumissions
    - Les données historiques sont préservées
*/

-- Ajouter les champs de verrouillage à la table programs
DO $$
BEGIN
  -- Ajouter le champ is_locked s'il n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programs' AND column_name = 'is_locked'
  ) THEN
    ALTER TABLE programs ADD COLUMN is_locked BOOLEAN DEFAULT false NOT NULL;
  END IF;

  -- Ajouter le champ locked_at s'il n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programs' AND column_name = 'locked_at'
  ) THEN
    ALTER TABLE programs ADD COLUMN locked_at TIMESTAMPTZ;
  END IF;

  -- Ajouter le champ locked_by s'il n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programs' AND column_name = 'locked_by'
  ) THEN
    ALTER TABLE programs ADD COLUMN locked_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Créer un index sur le champ is_locked pour les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_programs_is_locked ON programs(is_locked);

-- Commentaires pour la documentation
COMMENT ON COLUMN programs.is_locked IS 'Indique si le programme est verrouillé (pas de nouvelles soumissions)';
COMMENT ON COLUMN programs.locked_at IS 'Date et heure du verrouillage du programme';
COMMENT ON COLUMN programs.locked_by IS 'ID de l''utilisateur qui a verrouillé le programme';